declare var process: { env: Record<string, string | undefined> };

import { jsonResponse, errorResponse, corsResponse } from "../_shared/response.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.APP_URL || "https://imagepipeline.art";
const FROM_EMAIL = process.env.RECEIPT_FROM_EMAIL || "receipts@imagepipeline.art";

const PRICE_LABELS: Record<string, string> = {
  pro: "Pro ($10 USDT)",
  lifetime: "Lifetime ($30 USDT)",
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return corsResponse("POST, OPTIONS");
  if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", "Only POST is allowed", 405);

  if (!RESEND_API_KEY) {
    return jsonResponse({ sent: false, message: "Email service not configured. Your payment is confirmed." }, 200);
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
    }

    const email = typeof body.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) ? body.email : null;
    const plan = typeof body.plan === "string" ? body.plan : null;
    const txId = typeof body.txId === "string" ? body.txId : null;

    if (!email) {
      return errorResponse("INVALID_EMAIL", "Valid email is required", 400);
    }

    if (!plan || !PRICE_LABELS[plan]) {
      return errorResponse("INVALID_PLAN", "Invalid plan", 400);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Image Pipeline <${FROM_EMAIL}>`,
        to: [email],
        subject: `Payment Confirmed — Image Pipeline ${plan === "lifetime" ? "Lifetime" : "Pro"}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0D0D14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D14;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#1A1A24;border-radius:16px;padding:40px;border:1px solid rgba(255,255,255,0.08);">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="${APP_URL}/logo.png" alt="Image Pipeline" width="48" height="48" style="border-radius:12px;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:8px;">
              <h1 style="color:#F5F5F5;font-size:22px;margin:0;">Payment Confirmed</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <p style="color:#9CA3AF;font-size:14px;margin:0;line-height:1.5;">
                Your <strong style="color:#F59E0B;">${PRICE_LABELS[plan]}</strong> plan has been activated.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#0D0D14;border-radius:12px;padding:20px;margin-bottom:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#9CA3AF;font-size:12px;padding-bottom:8px;">Plan</td>
                  <td align="right" style="color:#F5F5F5;font-size:12px;font-weight:600;">${plan === "lifetime" ? "Lifetime" : "Pro"}</td>
                </tr>
                <tr>
                  <td style="color:#9CA3AF;font-size:12px;padding-bottom:8px;">Amount</td>
                  <td align="right" style="color:#F5F5F5;font-size:12px;font-weight:600;">${PRICE_LABELS[plan]}</td>
                </tr>
                <tr>
                  <td style="color:#9CA3AF;font-size:12px;padding-bottom:8px;">Network</td>
                  <td align="right" style="color:#F5F5F5;font-size:12px;font-weight:600;">TRC-20 (Tron)</td>
                </tr>
                ${txId ? `<tr>
                  <td style="color:#9CA3AF;font-size:12px;padding-bottom:8px;">TxID</td>
                  <td align="right" style="color:#F59E0B;font-size:11px;font-weight:400;word-break:break-all;max-width:260px;">${txId}</td>
                </tr>` : ""}
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:8px;">
              <a href="${APP_URL}/editor" style="display:inline-block;background:#F59E0B;color:#000;text-decoration:none;font-size:14px;font-weight:600;padding:12px 32px;border-radius:12px;">
                Open Editor
              </a>
            </td>
          </tr>
          <tr>
            <td align="center">
              <p style="color:#6B7280;font-size:11px;margin:0;line-height:1.4;">
                All processing happens client-side. No images are uploaded to any server.<br />
                Image Pipeline — ${APP_URL}
              </p>
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

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Resend API error:", res.status, errBody);
      return jsonResponse({ sent: false, message: "Payment confirmed. Receipt email could not be sent." }, 200);
    }

    return jsonResponse({ sent: true, message: "Receipt sent to your email." }, 200);
  } catch (error) {
    console.error("Receipt error:", error);
    return jsonResponse({ sent: false, message: "Payment confirmed. Receipt email could not be sent." }, 200);
  }
}

export const config = { runtime: "edge" };
