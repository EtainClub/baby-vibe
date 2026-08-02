import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { assertSameOrigin, jsonError } from "@/lib/api/response";
import {
  cheerApp,
  getAppCheerState,
} from "@/lib/repositories/stats-repository";

const VISITOR_COOKIE = "moa_visitor";
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365;

function getVisitorId(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const visitorId = cookieHeader
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === VISITOR_COOKIE)?.[1];
  return visitorId && /^[a-zA-Z0-9_-]{20,100}$/.test(visitorId)
    ? visitorId
    : null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ appId: string }> },
) {
  try {
    const visitorId = getVisitorId(request);
    const { appId } = await context.params;
    return Response.json({
      ok: true,
      data: await getAppCheerState(appId, visitorId),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ appId: string }> },
) {
  try {
    assertSameOrigin(request);
    const { appId } = await context.params;
    const existingVisitor = getVisitorId(request);
    const visitorId =
      existingVisitor && /^[a-zA-Z0-9_-]{20,100}$/.test(existingVisitor)
        ? existingVisitor
        : randomUUID();

    const result = await cheerApp(appId, visitorId);
    const response = NextResponse.json({ ok: true, data: result });
    if (!existingVisitor) {
      response.cookies.set(VISITOR_COOKIE, visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: VISITOR_MAX_AGE,
        path: "/",
      });
    }
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
