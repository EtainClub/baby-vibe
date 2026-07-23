import { jsonError } from "@/lib/api/response";
import { isUsernameAvailable } from "@/lib/repositories/user-repository";
import { validateUsername } from "@/lib/validation/username";

export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string }> },
) {
  try {
    const { username: rawUsername } = await context.params;
    const username = validateUsername(rawUsername);
    const available = await isUsernameAvailable(username);
    return Response.json({ ok: true, data: { username, available } });
  } catch (error) {
    return jsonError(error);
  }
}
