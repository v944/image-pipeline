import { kv } from "./_shared/kv.js";
import { errorResponse } from "./_shared/response.js";

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

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return errorResponse("METHOD_NOT_ALLOWED", "Only GET is allowed", 405);

  try {
    const token = (new URL(request.url).searchParams.get("token") || "").toLowerCase();
    if (!/^[0-9a-f]{32}$/.test(token)) {
      return page("Invalid link", "This unsubscribe link is invalid.");
    }

    const email = await kv.get(`unsub:${token}`);
    if (!email) {
      return page("Invalid link", "This unsubscribe link is invalid or has already been used.");
    }

    await kv.del(`unsub:${token}`, `subscriber:${email}`, `unsub_by_email:${email}`);
    await kv.zrem("subscribers", email);

    return page("Unsubscribed", "You have been unsubscribed from Image Pipeline emails. You can close this tab.");
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return page("Something went wrong", "Could not process the unsubscribe request. Please try again later.");
  }
}

export const config = { runtime: "edge" };
