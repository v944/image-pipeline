declare var process: { env: Record<string, string | undefined> };

import { jsonResponse, errorResponse } from "./_shared/response.js";
import { kv } from "./_shared/kv.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_KEY = process.env.ADMIN_KEY;
const FROM_EMAIL = process.env.RECEIPT_FROM_EMAIL || "newsletter@imagepipeline.art";
const APP_URL = process.env.APP_URL || "https://imagepipeline.art";

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", "Only POST is allowed", 405);

  if (!ADMIN_KEY) return errorResponse("SERVER_ERROR", "ADMIN_KEY not configured", 500);
  if (!RESEND_API_KEY) return errorResponse("SERVER_ERROR", "Resend not configured", 500);

  const url = new URL(request.url);
  const key = url.searchParams.get("key");
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

  const BATCH_SIZE = 10;
  let sent = 0;
  const errors: string[] = [];

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((email) =>
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
            html: `${html}<p style="color:#6B7280;font-size:11px;margin-top:32px;">—<br>Image Pipeline &mdash; batch image processing in your browser.<br><a href="${APP_URL}" style="color:#F59E0B;">${APP_URL}</a></p>`,
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
        errors.push(`${batch[j]}: ${err}`);
      }
    }
  }

  return jsonResponse({ sent, total: emails.length, errors: errors.length > 0 ? errors : undefined }, 200);
}

export const config = { runtime: "edge" };
