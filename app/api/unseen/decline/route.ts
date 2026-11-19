import { authenticate } from "@/lib/api-auth.server";
import { handleUnseenDecline } from "@/lib/unseen/decline-handler.server";

export const runtime = "nodejs";

/** POST /api/unseen/decline: skip the retry and record the first try's mark (spec 008 FR-020). */
export async function POST(req: Request) {
  const auth = await authenticate();
  if (auth.response) return auth.response;
  return handleUnseenDecline(req, auth.user);
}
