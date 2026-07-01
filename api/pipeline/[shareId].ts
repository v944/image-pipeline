import { kv } from "../_shared/kv.js";
import { jsonResponse, errorResponse, corsResponse } from "../_shared/response.js";
import { getClientIP } from "../_shared/ip.js";

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return corsResponse("GET, OPTIONS");
  }

  if (request.method !== "GET") {
    return errorResponse("METHOD_NOT_ALLOWED", "Only GET is allowed", 405);
  }

  const clientIP = getClientIP(request);
  const requestId = request.headers.get("X-Request-ID") || crypto.randomUUID();

  try {
    const rateKey = `rate_limit:${clientIP}:pipeline_read`;
    const count = await kv.incr(rateKey);
    if (count === 1) await kv.expire(rateKey, 60);

    if (count > 60) {
      const ttl = await kv.ttl(rateKey);
      return errorResponse("RATE_LIMIT_EXCEEDED", "Rate limit exceeded", 429, { retryAfter: ttl });
    }

    const url = new URL(request.url);
    const shareId = url.pathname.split("/").pop();

    if (!shareId || !/^[a-z0-9]{8}$/.test(shareId)) {
      return errorResponse("INVALID_SHARE_ID", "Invalid share ID format", 400);
    }

    const pipelineKey = `pipeline:${shareId}`;
    const data = await kv.get(pipelineKey);

    if (!data) {
      return errorResponse("PIPELINE_NOT_FOUND", `Pipeline '${shareId}' not found or expired`, 404);
    }

    const parsed = JSON.parse(data) as {
      pipeline: unknown;
      createdAt: string;
      expiresAt: string;
    };

    return jsonResponse({
      pipeline: parsed.pipeline,
      createdAt: parsed.createdAt,
      expiresAt: parsed.expiresAt,
    }, 200, {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "X-RateLimit-Limit": "60",
      "X-RateLimit-Remaining": String(Math.max(0, 60 - count)),
    });
  } catch (error) {
    console.error(`[${requestId}] Pipeline load error:`, error);
    return errorResponse("INTERNAL_ERROR", "Failed to load pipeline", 500);
  }
}

export const config = { runtime: "edge" };
