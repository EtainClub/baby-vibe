import { AppError } from "@/lib/errors";
import { TOSS_APP_ORIGINS } from "@/lib/platform";

export function jsonError(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      { ok: false, error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  console.error(error);
  return Response.json(
    {
      ok: false,
      error: {
        code: "internal_error",
        message: "잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요.",
      },
    },
    { status: 500 },
  );
}

export async function readJson(request: Request, maxBytes = 20_000) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new AppError("unsupported_media_type", "JSON 요청만 받을 수 있어요.", 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > maxBytes) {
    throw new AppError("payload_too_large", "요청 내용이 너무 커요.", 413);
  }

  try {
    return await request.json();
  } catch {
    throw new AppError("invalid_json", "요청 내용을 읽을 수 없어요.");
  }
}

export function assertSameOrigin(request: Request) {
  // Bearer-authenticated calls (the Apps in Toss bundle) send no cookies, so
  // there is no ambient authority for another origin to ride on — the origin
  // check exists purely as CSRF defence for the cookie session.
  if (request.headers.get("authorization")?.startsWith("Bearer ")) return;

  const origin = request.headers.get("origin");
  if (!origin) return;

  let requestOrigin: string;
  try {
    requestOrigin = new URL(origin).origin;
  } catch {
    throw new AppError("invalid_origin", "허용되지 않은 요청이에요.", 403);
  }

  const forwardedHost = (
    request.headers.get("x-fh-requested-host") ||
    request.headers.get("x-forwarded-host")
  )
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || request.headers.get("host");
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const requestUrl = new URL(request.url);
  const currentOrigin = host
    ? new URL(`${forwardedProtocol || requestUrl.protocol.replace(":", "")}://${host}`)
        .origin
    : requestUrl.origin;
  // The Apps in Toss webview is served from Toss's own origin, so its requests
  // are cross-origin by construction — see TOSS_APP_ORIGINS.
  const allowedOrigins = new Set([currentOrigin, ...TOSS_APP_ORIGINS]);

  if (process.env.NEXT_PUBLIC_APP_URL) {
    allowedOrigins.add(new URL(process.env.NEXT_PUBLIC_APP_URL).origin);
  }

  if (!allowedOrigins.has(requestOrigin)) {
    throw new AppError("invalid_origin", "허용되지 않은 요청이에요.", 403);
  }
}
