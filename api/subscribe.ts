declare var process: { env: Record<string, string | undefined> };

import { jsonResponse, errorResponse, corsResponse } from "./_shared/response.js";
import { kv } from "./_shared/kv.js";

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return corsResponse("POST, OPTIONS");
  if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", "Only POST is allowed", 405);

  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
    }

    const email = typeof body.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) ? body.email.trim().toLowerCase() : null;

    if (!email) {
      return errorResponse("INVALID_EMAIL", "Valid email is required", 400);
    }

    const existing = await kv.get(`subscriber:${email}`);
    if (existing) {
      return jsonResponse({ subscribed: true, message: "Already subscribed." }, 200);
    }

    await kv.set(`subscriber:${email}`, new Date().toISOString());
    await kv.zadd("subscribers", Date.now(), email);

    return jsonResponse({ subscribed: true, message: "Subscribed successfully!" }, 200);
  } catch (error) {
    console.error("Subscribe error:", error);
    return jsonResponse({ subscribed: false, message: "Something went wrong. Try again later." }, 500);
  }
}

export const config = { runtime: "edge" };
