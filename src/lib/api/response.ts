import { AppError } from "@/lib/errors";

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
  const origin = request.headers.get("origin");
  if (!origin) return;

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const requestProtocol = new URL(request.url).protocol.replace(":", "");
  const inferredOrigin = host
    ? `${forwardedProtocol || requestProtocol}://${host}`
    : new URL(request.url).origin;
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin
    : new URL(inferredOrigin).origin;

  if (new URL(origin).origin !== allowedOrigin) {
    throw new AppError("invalid_origin", "허용되지 않은 요청이에요.", 403);
  }
}
