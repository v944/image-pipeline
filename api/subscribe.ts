declare var process: { env: Record<string, string | undefined> };

import { kv } from "./_shared/kv.js";
import { jsonResponse, errorResponse, corsResponse } from "./_shared/response.js";
import { getClientIP } from "./_shared/ip.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.APP_URL || "https://imagepipeline.art";
const FROM_EMAIL = process.env.RECEIPT_FROM_EMAIL || "newsletter@imagepipeline.art";
const PENDING_TTL = 24 * 60 * 60;

function generateToken(): string {
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function page(title: string, message: string): Response {
  return new Response(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#0D0D14;color:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;">
  <div style="text-align:center;max-width:360px;padding:24px;">
    <h1 style="font-size:20px;margin:0 0 8px;">${title}</h1>
    <p style="color:#9CA3AF;font-size:13px;line-height:1.5;">${message}</p>
  </div>
</body>
</html>`, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function sendConfirmationEmail(email: string, token: string): Promise<boolean> {
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
      subject: "Confirm your Image Pipeline subscription",
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
              <h1 style="color:#F5F5F5;font-size:20px;margin:0;">Confirm your subscription</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <p style="color:#9CA3AF;font-size:13px;margin:0;line-height:1.5;">You subscribed to Image Pipeline updates with this email. Click the button below to confirm. The link works for 24 hours.</p>
            </td>
          </tr>
          <tr>
            <td align="center">
              <a href="${APP_URL}/api/subscribe?token=${token}" style="display:inline-block;background:#F59E0B;color:#000;text-decoration:none;font-size:13px;font-weight:600;padding:10px 24px;border-radius:10px;">Confirm Subscription</a>
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

async function activateSubscriber(email: string): Promise<void> {
  const existing = await kv.get(`subscriber:${email}`);
  if (!existing) {
    await kv.set(`subscriber:${email}`, new Date().toISOString());
    await kv.zadd("subscribers", Date.now(), email);
  }
  const existingToken = await kv.get(`unsub_by_email:${email}`);
  if (!existingToken) {
    const token = generateToken();
    await kv.set(`unsub:${token}`, email);
    await kv.set(`unsub_by_email:${email}`, token);
  }
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return corsResponse("GET, POST, OPTIONS");

  try {
    if (request.method === "GET") {
      const token = (new URL(request.url).searchParams.get("token") || "").toLowerCase();
      if (!/^[0-9a-f]{32}$/.test(token)) {
        return page("Invalid link", "This confirmation link is invalid.");
      }
      const email = await kv.get(`sub_pending:${token}`);
      if (!email) {
        return page("Link expired", "This confirmation link is invalid or has expired. Please subscribe again.");
      }
      await kv.del(`sub_pending:${token}`);
      await activateSubscriber(email);
      return page("You're subscribed", "Your subscription is confirmed. You can close this tab.");
    }

    if (request.method !== "POST") {
      return errorResponse("METHOD_NOT_ALLOWED", "Only GET and POST are allowed", 405);
    }

    const clientIP = getClientIP(request);
    const rateKey = `rate_limit:${clientIP}:subscribe`;
    const count = await kv.incr(rateKey);
    if (count === 1) await kv.expire(rateKey, 60);
    if (count > 5) {
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

    if (await kv.get(`subscriber:${email}`)) {
      return jsonResponse({ subscribed: true, message: "Already subscribed." }, 200);
    }

    // Without an email service we cannot confirm ownership — fall back to
    // single opt-in so the form keeps working.
    if (!RESEND_API_KEY) {
      await activateSubscriber(email);
      return jsonResponse({ subscribed: true, message: "Subscribed successfully!" }, 200);
    }

    const token = generateToken();
    await kv.set(`sub_pending:${token}`, email, PENDING_TTL);
    const sent = await sendConfirmationEmail(email, token).catch(() => false);
    if (!sent) {
      await kv.del(`sub_pending:${token}`);
      return jsonResponse({ subscribed: false, message: "Could not send confirmation email. Try again later." }, 200);
    }

    return jsonResponse({ subscribed: true, pending: true, message: "Confirmation email sent. Please check your inbox." }, 200);
  } catch (error) {
    console.error("Subscribe error:", error);
    return jsonResponse({ subscribed: false, message: "Something went wrong. Try again later." }, 500);
  }
}

export const config = { runtime: "edge" };
