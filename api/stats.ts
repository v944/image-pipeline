declare var process: { env: Record<string, string | undefined> };

import { jsonResponse, errorResponse } from "./_shared/response.js";
import { kv } from "./_shared/kv.js";

const ADMIN_KEY = process.env.ADMIN_KEY;

interface Activation {
  txId?: string;
  plan?: string;
  amount?: string;
  activatedAt?: string;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return errorResponse("METHOD_NOT_ALLOWED", "Only GET is allowed", 405);

  const url = new URL(request.url);
  const key = request.headers.get("x-admin-key") || url.searchParams.get("key");
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    return errorResponse("UNAUTHORIZED", "Invalid or missing key", 401);
  }

  try {
    const activationKeys = await kv.keys("crypto:activation:*");
    const payments: Activation[] = [];
    for (const k of activationKeys) {
      const raw = await kv.get(k);
      if (!raw) continue;
      try {
        payments.push(JSON.parse(raw) as Activation);
      } catch {
        // skip malformed record
      }
    }
    payments.sort((a, b) => (b.activatedAt || "").localeCompare(a.activatedAt || ""));

    const byPlan: Record<string, number> = {};
    let totalUsdt = 0;
    for (const p of payments) {
      const plan = p.plan || "unknown";
      byPlan[plan] = (byPlan[plan] || 0) + 1;
      totalUsdt += Number(p.amount) || 0;
    }

    const sessionKeys = await kv.keys("session:*");
    const sessionsByTier: Record<string, number> = { free: 0, pro: 0, lifetime: 0 };
    for (const k of sessionKeys) {
      const raw = await kv.get(k);
      let tier = "free";
      try {
        tier = (JSON.parse(raw || "{}") as { tier?: string }).tier || "free";
      } catch {
        // keep free
      }
      sessionsByTier[tier] = (sessionsByTier[tier] || 0) + 1;
    }

    const abuseCount = (await kv.keys("abuse:*")).length;
    const pendingSubs = (await kv.keys("sub_pending:*")).length;
    const subscribers = await kv.zcard("subscribers");

    return jsonResponse({
      payments: {
        total: payments.length,
        totalUsdt,
        byPlan,
        recent: payments.slice(0, 20),
      },
      sessionsByTier,
      subscribers,
      pendingSubscriptions: pendingSubs,
      abuseEvents: abuseCount,
      generatedAt: new Date().toISOString(),
    }, 200, { "Cache-Control": "no-store" });
  } catch (error) {
    console.error("Stats error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to collect stats", 500);
  }
}

export const config = { runtime: "edge" };
