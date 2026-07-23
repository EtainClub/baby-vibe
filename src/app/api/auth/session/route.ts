import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session";
import { getAdminAuth } from "@/lib/firebase/admin";
import { assertSameOrigin, jsonError, readJson } from "@/lib/api/response";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = (await readJson(request, 10_000)) as Record<string, unknown>;
    if (typeof body.idToken !== "string" || body.idToken.length > 10_000) {
      throw new AppError("invalid_token", "Google 로그인 정보를 확인해 주세요.", 401);
    }

    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(body.idToken, true);
    const authTime = Number(decoded.auth_time ?? 0);
    if (Date.now() / 1000 - authTime > 5 * 60) {
      throw new AppError("recent_login_required", "Google로 다시 로그인해 주세요.", 401);
    }

    const expiresIn = SESSION_MAX_AGE_SECONDS * 1000;
    const sessionCookie = await auth.createSessionCookie(body.idToken, { expiresIn });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });
    return response;
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    });
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
