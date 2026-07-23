import { assertSameOrigin, jsonError, readJson } from "@/lib/api/response";
import { requireSessionUser } from "@/lib/auth/session";
import {
  createUserProfile,
  getUserProfileByUid,
  updateUserProfile,
} from "@/lib/repositories/user-repository";
import {
  validateCreateProfileInput,
  validateUpdateProfileInput,
} from "@/lib/validation/profile";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const profile = await getUserProfileByUid(user.uid);
    return Response.json({ ok: true, data: profile });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireSessionUser();
    const input = validateCreateProfileInput(await readJson(request));
    const profile = await createUserProfile(user.uid, input);
    return Response.json({ ok: true, data: profile }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireSessionUser();
    const input = validateUpdateProfileInput(await readJson(request));
    const profile = await updateUserProfile(user.uid, input);
    return Response.json({ ok: true, data: profile });
  } catch (error) {
    return jsonError(error);
  }
}
