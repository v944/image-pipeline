declare var process: { env: Record<string, string | undefined> };

import { jsonResponse, errorResponse } from "./_shared/response.js";
import { kv } from "./_shared/kv.js";

const ADMIN_KEY = process.env.ADMIN_KEY;

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return errorResponse("METHOD_NOT_ALLOWED", "Only GET is allowed", 405);

  const key = new URL(request.url).searchParams.get("key");
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    return errorResponse("UNAUTHORIZED", "Invalid or missing key", 401);
  }

  const emails = await kv.zrevrange("subscribers", 0, -1);

  const subscribers = [];
  for (const email of emails) {
    const date = await kv.get(`subscriber:${email}`);
    subscribers.push({ email, subscribedAt: date || "unknown" });
  }

  return jsonResponse({ total: subscribers.length, subscribers }, 200);
}

export const config = { runtime: "edge" };
