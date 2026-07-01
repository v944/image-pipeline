import { kv } from "./_shared/kv.js";
import { jsonResponse, errorResponse, corsResponse } from "./_shared/response.js";

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return corsResponse("GET, OPTIONS");
  }

  if (request.method !== "GET") {
    return errorResponse("METHOD_NOT_ALLOWED", "Only GET is allowed", 405);
  }

  const requestId = crypto.randomUUID();

  try {
    const kvStart = Date.now();
    await kv.set("health:ping", new Date().toISOString(), 60);
    const kvLatency = Date.now() - kvStart;

    const region = request.headers.get("X-Vercel-IDC-Region") || "unknown";

    return jsonResponse({
      status: "healthy",
      version: "1.0.0",
      kv: "connected",
      kvLatency: `${kvLatency}ms`,
      region,
      timestamp: new Date().toISOString(),
    }, 200, {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    });
  } catch (error) {
    console.error(`[${requestId}] Health check failed:`, error);
    return errorResponse("SERVICE_UNAVAILABLE", "KV connection failed", 503);
  }
}

export const config = { runtime: "edge" };
