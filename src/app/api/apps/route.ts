import { assertSameOrigin, jsonError, readJson } from "@/lib/api/response";
import { requireSessionUser } from "@/lib/auth/session";
import {
  createApp,
  listAppsForOwner,
} from "@/lib/repositories/app-repository";
import { validateCreateAppInput } from "@/lib/validation/app";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const apps = await listAppsForOwner(user.uid);
    return Response.json({ ok: true, data: apps });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireSessionUser();
    const input = validateCreateAppInput(await readJson(request));
    const app = await createApp(user.uid, input);
    return Response.json({ ok: true, data: app }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
