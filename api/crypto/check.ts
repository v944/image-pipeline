declare var process: { env: Record<string, string | undefined> };

import { kv } from "../_shared/kv.js";
import { jsonResponse, errorResponse, corsResponse } from "../_shared/response.js";

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return corsResponse("GET, OPTIONS");
  if (request.method !== "GET") return errorResponse("METHOD_NOT_ALLOWED", "Only GET is allowed", 405);

  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId") || "";

    if (!/^[0-9a-f-]{36}$/i.test(sessionId)) {
      return errorResponse("INVALID_SESSION", "Invalid session ID", 400);
    }

    const activationData = await kv.get(`crypto:activation:${sessionId}`);
    const sessionData = await kv.get(`session:${sessionId}`);

    if (activationData && sessionData) {
      let activation: { txId: string; plan: string; amount: string; activatedAt: string } | null = null;
      let session: { tier: string } | null = null;

      try {
        activation = JSON.parse(activationData);
        session = JSON.parse(sessionData);
      } catch {
        return jsonResponse({ activated: false }, 200);
      }

      return jsonResponse({
        activated: true,
        plan: activation!.plan,
        tier: session!.tier,
        txId: activation!.txId,
        activatedAt: activation!.activatedAt,
      }, 200, { "Cache-Control": "private, max-age=30" });
    }

    return jsonResponse({ activated: false }, 200);
  } catch (error) {
    console.error("Crypto check error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to check activation", 500);
  }
}

export const config = { runtime: "edge" };
