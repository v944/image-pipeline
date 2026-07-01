import { kv } from "./_shared/kv.js";
import { jsonResponse, errorResponse, corsResponse } from "./_shared/response.js";
import { getClientIP } from "./_shared/ip.js";

const ALLOWED_EVENT_REGEX = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)*$/;
const ALLOWED_PROPERTY_KEYS = new Set([
  "fileCount", "nodeTypes", "nodeCount", "totalSizeMB",
  "durationMs", "exportFormat", "limitType", "clientVersion", "platform",
]);

function sanitizeProperties(props: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    if (ALLOWED_PROPERTY_KEYS.has(key)) {
      const v = props[key];
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null) {
        sanitized[key] = v;
      } else if (Array.isArray(v)) {
        sanitized[key] = v.filter((x) => typeof x === "string").slice(0, 20);
      }
    }
  }
  return sanitized;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return corsResponse("POST, OPTIONS");
  if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", "Only POST is allowed", 405);

  const clientIP = getClientIP(request);
  const requestId = request.headers.get("X-Request-ID") || crypto.randomUUID();

  try {
    const rateKey = `rate_limit:${clientIP}:event`;
    const count = await kv.incr(rateKey);
    if (count === 1) await kv.expire(rateKey, 60);
    if (count > 100) {
      const ttl = await kv.ttl(rateKey);
      return errorResponse("RATE_LIMIT_EXCEEDED", "Rate limit exceeded: 100 events per minute", 429, { retryAfter: ttl });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
    }

    const event = typeof body.event === "string" && body.event.length >= 1 && body.event.length <= 64 && ALLOWED_EVENT_REGEX.test(body.event) ? body.event : null;
    const sessionId = typeof body.sessionId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.sessionId) ? body.sessionId : null;
    const timestamp = typeof body.timestamp === "number" && Number.isInteger(body.timestamp) && Math.abs(Date.now() - body.timestamp) < 300000 ? body.timestamp : null;

    if (!event || !sessionId || !timestamp) {
      return errorResponse("INVALID_SCHEMA", "Validation failed", 400);
    }

    const sanitized = sanitizeProperties(body.properties as Record<string, unknown> || {});

    const date = new Date().toISOString().slice(0, 10);
    const hour = new Date().getHours().toString().padStart(2, "0");
    const eventKey = `event:${date}:${hour}:${sessionId}:${crypto.randomUUID().slice(0, 8)}`;

    await kv.set(eventKey, JSON.stringify({
      event, properties: sanitized, sessionId, timestamp,
      receivedAt: new Date().toISOString(),
      clientIP: clientIP.replace(/\d+$/, "xxx"),
    }), 7 * 24 * 60 * 60);

    return jsonResponse(null, 202, {
      "X-RateLimit-Limit": "100",
      "X-RateLimit-Remaining": String(Math.max(0, 100 - count)),
    });
  } catch (error) {
    console.error(`[${requestId}] Event tracking error:`, error);
    return errorResponse("INTERNAL_ERROR", "Failed to process event", 500);
  }
}

export const config = { runtime: "edge" };
