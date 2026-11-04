declare var process: { env: Record<string, string | undefined> };

import { kv } from "./kv.js";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const CHECKOUT_SESSION_ID_RE = /^cs_(live|test)_[A-Za-z0-9]+$/;

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
const RECORD_TTL_SECONDS = 10 * 365 * 24 * 60 * 60;
const SIGNATURE_TOLERANCE_SECONDS = 300;

export interface StripeCheckoutSession {
  id?: string;
  object?: string;
  status?: string;
  payment_status?: string;
  client_reference_id?: string | null;
  payment_link?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  customer_details?: { email?: string | null } | null;
}

export function planFromPaymentLink(paymentLink: string | null | undefined): "pro" | "lifetime" | null {
  if (!paymentLink) return null;
  if (paymentLink === process.env.STRIPE_PRO_PAYMENT_LINK) return "pro";
  if (paymentLink === process.env.STRIPE_LIFETIME_PAYMENT_LINK) return "lifetime";
  return null;
}

// Fallback when the payment link ids are not configured: the links have fixed
// prices, so the paid amount identifies the plan.
const PLAN_AMOUNT_CENTS: Record<string, number> = {
  pro: 1000,
  lifetime: 3000,
};

export function planFromAmount(amountTotal: number | null | undefined): "pro" | "lifetime" | null {
  if (typeof amountTotal !== "number") return null;
  if (amountTotal === PLAN_AMOUNT_CENTS.pro) return "pro";
  if (amountTotal === PLAN_AMOUNT_CENTS.lifetime) return "lifetime";
  return null;
}

export function resolvePlan(session: StripeCheckoutSession): "pro" | "lifetime" | null {
  return planFromPaymentLink(session.payment_link) ?? planFromAmount(session.amount_total);
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verifies a Stripe-Signature header (t=...,v1=...) against the webhook
 * signing secret. Web Crypto only — works on the Vercel edge runtime.
 */
export async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): Promise<{ valid: boolean; reason?: string }> {
  const parts = new Map<string, string[]>();
  for (const item of signatureHeader.split(",")) {
    const idx = item.indexOf("=");
    if (idx === -1) continue;
    const key = item.slice(0, idx).trim();
    const value = item.slice(idx + 1).trim();
    const list = parts.get(key) ?? [];
    list.push(value);
    parts.set(key, list);
  }

  const timestamps = parts.get("t");
  const signatures = parts.get("v1");
  if (!timestamps?.[0] || !signatures || signatures.length === 0) {
    return { valid: false, reason: "malformed-signature-header" };
  }

  const timestamp = Number.parseInt(timestamps[0], 10);
  if (!Number.isFinite(timestamp)) {
    return { valid: false, reason: "malformed-timestamp" };
  }
  if (Math.abs(nowSeconds - timestamp) > SIGNATURE_TOLERANCE_SECONDS) {
    return { valid: false, reason: "timestamp-outside-tolerance" };
  }

  let rawSecret: string;
  try {
    rawSecret = atob(secret);
  } catch {
    return { valid: false, reason: "malformed-secret" };
  }
  const keyBytes = new Uint8Array(rawSecret.length);
  for (let i = 0; i < rawSecret.length; i++) {
    keyBytes[i] = rawSecret.charCodeAt(i);
  }

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signedPayload = new Uint8Array(new TextEncoder().encode(`${timestamps[0]}.${payload}`));
  const digest = await crypto.subtle.sign("HMAC", cryptoKey, signedPayload);
  const expectedHex = toHex(new Uint8Array(digest));

  for (const signature of signatures) {
    if (constantTimeEqual(signature.toLowerCase(), expectedHex)) {
      return { valid: true };
    }
  }
  return { valid: false, reason: "signature-mismatch" };
}

export async function stripeGetCheckoutSession(
  csId: string
): Promise<{ ok: boolean; status: number; session?: StripeCheckoutSession }> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return { ok: false, status: 500 };
  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(csId)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (res.status === 404) return { ok: false, status: 404 };
    if (!res.ok) return { ok: false, status: res.status };
    const session = await res.json() as StripeCheckoutSession;
    return { ok: true, status: 200, session };
  } catch {
    return { ok: false, status: 502 };
  }
}

function formatAmount(amountTotal: number | null | undefined, currency: string | null | undefined): string {
  if (typeof amountTotal !== "number" || !currency) return "unknown amount";
  return `${(amountTotal / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

async function sendAdminEmail(subject: string, html: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!resendKey || !adminEmail) return;
  const fromEmail = process.env.RECEIPT_FROM_EMAIL || "receipts@imagepipeline.art";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Image Pipeline <${fromEmail}>`,
        to: [adminEmail],
        subject,
        html,
      }),
    });
  } catch {
    // notification failure must not break activation
  }
}

export async function notifyAdminStripe(plan: string, amountLabel: string, csId: string, email: string): Promise<void> {
  await sendAdminEmail(
    `💰 Payment (Stripe): ${plan} — ${amountLabel}`,
    `<p>New payment via <strong>Stripe</strong>.</p>
<p>Plan: <strong>${plan}</strong><br>Amount: <strong>${amountLabel}</strong><br>Session: <code>${csId}</code><br>Email: ${email || "n/a"}<br>Time: ${new Date().toISOString()}</p>`
  );
}

export async function alertAdminStripe(subject: string, html: string): Promise<void> {
  await sendAdminEmail(subject, html);
}

export type StripeActivation =
  | { plan: "pro" | "lifetime"; alreadyActivated: boolean }
  | { error: string };

/**
 * Records a paid Stripe checkout in KV using the same schema as the crypto
 * flows: session tier, per-checkout receipt, and email recovery record.
 * Idempotent — repeated calls (webhook + status poll) do not duplicate
 * activation side effects.
 */
export async function activateStripePurchase(session: StripeCheckoutSession): Promise<StripeActivation> {
  const csId = typeof session.id === "string" ? session.id : "";
  if (!csId) return { error: "missing-session-id" };

  const plan = resolvePlan(session);
  if (!plan) return { error: "unknown-plan" };

  const sessionId = typeof session.client_reference_id === "string" ? session.client_reference_id : "";
  if (!UUID_RE.test(sessionId)) return { error: "invalid-client-reference-id" };

  const existing = await kv.get(`stripe:checkout:${csId}`);
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as { activated?: boolean; plan?: string };
      if (parsed.activated) {
        return { plan: parsed.plan === "lifetime" ? "lifetime" : "pro", alreadyActivated: true };
      }
    } catch {
      // malformed record — fall through and (re)activate
    }
  }

  const email = session.customer_details?.email?.trim().toLowerCase() || "";
  const now = new Date().toISOString();

  await kv.set(`session:${sessionId}`, JSON.stringify({
    sessionId,
    tier: plan,
    lastActive: now,
  }), SESSION_TTL_SECONDS);

  await kv.set(`stripe:checkout:${csId}`, JSON.stringify({
    sessionId,
    plan,
    email,
    amountTotal: session.amount_total ?? null,
    currency: session.currency ?? null,
    paymentLink: session.payment_link ?? null,
    activated: true,
    activatedAt: now,
  }), RECORD_TTL_SECONDS);

  if (email) {
    await kv.set(`recovery:${email}`, JSON.stringify({
      sessionId,
      plan,
      txId: csId,
      createdAt: now,
    }), RECORD_TTL_SECONDS);
  }

  await notifyAdminStripe(plan, formatAmount(session.amount_total, session.currency), csId, email);
  return { plan, alreadyActivated: false };
}
