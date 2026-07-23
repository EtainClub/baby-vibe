import "server-only";

import { Agent, fetch } from "undici";
import { AppError } from "@/lib/errors";
import { validateInspectableUrl } from "@/lib/metadata/validate-url";

const MAX_REDIRECTS = 3;
const MAX_HTML_BYTES = 1_000_000;
const REQUEST_TIMEOUT_MS = 6_000;

export interface InspectedMetadata {
  url: string;
  title: string;
  description: string;
  image: string | null;
  favicon: string | null;
}

function decodeHtml(value: string) {
  const entities: Record<string, string> = {
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: " ",
  };
  return value
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&#x([\da-f]+);/gi, (_, number) =>
      String.fromCodePoint(Number.parseInt(number, 16)),
    )
    .replace(/&([a-z]+);/gi, (entity, name) => entities[name.toLowerCase()] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}

function getAttribute(tag: string, name: string) {
  const match = tag.match(
    new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  return decodeHtml(match?.[1] ?? match?.[2] ?? match?.[3] ?? "");
}

function getMeta(html: string, keys: string[]) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const key of keys) {
    const target = key.toLowerCase();
    for (const tag of tags) {
      const name = (getAttribute(tag, "property") || getAttribute(tag, "name")).toLowerCase();
      if (name === target) {
        const content = getAttribute(tag, "content");
        if (content) return content;
      }
    }
  }
  return "";
}

function getTitle(html: string) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1].replace(/<[^>]+>/g, "")) : "";
}

function getFavicon(html: string) {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const rel = getAttribute(tag, "rel").toLowerCase().split(/\s+/);
    if (rel.includes("icon")) {
      const href = getAttribute(tag, "href");
      if (href) return href;
    }
  }
  return "";
}

function absoluteUrl(value: string, base: URL) {
  if (!value) return null;
  try {
    const url = new URL(value, base);
    if (!["https:", "http:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function readLimitedHtml(response: {
  body: {
    getReader(): ReadableStreamDefaultReader<Uint8Array>;
  } | null;
}) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let html = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_HTML_BYTES) {
      await reader.cancel();
      throw new AppError("response_too_large", "앱 페이지가 너무 커서 확인하지 못했어요.", 422);
    }
    html += decoder.decode(value, { stream: true });
    if (/<\/head\s*>/i.test(html)) {
      await reader.cancel();
      break;
    }
  }
  return html + decoder.decode();
}

export async function inspectUrl(value: unknown): Promise<InspectedMetadata> {
  let currentUrl = await validateInspectableUrl(value);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const dispatcher = new Agent({
      connect: {
        lookup: (_hostname, options, callback) => {
          if (options.all) {
            callback(null, [
              {
                address: currentUrl.address,
                family: currentUrl.family,
              },
            ]);
            return;
          }
          callback(null, currentUrl.address, currentUrl.family);
        },
      },
      headersTimeout: REQUEST_TIMEOUT_MS,
      bodyTimeout: REQUEST_TIMEOUT_MS,
      maxResponseSize: MAX_HTML_BYTES + 1,
    });

    try {
      const response = await fetch(currentUrl.url, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "Moa-App-Inspector/1.0",
        },
        cache: "no-store",
        dispatcher,
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location || redirectCount === MAX_REDIRECTS) {
          throw new AppError(
            "too_many_redirects",
            "앱 주소가 너무 많이 이동해요.",
            422,
          );
        }
        currentUrl = await validateInspectableUrl(
          new URL(location, currentUrl.url).toString(),
        );
        continue;
      }

      if (!response.ok) {
        await response.body?.cancel();
        throw new AppError(
          "inspect_failed",
          `앱 페이지가 응답하지 않았어요 (${response.status}).`,
          422,
        );
      }

      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (
        !contentType.includes("text/html") &&
        !contentType.includes("application/xhtml+xml")
      ) {
        await response.body?.cancel();
        throw new AppError("not_html", "웹페이지 형식의 주소를 입력해 주세요.", 422);
      }

      const html = await readLimitedHtml(response);
      const title = getMeta(html, ["og:title", "twitter:title"]) || getTitle(html);
      const description = getMeta(html, [
        "og:description",
        "twitter:description",
        "description",
      ]);
      const image = getMeta(html, ["og:image", "twitter:image"]);
      const favicon = getFavicon(html);

      return {
        url: currentUrl.url.toString(),
        title: title.slice(0, 150),
        description: description.slice(0, 300),
        image: absoluteUrl(image, currentUrl.url),
        favicon: absoluteUrl(favicon || "/favicon.ico", currentUrl.url),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError("inspect_timeout", "앱 페이지 응답이 너무 늦어요.", 504);
      }
      throw new AppError("inspect_failed", "앱 페이지를 불러오지 못했어요.", 422);
    } finally {
      clearTimeout(timeout);
      await dispatcher.close();
    }
  }

  throw new AppError("inspect_failed", "앱 정보를 확인하지 못했어요.", 422);
}
