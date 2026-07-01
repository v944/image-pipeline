declare var process: { env: Record<string, string | undefined> };

import { kv } from "./_shared/kv.js";
import { jsonResponse, errorResponse, corsResponse } from "./_shared/response.js";
import { getClientIP } from "./_shared/ip.js";

const ALLOWED_LIMIT_TYPES = new Set(["files", "nodes", "batches", "format"]);

const LIMITS: Record<string, { limit: number; windowMs: number }> = {
  files: { limit: 10, windowMs: 3600000 },
  nodes: { limit: 4, windowMs: 3600000 },
  batches: { limit: 10, windowMs: 3600000 },
  format: { limit: 2, windowMs: 86400000 },
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return corsResponse("GET, OPTIONS");
  if (request.method !== "GET") return errorResponse("METHOD_NOT_ALLOWED", "Only GET is allowed", 405);

  const clientIP = getClientIP(request);
  const requestId = request.headers.get("X-Request-ID") || crypto.randomUUID();

  try {
    const rateKey = `rate_limit:${clientIP}:check_limit`;
    const count = await kv.incr(rateKey);
    if (count === 1) await kv.expire(rateKey, 60);
    if (count > 60) {
      const ttl = await kv.ttl(rateKey);
      return errorResponse("RATE_LIMIT_EXCEEDED", "Rate limit exceeded", 429, { retryAfter: ttl });
    }

    const url = new URL(request.url);
    const sessionIdParam = url.searchParams.get("sessionId") || "";
    const limitTypeParam = url.searchParams.get("limitType") || "";

    const isValidSessionId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionIdParam);
    if (!isValidSessionId || !ALLOWED_LIMIT_TYPES.has(limitTypeParam)) {
      return errorResponse("INVALID_SCHEMA", "Invalid query parameters", 400);
    }

    const sessionData = await kv.get(`session:${sessionIdParam}`);
    let tier = "free";
    if (sessionData) {
      try {
        tier = (JSON.parse(sessionData) as { tier: string }).tier;
      } catch { /* default to free */ }
    }

    if (tier === "pro" || tier === "lifetime" || tier === "team") {
      return jsonResponse({
        allowed: true, current: 0, limit: -1, resetAt: null, tier, limitType: limitTypeParam,
      }, 200, { "X-User-Tier": tier });
    }

    const limitConfig = LIMITS[limitTypeParam];
    if (!limitConfig) {
      return errorResponse("UNKNOWN_LIMIT_TYPE", `Unknown limit type: ${limitTypeParam}`, 400);
    }

    const windowKey = `rate_limit:${clientIP}:${limitTypeParam}`;
    const now = Date.now();
    const windowStart = now - limitConfig.windowMs;

    await kv.zremrangebyscore(windowKey, 0, windowStart);
    const current = await kv.zcard(windowKey);
    const remaining = Math.max(0, limitConfig.limit - current);
    const allowed = remaining > 0;

    if (allowed) {
      await kv.zadd(windowKey, now, `${now}-${crypto.randomUUID().slice(0, 6)}`);
      await kv.expire(windowKey, Math.ceil(limitConfig.windowMs / 1000));
    }

    const resetAt = now + limitConfig.windowMs;
    const responseData: Record<string, unknown> = {
      allowed, current: allowed ? current + 1 : current,
      limit: limitConfig.limit, resetAt: new Date(resetAt).toISOString(),
      tier: "free", limitType: limitTypeParam,
    };

    if (!allowed) {
      responseData.reason = "FREE_TIER_LIMIT_REACHED";
      responseData.upgradeUrl = `${process.env.APP_URL || "https://image-pipeline.vercel.app"}/upgrade`;
    }

    return jsonResponse(responseData, 200, {
      "X-User-Tier": "free",
      "X-RateLimit-Limit": String(limitConfig.limit),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(resetAt),
    });
  } catch (error) {
    console.error(`[${requestId}] Check limit error:`, error);
    return errorResponse("INTERNAL_ERROR", "Failed to check limit", 500);
  }
}

export const config = { runtime: "edge" };
