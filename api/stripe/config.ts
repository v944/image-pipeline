declare var process: { env: Record<string, string | undefined> };

import { jsonResponse, corsResponse } from "../_shared/response.js";

// Public identifiers — safe to ship in the client. Env vars override them,
// which also lets a test-mode key/buttons be swapped in without a deploy.
const DEFAULT_PUBLISHABLE_KEY = "pk_live_wwinK07EKBP0nMmkV5xZwor000MfLkKtNJ";
const DEFAULT_PRO_BUTTON_ID = "buy_btn_1UY5JlEtagaMJHGJpxpOEmj8";
const DEFAULT_LIFETIME_BUTTON_ID = "buy_btn_1UY5ZzEtagaMJHGJWW9VCDth";

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return corsResponse("GET, OPTIONS");
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || DEFAULT_PUBLISHABLE_KEY;
  const proButtonId = process.env.STRIPE_PRO_BUTTON_ID || DEFAULT_PRO_BUTTON_ID;
  const lifetimeButtonId = process.env.STRIPE_LIFETIME_BUTTON_ID || DEFAULT_LIFETIME_BUTTON_ID;
  const enabled = !!(process.env.STRIPE_SECRET_KEY && publishableKey && proButtonId);

  return jsonResponse({
    enabled,
    publishableKey: enabled ? publishableKey : "",
    proButtonId: enabled ? proButtonId : "",
    lifetimeButtonId: enabled ? lifetimeButtonId : "",
    prices: {
      pro: { usd: 10, label: "Pro" },
      lifetime: { usd: 30, label: "Lifetime" },
    },
  }, 200, {
    "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
  });
}

export const config = { runtime: "edge" };
