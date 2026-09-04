import { assertSameOrigin, jsonError, readJson } from "@/lib/api/response";
import { requireSessionUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getUserProfileByUid } from "@/lib/repositories/user-repository";
import {
  hasRecoveryKey,
  issueRecoveryKey,
  resolveRecoveryKey,
} from "@/lib/repositories/recovery-repository";

/** Whether this account already has a recovery key, for the settings UI. */
export async function GET() {
  try {
    const user = await requireSessionUser();
    return Response.json({
      ok: true,
      data: { hasRecoveryKey: await hasRecoveryKey(user.uid) },
    });
  } catch (error) {
    return jsonError(error);
  }
}

/** Issues (or re-issues) a recovery key. The plaintext is returned once. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireSessionUser();
    return Response.json({ ok: true, data: await issueRecoveryKey(user.uid) });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * Redeems a recovery key: mints a custom token for the account the key points
 * at, so the caller's device can sign in as it. The throwaway anonymous account
 * the caller arrived with is deleted, since nothing else can reach it again.
 */
export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const caller = await requireSessionUser();
    const body = (await readJson(request, 2_000)) as Record<string, unknown>;
    if (typeof body.code !== "string" || body.code.length > 64) {
      throw new AppError("invalid_recovery_key", "복구 키를 입력해 주세요.", 400);
    }

    const targetUid = await resolveRecoveryKey(body.code);
    const auth = getAdminAuth();

    if (caller.uid !== targetUid) {
      const [callerRecord, callerProfile] = await Promise.all([
        auth.getUser(caller.uid).catch(() => null),
        getUserProfileByUid(caller.uid),
      ]);
      // Only discard a genuinely throwaway session. An anonymous account that
      // already has a profile owns apps and notes, and deleting it here would
      // orphan them where nobody can ever reach them again.
      if (callerRecord?.providerData.length === 0 && !callerProfile) {
        await auth.deleteUser(caller.uid).catch(() => undefined);
      }
    }

    const token = await auth.createCustomToken(targetUid);
    return Response.json({ ok: true, data: { token, uid: targetUid } });
  } catch (error) {
    return jsonError(error);
  }
}
