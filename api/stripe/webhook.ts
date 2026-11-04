declare var process: { env: Record<string, string | undefined> };

import { kv } from "../_shared/kv.js";
import { jsonResponse, errorResponse, corsResponse } from "../_shared/response.js";
import {
  activateStripePurchase,
  alertAdminStripe,
  verifyStripeSignature,
  type StripeCheckoutSession,
} from "../_shared/stripe.js";

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return corsResponse("POST, OPTIONS");
  if (request.method !== "POST") {
    return errorResponse("METHOD_NOT_ALLOWED", "Only POST is allowed", 405);
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return errorResponse("NOT_CONFIGURED", "Stripe webhook is not configured", 500);
  }

  const payload = await request.text();
  const signatureHeader = request.headers.get("Stripe-Signature") || "";

  const verification = await verifyStripeSignature(payload, signatureHeader, webhookSecret);
  if (!verification.valid) {
    console.error("Stripe webhook signature verification failed:", verification.reason);
    return errorResponse("INVALID_SIGNATURE", "Signature verification failed", 400);
  }

  let event: { id?: string; type?: string; data?: { object?: unknown } };
  try {
    event = JSON.parse(payload) as { id?: string; type?: string; data?: { object?: unknown } };
  } catch {
    return errorResponse("INVALID_JSON", "Invalid event payload", 400);
  }
  if (!event.id || !event.type) {
    return errorResponse("INVALID_SCHEMA", "Missing event id or type", 400);
  }

  // Stripe retries failed deliveries — process each event at most once.
  const seen = await kv.setnx(`stripe:event:${event.id}`, new Date().toISOString(), 24 * 60 * 60);
  if (seen === null) {
    return jsonResponse({ received: true, duplicate: true }, 200);
  }

  if (event.type !== "checkout.session.completed") {
    return jsonResponse({ received: true, ignored: event.type }, 200);
  }

  const session = event.data?.object as StripeCheckoutSession | undefined;
  if (!session || session.object !== "checkout.session" || !session.id) {
    return jsonResponse({ received: true, ignored: "not-a-checkout-session" }, 200);
  }

  if (session.status !== "complete" || session.payment_status !== "paid") {
    return jsonResponse({
      received: true,
      ignored: `status=${session.status || "unknown"},payment_status=${session.payment_status || "unknown"}`,
    }, 200);
  }

  const activation = await activateStripePurchase(session);
  if ("error" in activation) {
    // The payment is real but cannot be matched to a plan/session — alert the
    // admin for manual handling instead of silently dropping it.
    console.error("Stripe activation failed:", activation.error, "session:", session.id);
    await alertAdminStripe(
      `⚠️ Stripe payment needs manual handling (${activation.error})`,
      `<p>A Stripe payment was captured but could not be activated automatically: <strong>${activation.error}</strong>.</p>
<p>Session: <code>${session.id}</code><br>Payment link: <code>${session.payment_link || "n/a"}</code><br>Client reference: <code>${session.client_reference_id || "n/a"}</code><br>Amount: <code>${session.amount_total ?? "n/a"} ${session.currency || ""}</code><br>Email: ${session.customer_details?.email || "n/a"}</p>`
    );
    return jsonResponse({ received: true, activated: false, error: activation.error }, 200);
  }

  return jsonResponse({
    received: true,
    activated: true,
    plan: activation.plan,
    alreadyActivated: activation.alreadyActivated,
  }, 200);
}

export const config = { runtime: "edge" };
