import { assertSameOrigin, jsonError, readJson } from "@/lib/api/response";
import { requireSessionUser } from "@/lib/auth/session";
import { createAppNote } from "@/lib/repositories/app-note-repository";
import { validateCreateAppNoteInput } from "@/lib/validation/app-note";

export async function POST(
  request: Request,
  context: { params: Promise<{ appId: string }> },
) {
  try {
    assertSameOrigin(request);
    const [user, { appId }, body] = await Promise.all([
      requireSessionUser(),
      context.params,
      readJson(request),
    ]);
    const input = validateCreateAppNoteInput(body);
    const note = await createAppNote(user.uid, appId, input);
    return Response.json({ ok: true, data: note }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
