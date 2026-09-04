declare var process: { env: Record<string, string | undefined> };

import { kv } from "../_shared/kv.js";
import { jsonResponse, errorResponse, corsResponse } from "../_shared/response.js";
import { getClientIP } from "../_shared/ip.js";

const TRONSCAN_API = "https://apilist.tronscan.org/api/transaction";
const TRONGRID_API = "https://api.trongrid.io/v1/accounts";
const USDT_ADDRESS = process.env.USDT_ADDRESS || "TPenBbjw2BE1zBMot2kKrNuGgYdbPvQwDr";
const USDT_CONTRACT = process.env.USDT_CONTRACT || "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const FROM_EMAIL = process.env.RECEIPT_FROM_EMAIL || "receipts@imagepipeline.art";

const ACCEPTED_AMOUNTS: Record<string, { plan: "pro" | "lifetime"; months: number }> = {
  "10": { plan: "pro", months: 1200 },
  "30": { plan: "lifetime", months: 1200 },
};

interface Trc20Transfer {
  to_address: string;
  amount_str: string;
  transaction_id: string;
  block_ts: number;
  contract_address?: string;
}

interface TronscanResponse {
  data?: { trc20Transfers?: Trc20Transfer[] }[];
}

interface TrongridTransfer {
  transaction_id: string;
  value: string;
  to_address: string;
  block_timestamp: number;
  token_info?: { address?: string; name?: string; symbol?: string };
}

interface TrongridResponse {
  data?: TrongridTransfer[];
  meta?: { page_size: number; fingerprint?: string };
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return corsResponse("POST, OPTIONS");
  if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", "Only POST is allowed", 405);

  const clientIP = getClientIP(request);
  const requestId = crypto.randomUUID();

