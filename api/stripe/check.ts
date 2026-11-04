declare var process: { env: Record<string, string | undefined> };

import { jsonResponse, errorResponse, corsResponse } from "../_shared/response.js";
import { getClientIP } from "../_shared/ip.js";
import { kv } from "../_shared/kv.js";
import {
  activateStripePurchase,
  alertAdminStripe,
  CHECKOUT_SESSION_ID_RE,
  stripeGetCheckoutSession,
} from "../_shared/stripe.js";

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return corsResponse("GET, OPTIONS");
  if (request.method !== "GET") {
    return errorResponse("METHOD_NOT_ALLOWED", "Only GET is allowed", 405);
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return jsonResponse({ configured: false, paid: false }, 200);
  }

  const clientIP = getClientIP(request);
  const rateKey = `rate_limit:${clientIP}:stripe_check`;
  const count = await kv.incr(rateKey);
  if (count === 1) await kv.expire(rateKey, 60);
  if (count > 30) {
    return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests.", 429);
  }

  const url = new URL(request.url);
  const csId = url.searchParams.get("session_id") || "";
  if (!CHECKOUT_SESSION_ID_RE.test(csId)) {
    return errorResponse("INVALID_SCHEMA", "session_id (cs_...) is required", 400);
  }

  const { ok, status, session } = await stripeGetCheckoutSession(csId);
  if (!ok || !session) {
    if (status === 404) return jsonResponse({ paid: false, status: "unknown" }, 200);
    return errorResponse("STRIPE_UNAVAILABLE", "Could not reach Stripe. Try again later.", 502);
  }

  if (session.status !== "complete" || session.payment_status !== "paid") {
    return jsonResponse({
      paid: false,
      status: session.status === "expired" ? "expired" : (session.status || "open"),
    }, 200);
  }

  const activation = await activateStripePurchase(session);
  if ("error" in activation) {
    console.error("Stripe activation failed:", activation.error, "session:", csId);
    await alertAdminStripe(
      `⚠️ Stripe payment needs manual handling (${activation.error})`,
      `<p>A paid Stripe session was found via the status check but could not be activated: <strong>${activation.error}</strong>.</p>
<p>Session: <code>${csId}</code><br>Payment link: <code>${session.payment_link || "n/a"}</code></p>`
    );
    return errorResponse("ACTIVATION_FAILED", activation.error, 500);
  }

  return jsonResponse({ paid: true, plan: activation.plan }, 200);
}

export const config = { runtime: "edge" };
