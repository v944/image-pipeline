declare var process: { env: Record<string, string | undefined> };

import { kv } from "../_shared/kv.js";
import { jsonResponse, errorResponse, corsResponse } from "../_shared/response.js";
import { getClientIP } from "../_shared/ip.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.APP_URL || "https://imagepipeline.art";
const FROM_EMAIL = process.env.RECEIPT_FROM_EMAIL || "receipts@imagepipeline.art";
const TOKEN_TTL_SECONDS = 3600;

function generateToken(): string {
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sendRestoreEmail(email: string, token: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Image Pipeline <${FROM_EMAIL}>`,
      to: [email],
      subject: "Restore your Image Pipeline plan",
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0D0D14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D14;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#1A1A24;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.08);">
          <tr>
            <td align="center" style="padding-bottom:16px;">
              <h1 style="color:#F5F5F5;font-size:20px;margin:0;">Restore your plan</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <p style="color:#9CA3AF;font-size:13px;margin:0;line-height:1.5;">A plan restore was requested for this email. Click the button below to activate your plan on this device. The link works for 1 hour and can be used once.</p>
            </td>
          </tr>
          <tr>
            <td align="center">
              <a href="${APP_URL}/pricing?restore=${token}" style="display:inline-block;background:#F59E0B;color:#000;text-decoration:none;font-size:13px;font-weight:600;padding:10px 24px;border-radius:10px;">Restore Plan</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="color:#6B7280;font-size:11px;margin:0;">If you didn't request this, you can ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    }),
  });
  return res.ok;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return corsResponse("GET, POST, OPTIONS");

  try {
    if (request.method === "GET") {
      const token = (new URL(request.url).searchParams.get("token") || "").toLowerCase();
      if (!/^[0-9a-f]{32}$/.test(token)) {
        return errorResponse("INVALID_TOKEN", "Invalid token", 400);
      }
      const data = await kv.get(`recover_token:${token}`);
      if (!data) return jsonResponse({ valid: false }, 200);
      await kv.del(`recover_token:${token}`);
      try {
        const parsed = JSON.parse(data) as { sessionId?: string; plan?: string };
        if (!parsed.sessionId || !parsed.plan) return jsonResponse({ valid: false }, 200);
        return jsonResponse({ valid: true, sessionId: parsed.sessionId, plan: parsed.plan }, 200);
      } catch {
        return jsonResponse({ valid: false }, 200);
      }
    }

    if (request.method !== "POST") {
      return errorResponse("METHOD_NOT_ALLOWED", "Only GET and POST are allowed", 405);
    }

    const clientIP = getClientIP(request);
    const rateKey = `rate_limit:${clientIP}:crypto_recover`;
    const count = await kv.incr(rateKey);
    if (count === 1) await kv.expire(rateKey, 60);
    if (count > 3) {
      const ttl = await kv.ttl(rateKey);
      return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests. Try again later.", 429, { retryAfter: ttl });
    }

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

    // Always return the same response so the endpoint cannot be used to check
    // whether an email has a purchase.
    const record = await kv.get(`recovery:${email}`);
    if (record) {
      try {
        const parsed = JSON.parse(record) as { sessionId?: string; plan?: string };
        if (parsed.sessionId && parsed.plan) {
          const token = generateToken();
          await kv.set(`recover_token:${token}`, JSON.stringify({ sessionId: parsed.sessionId, plan: parsed.plan }), TOKEN_TTL_SECONDS);
          await sendRestoreEmail(email, token).catch(() => false);
        }
      } catch {
        // Malformed record — still return the same response.
      }
    }

    return jsonResponse({ sent: true, message: "If a purchase exists for this email, a restore link is on its way." }, 200);
  } catch (error) {
    console.error("Recover error:", error);
    return errorResponse("INTERNAL_ERROR", "Recovery failed", 500);
  }
}

export const config = { runtime: "edge" };
