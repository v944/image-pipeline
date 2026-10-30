declare var process: { env: Record<string, string | undefined> };

import { kv } from "../_shared/kv.js";
import { jsonResponse, errorResponse, corsResponse } from "../_shared/response.js";
import { getClientIP } from "../_shared/ip.js";

const API_BASE = (process.env.CRYPTOBOT_API_URL || "https://pay.crypt.bot/api").replace(/\/$/, "");
const API_TOKEN = process.env.CRYPTOBOT_API_TOKEN;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const FROM_EMAIL = process.env.RECEIPT_FROM_EMAIL || "receipts@imagepipeline.art";

const PLANS: Record<string, { usdt: string; label: string }> = {
  pro: { usdt: "10", label: "Pro" },
  lifetime: { usdt: "30", label: "Lifetime" },
};

const INVOICE_TTL = 7 * 24 * 60 * 60;
const SESSION_TTL = 30 * 24 * 60 * 60;

interface CryptoInvoice {
  invoice_id?: number;
  hash?: string;
  status?: string;
  pay_url?: string;
  bot_invoice_url?: string;
  paid_at?: string;
}

interface CbResponse {
  ok?: boolean;
  result?: unknown;
  error?: { name?: string; code?: number };
}

async function cbApi(method: string, params: Record<string, string>): Promise<CbResponse> {
  const res = await fetch(`${API_BASE}/${method}`, {
    method: "POST",
    headers: {
      "Crypto-Pay-API-Token": API_TOKEN || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  return await res.json() as CbResponse;
}

async function notifyAdmin(plan: string, amount: string, ref: string): Promise<void> {
  if (!ADMIN_EMAIL || !RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Image Pipeline <${FROM_EMAIL}>`,
        to: [ADMIN_EMAIL],
        subject: `💰 Payment (CryptoBot): ${plan} — ${amount} USDT`,
        html: `<p>New payment via <strong>CryptoBot</strong>.</p>
<p>Plan: <strong>${plan}</strong><br>Amount: <strong>${amount} USDT</strong><br>Invoice: <code>${ref}</code><br>Time: ${new Date().toISOString()}</p>`,
      }),
    });
  } catch {
    // notification failure must not break activation
  }
}

async function activate(plan: string, sessionId: string, ref: string, amount: string): Promise<void> {
  await kv.set(`session:${sessionId}`, JSON.stringify({
    sessionId,
    tier: plan,
    lastActive: new Date().toISOString(),
  }), SESSION_TTL);

  await kv.set(`crypto:activation:${sessionId}`, JSON.stringify({
    txId: ref,
    plan,
    amount,
    activatedAt: new Date().toISOString(),
  }), SESSION_TTL);

  await notifyAdmin(plan, amount, ref);
}

async function getInvoice(invoiceId: number): Promise<CryptoInvoice | null> {
  const res = await cbApi("getInvoices", { invoice_ids: String(invoiceId) });
  if (!res.ok || !res.result) return null;
  const result = res.result as { items?: CryptoInvoice[] } | CryptoInvoice[];
  const list = Array.isArray(result) ? result : (result.items || []);
  return list.find((inv) => inv.invoice_id === invoiceId) || null;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return corsResponse("GET, POST, OPTIONS");

  const clientIP = getClientIP(request);

  if (!API_TOKEN) {
    return jsonResponse({ configured: false, message: "CryptoBot payments are not configured." }, 200);
  }

  try {
    if (request.method === "POST") {
      const rateKey = `rate_limit:${clientIP}:tg_pay_create`;
      const count = await kv.incr(rateKey);
      if (count === 1) await kv.expire(rateKey, 60);
      if (count > 10) {
        const ttl = await kv.ttl(rateKey);
        return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests. Try again later.", 429, { retryAfter: ttl });
      }

      let body: Record<string, unknown>;
      try {
        body = await request.json() as Record<string, unknown>;
      } catch {
        return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
      }

      const tier = typeof body.tier === "string" && PLANS[body.tier] ? body.tier : null;
      const sessionId = typeof body.sessionId === "string" && /^[0-9a-f-]{36}$/i.test(body.sessionId) ? body.sessionId : null;
      if (!tier || !sessionId) {
        return errorResponse("INVALID_SCHEMA", "tier (pro|lifetime) and sessionId (uuid) are required", 400);
      }

      const plan = PLANS[tier];
      const res = await cbApi("createInvoice", {
        asset: "USDT",
        amount: plan.usdt,
        description: `Image Pipeline ${plan.label} — one-time`,
        payload: sessionId,
      });

      if (!res.ok || !res.result) {
        console.error("CryptoBot createInvoice error:", JSON.stringify(res.error || res));
        return errorResponse("CRYPTOBOT_ERROR", "Could not create invoice. Try again later.", 502);
      }

      const invoice = res.result as CryptoInvoice;
      if (!invoice.hash || !invoice.invoice_id) {
        return errorResponse("CRYPTOBOT_ERROR", "Unexpected CryptoBot response.", 502);
      }

      await kv.set(`tg_invoice:${invoice.hash}`, JSON.stringify({
        invoiceId: invoice.invoice_id,
        sessionId,
        plan: tier,
        amount: plan.usdt,
        activated: false,
        createdAt: new Date().toISOString(),
      }), INVOICE_TTL);

      return jsonResponse({
        configured: true,
        hash: invoice.hash,
        invoiceId: invoice.invoice_id,
        url: invoice.pay_url || invoice.bot_invoice_url || `https://t.me/CryptoBot?start=iv_${invoice.hash}`,
      }, 200);
    }

    if (request.method === "GET") {
      const rateKey = `rate_limit:${clientIP}:tg_pay_check`;
      const count = await kv.incr(rateKey);
      if (count === 1) await kv.expire(rateKey, 60);
      if (count > 30) {
        return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests.", 429);
      }

      const url = new URL(request.url);
      const hash = url.searchParams.get("hash") || "";
      const sessionId = url.searchParams.get("sessionId") || "";

      if (!/^[A-Za-z0-9_-]{6,64}$/.test(hash) || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
        return errorResponse("INVALID_SCHEMA", "hash and sessionId are required", 400);
      }

      const raw = await kv.get(`tg_invoice:${hash}`);
      if (!raw) return jsonResponse({ paid: false, status: "unknown" }, 200);
      const record = JSON.parse(raw) as { invoiceId: number; sessionId: string; plan: string; amount: string; activated: boolean };
      if (record.sessionId !== sessionId) {
        return errorResponse("FORBIDDEN", "Session mismatch", 403);
      }
      if (record.activated) {
        return jsonResponse({ paid: true, plan: record.plan }, 200);
      }

      const invoice = await getInvoice(record.invoiceId);
      if (!invoice) return jsonResponse({ paid: false, status: "unknown" }, 200);

      const paid = invoice.status === "paid" || !!invoice.paid_at;
      if (paid) {
        await activate(record.plan, sessionId, `cryptobot:${hash}`, record.amount);
        await kv.set(`tg_invoice:${hash}`, JSON.stringify({ ...record, activated: true }), INVOICE_TTL);
        return jsonResponse({ paid: true, plan: record.plan }, 200);
      }

      return jsonResponse({ paid: false, status: invoice.status === "expired" ? "expired" : "active" }, 200);
    }

    return errorResponse("METHOD_NOT_ALLOWED", "Only GET and POST are allowed", 405);
  } catch (error) {
    console.error("Telegram pay error:", error);
    return errorResponse("INTERNAL_ERROR", "Telegram pay failed", 500);
  }
}

export const config = { runtime: "edge" };
