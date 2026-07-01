import { kv } from "../_shared/kv.js";
import { jsonResponse, errorResponse, corsResponse } from "../_shared/response.js";
import { getClientIP } from "../_shared/ip.js";

const TRONSCAN_API = "https://apilist.tronscan.org/api/transaction";
const USDT_ADDRESS = process.env.USDT_ADDRESS || "TPenBbjw2BE1zBMot2kKrNuGgYdbPvQwDr";
const USDT_CONTRACT = process.env.USDT_CONTRACT || "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

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
    const url = `${TRONSCAN_API}?sort=-timestamp&limit=30&address=${USDT_ADDRESS}&start_timestamp=${minTimestamp}&count=true`;

    const tronResponse = await fetch(url, {
      headers: { "Accept": "application/json" },
    });

    if (!tronResponse.ok) {
      console.error(`[${requestId}] TronScan API error: ${tronResponse.status}`);
      return errorResponse("VERIFICATION_FAILED", "Could not verify transaction. Please try again.", 502);
    }

    const json = await tronResponse.json() as TronscanResponse;
    let matched = false;

    for (const item of json.data || []) {
      const transfers = item.trc20Transfers || [];
      for (const tx of transfers) {
        if (tx.transaction_id.toLowerCase() !== txId.toLowerCase()) continue;
        const toAddress = tx.to_address?.toLowerCase() || "";
        const contractAddress = tx.contract_address?.toLowerCase() || "";
        if (toAddress !== USDT_ADDRESS.toLowerCase()) continue;
        if (contractAddress && contractAddress !== USDT_CONTRACT.toLowerCase()) continue;
        const txAmount = parseInt(tx.amount_str);
        if (txAmount >= parseInt(minAmountWei)) {
          matched = true;
          break;
        }
      }
      if (matched) break;
    }

    if (!matched) {
      await kv.del(dupKey);
      return jsonResponse({
        verified: false,
        message: "Transaction not found. Check the TxID, amount, and recipient address.",
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

    return jsonResponse({
      verified: true,
      plan: planConfig.plan,
      message: `Payment confirmed! ${planConfig.plan === "lifetime" ? "Lifetime" : "Pro"} plan activated.`,
    }, 200);
  } catch (error) {
    console.error(`[${requestId}] Crypto verify error:`, error);
    return errorResponse("INTERNAL_ERROR", "Verification failed", 500);
  }
}

export const config = { runtime: "edge" };
