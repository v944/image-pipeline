import { jsonResponse, errorResponse, corsResponse } from "./_shared/response.js";

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return corsResponse("POST, OPTIONS");
  if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", "Only POST is allowed", 405);

  const requestId = crypto.randomUUID();

  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
    }

    const message = typeof body.message === "string" && body.message.length > 0 && body.message.length <= 4096 ? body.message : null;
    if (!message) {
      return errorResponse("INVALID_SCHEMA", "message is required (max 4096 chars)", 400);
    }

    console.error(`[${requestId}] Client error:`, {
      message,
      sessionId: typeof body.sessionId === "string" ? body.sessionId : "anonymous",
      url: typeof body.url === "string" ? body.url.slice(0, 2048) : "unknown",
    });

    if (typeof body.stack === "string") {
      console.error(`[${requestId}] Stack:`, body.stack.slice(0, 2000));
    }

    return jsonResponse({ received: true }, 202);
  } catch (error) {
    console.error(`[${requestId}] Error report handler failed:`, error);
    return errorResponse("INTERNAL_ERROR", "Failed to process error report", 500);
  }
}

export const config = { runtime: "edge" };
