import { NextResponse } from "next/server";
import { assertSameOrigin, jsonError } from "@/lib/api/response";
import {
  issueVisitorCookie,
  resolveCheerIdentity,
  VISITOR_COOKIE,
} from "@/lib/cheer-identity";
import {
  cheerApp,
  getAppCheerState,
} from "@/lib/repositories/stats-repository";

export async function GET(
  request: Request,
  context: { params: Promise<{ appId: string }> },
) {
  try {
    const { key } = await resolveCheerIdentity(request);
    const { appId } = await context.params;
    return Response.json({ ok: true, data: await getAppCheerState(appId, key) });
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
    const { key, issueCookie } = await resolveCheerIdentity(request, {
      create: true,
    });

    const result = await cheerApp(appId, key);
    const response = NextResponse.json({
      ok: true,
      data: { ...result, cheered: true },
    });
    if (issueCookie) {
      response.cookies.set(VISITOR_COOKIE, key, issueVisitorCookie());
    }
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
