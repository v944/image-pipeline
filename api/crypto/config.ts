declare var process: { env: Record<string, string | undefined> };

import { jsonResponse, corsResponse } from "../_shared/response.js";

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return corsResponse("GET, OPTIONS");
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  return jsonResponse({
    usdtAddress: process.env.USDT_ADDRESS || "THuqvL1xc44ksPzULvHzWTNVCp8JCruKS9",
    usdtContract: process.env.USDT_CONTRACT || "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    network: "TRC-20",
    telegramPay: !!process.env.CRYPTOBOT_API_TOKEN,
    prices: {
      pro: { usdt: 10, label: "Pro" },
      lifetime: { usdt: 30, label: "Lifetime" },
    },
  }, 200, {
    "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
  });
}

export const config = { runtime: "edge" };
