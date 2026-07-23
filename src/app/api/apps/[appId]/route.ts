import { assertSameOrigin, jsonError, readJson } from "@/lib/api/response";
import { requireSessionUser } from "@/lib/auth/session";
import {
  deleteApp,
  updateApp,
} from "@/lib/repositories/app-repository";
import { validateUpdateAppInput } from "@/lib/validation/app";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ appId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireSessionUser();
    const { appId } = await context.params;
    const input = validateUpdateAppInput(await readJson(request));
    const app = await updateApp(user.uid, appId, input);
    return Response.json({ ok: true, data: app });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ appId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireSessionUser();
    const { appId } = await context.params;
    await deleteApp(user.uid, appId);
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