  try {
    const rateKey = `rate_limit:${clientIP}:crypto_verify`;
    const count = await kv.incr(rateKey);
    if (count === 1) await kv.expire(rateKey, 60);
    if (count > 5) {
      const ttl = await kv.ttl(rateKey);
      await kv.set(`abuse:${clientIP}:crypto_verify:${Date.now()}`, JSON.stringify({ ip: clientIP, limitType: "crypto_verify", timestamp: Date.now() }), 86400 * 30);
      return errorResponse("RATE_LIMIT_EXCEEDED", "Rate limit exceeded: 5 verifications per minute", 429, { retryAfter: ttl });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
    }

    const sessionId = typeof body.sessionId === "string" && /^[0-9a-f-]{36}$/i.test(body.sessionId) ? body.sessionId : null;
    const expectedAmount = typeof body.expectedAmount === "number" ? String(Math.floor(body.expectedAmount)) : null;
    const txId = typeof body.txId === "string" && /^[0-9a-f]{64}$/i.test(body.txId) ? body.txId : null;

    if (!sessionId || !expectedAmount || !txId) {
      return errorResponse("INVALID_SCHEMA", "sessionId (uuid), expectedAmount (number), and txId (64-char hex) are required", 400);
    }

    const planConfig = ACCEPTED_AMOUNTS[expectedAmount];
    if (!planConfig) {
      return errorResponse("INVALID_AMOUNT", "Accepted amounts: 10 (Pro), 30 (Lifetime) USDT", 400);
    }

    const dupKey = `crypto:tx:${txId}`;
    const isNew = await kv.setnx(dupKey, sessionId, 86400 * 90);
    if (!isNew) {
      return errorResponse("TX_ALREADY_USED", "This transaction has already been used for verification", 400);
    }

    const sessionVerifyKey = `crypto:attempts:${sessionId}`;
    const attemptCount = await kv.incr(sessionVerifyKey);
    if (attemptCount === 1) await kv.expire(sessionVerifyKey, 86400);
    if (attemptCount > 10) {
      return errorResponse("TOO_MANY_ATTEMPTS", "Too many verification attempts for this session. Try again later.", 429);
    }

    const minTimestamp = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const minAmountWei = (parseInt(expectedAmount) * 1_000_000).toString();

    let matched = false;
    let usingFallback = false;

    const tryTronScan = async (): Promise<boolean> => {
      const url = `${TRONSCAN_API}?sort=-timestamp&limit=30&address=${USDT_ADDRESS}&start_timestamp=${minTimestamp}&count=true`;
      const res = await fetch(url, { headers: { "Accept": "application/json" } });
      if (!res.ok) return false;
      const json = await res.json() as TronscanResponse;
      for (const item of json.data || []) {
        const transfers = item.trc20Transfers || [];
        for (const tx of transfers) {
          if (tx.transaction_id.toLowerCase() !== txId.toLowerCase()) continue;
          const toAddress = tx.to_address?.toLowerCase() || "";
          const contractAddress = tx.contract_address?.toLowerCase() || "";
          if (toAddress !== USDT_ADDRESS.toLowerCase()) continue;
          if (contractAddress && contractAddress !== USDT_CONTRACT.toLowerCase()) continue;
          const txAmount = parseInt(tx.amount_str);
          if (txAmount >= parseInt(minAmountWei)) return true;
        }
      }
      return false;
    };

    const tryTrongrid = async (): Promise<boolean> => {
      const url = `${TRONGRID_API}/${USDT_ADDRESS}/transactions/trc20?only_to=true&min_timestamp=${minTimestamp}&limit=30`;
      const res = await fetch(url, { headers: { "Accept": "application/json", "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY || "" } });
      if (!res.ok) return false;
      const json = await res.json() as TrongridResponse;
      for (const tx of json.data || []) {
        if (tx.transaction_id.toLowerCase() !== txId.toLowerCase()) continue;
        if ((tx.to_address || "").toLowerCase() !== USDT_ADDRESS.toLowerCase()) continue;
        const contractAddress = tx.token_info?.address || "";
        if (contractAddress && contractAddress.toLowerCase() !== USDT_CONTRACT.toLowerCase()) continue;
        const txAmount = parseInt(tx.value);
        if (txAmount >= parseInt(minAmountWei)) return true;
      }
      return false;
    };

    matched = await tryTronScan();
    if (!matched) {
      console.info(`[${requestId}] TronScan: not found, trying Trongrid fallback...`);
      matched = await tryTrongrid();
      if (matched) usingFallback = true;
    }

    if (!matched) {
      await kv.del(dupKey);
      return jsonResponse({
        verified: false,
        message: "Transaction not found. Check the TxID, amount, and recipient address.",
        fallbackUsed: usingFallback,
      }, 200);
    }

    await kv.set(`session:${sessionId}`, JSON.stringify({
      sessionId,
      tier: planConfig.plan,
      lastActive: new Date().toISOString(),
    }), 30 * 24 * 60 * 60);

    await kv.set(`crypto:activation:${sessionId}`, JSON.stringify({
      txId,
      plan: planConfig.plan,
      amount: expectedAmount,
      activatedAt: new Date().toISOString(),
    }), 30 * 24 * 60 * 60);

    console.info(`[${requestId}] Activation successful via ${usingFallback ? "Trongrid" : "TronScan"}: session=${sessionId}, tier=${planConfig.plan}`);

    if (ADMIN_EMAIL && RESEND_API_KEY) {
      try {
        const planLabel = planConfig.plan === "lifetime" ? "Lifetime" : "Pro";
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `Image Pipeline <${FROM_EMAIL}>`,
            to: [ADMIN_EMAIL],
            subject: `💰 Payment: ${planLabel} — ${expectedAmount} USDT`,
            html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0D0D14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D14;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#1A1A24;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.08);">
          <tr>
            <td align="center" style="padding-bottom:16px;"><span style="font-size:36px;">💰</span></td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:8px;">
              <h1 style="color:#F5F5F5;font-size:20px;margin:0;">New Payment Received</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <p style="color:#9CA3AF;font-size:13px;margin:0;">A user has activated the <strong style="color:#F59E0B;">${planLabel}</strong> plan.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#0D0D14;border-radius:12px;padding:16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#9CA3AF;font-size:12px;padding-bottom:6px;">Plan</td>
                  <td align="right" style="color:#F5F5F5;font-size:12px;font-weight:600;">${planLabel}</td>
                </tr>
                <tr>
                  <td style="color:#9CA3AF;font-size:12px;padding-bottom:6px;">Amount</td>
                  <td align="right" style="color:#F59E0B;font-size:12px;font-weight:600;">${expectedAmount} USDT</td>
                </tr>
                <tr>
                  <td style="color:#9CA3AF;font-size:12px;padding-bottom:6px;">Network</td>
                  <td align="right" style="color:#F5F5F5;font-size:12px;font-weight:400;">TRC-20</td>
                </tr>
                <tr>
                  <td style="color:#9CA3AF;font-size:12px;padding-bottom:6px;">TxID</td>
                  <td align="right" style="color:#9CA3AF;font-size:11px;word-break:break-all;max-width:260px;">${txId}</td>
                </tr>
                <tr>
                  <td style="color:#9CA3AF;font-size:12px;padding-bottom:6px;">Session</td>
                  <td align="right" style="color:#9CA3AF;font-size:11px;">${sessionId}</td>
                </tr>
                <tr>
                  <td style="color:#9CA3AF;font-size:12px;">Time</td>
                  <td align="right" style="color:#9CA3AF;font-size:11px;">${new Date().toISOString()}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:20px;">
              <a href="https://tronscan.org/#/transaction/${txId}" style="display:inline-block;background:#F59E0B;color:#000;text-decoration:none;font-size:13px;font-weight:600;padding:10px 24px;border-radius:10px;">
                View on Tronscan
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
          }),
        });
      } catch (e) {
        console.error(`[${requestId}] Admin email notification failed:`, e);
      }
    }

    return jsonResponse({
      verified: true,
      plan: planConfig.plan,
      fallbackUsed: usingFallback,
      message: `Payment confirmed! ${planConfig.plan === "lifetime" ? "Lifetime" : "Pro"} plan activated.`,
    }, 200);
  } catch (error) {
    console.error(`[${requestId}] Crypto verify error:`, error);
    return errorResponse("INTERNAL_ERROR", "Verification failed", 500);
  }
}

export const config = { runtime: "edge" };
