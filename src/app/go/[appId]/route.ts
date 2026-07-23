import { jsonError } from "@/lib/api/response";
import { recordOutboundClick } from "@/lib/repositories/stats-repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ appId: string }> },
) {
  try {
    const { appId } = await context.params;
    const url = await recordOutboundClick(appId);
    return new Response(null, {
      status: 302,
      headers: {
        Location: url,
        "Cache-Control": "no-store, private",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
