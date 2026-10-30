declare var process: { env: Record<string, string | undefined> };

import { jsonResponse, errorResponse } from "./_shared/response.js";
import { kv } from "./_shared/kv.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_KEY = process.env.ADMIN_KEY;
const FROM_EMAIL = process.env.RECEIPT_FROM_EMAIL || "newsletter@imagepipeline.art";
const APP_URL = process.env.APP_URL || "https://imagepipeline.art";

function generateToken(): string {
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", "Only POST is allowed", 405);

  if (!ADMIN_KEY) return errorResponse("SERVER_ERROR", "ADMIN_KEY not configured", 500);
  if (!RESEND_API_KEY) return errorResponse("SERVER_ERROR", "Resend not configured", 500);

  const url = new URL(request.url);
  const key = request.headers.get("x-admin-key") || url.searchParams.get("key");
  if (key !== ADMIN_KEY) return errorResponse("UNAUTHORIZED", "Invalid key", 401);

  let body: { subject?: string; html?: string };
  try {
    body = await request.json() as { subject?: string; html?: string };
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
  }

  const subject = body.subject?.trim();
  const html = body.html?.trim();
  if (!subject || !html) return errorResponse("VALIDATION", "subject and html are required", 400);

  const emails = await kv.zrevrange("subscribers", 0, -1);
  if (emails.length === 0) return jsonResponse({ sent: 0, message: "No subscribers." }, 200);

  const recipients = await Promise.all(emails.map(async (email) => {
    let token = await kv.get(`unsub_by_email:${email}`);
    if (!token) {
      token = generateToken();
      await kv.set(`unsub:${token}`, email);
      await kv.set(`unsub_by_email:${email}`, token);
    }
    return { email, token };
  }));

  const BATCH_SIZE = 10;
  let sent = 0;
  const errors: string[] = [];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(({ email, token }) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `Image Pipeline <${FROM_EMAIL}>`,
            to: [email],
            subject,
            html: `${html}
<p style="color:#6B7280;font-size:11px;margin-top:32px;line-height:1.4;">—<br>Image Pipeline &mdash; batch image processing in your browser.<br><a href="${APP_URL}" style="color:#F59E0B;">${APP_URL}</a><br><a href="${APP_URL}/api/unsubscribe?token=${token}" style="color:#6B7280;text-decoration:underline;">Unsubscribe</a></p>`,
          }),
        })
      )
    );

    for (let j = 0; j < batch.length; j++) {
      const result = results[j];
      if (result.status === "fulfilled" && result.value.ok) {
        sent++;
      } else {
        const err = result.status === "fulfilled" ? await result.value.text() : result.reason?.message || "unknown";
        errors.push(`${batch[j].email}: ${err}`);
      }
    }
  }

  return jsonResponse({ sent, total: recipients.length, errors: errors.length > 0 ? errors : undefined }, 200);
}

export const config = { runtime: "edge" };
