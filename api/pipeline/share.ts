declare var process: { env: Record<string, string | undefined> };

import { kv } from "../_shared/kv.js";
import { jsonResponse, errorResponse, corsResponse } from "../_shared/response.js";
import { getClientIP } from "../_shared/ip.js";

const ALLOWED_NODE_TYPES = new Set(["load", "resize", "crop", "compress", "format", "watermark", "rename", "denoise", "export"]);
const MAX_PIPELINE_SIZE = 65536;

function generateShareId(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const length = 8;
  let id = "";
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    id += alphabet[randomValues[i] % alphabet.length];
  }
  return id;
}

function validatePipeline(body: Record<string, unknown>): { pipeline?: Record<string, unknown>; expiresIn?: number; error?: Response } {
  const pipeline = body.pipeline as Record<string, unknown> | undefined;
  if (!pipeline || typeof pipeline !== "object") {
    return { error: errorResponse("INVALID_SCHEMA", "pipeline is required", 400) };
  }

  const version = typeof pipeline.version === "string" && /^\d+\.\d+/.test(pipeline.version) ? pipeline.version : null;
  const nodes = pipeline.nodes as Array<Record<string, unknown>> | undefined;

  if (!version) {
    return { error: errorResponse("INVALID_SCHEMA", "pipeline.version must be semver (e.g. 1.0)", 400) };
  }

  if (!Array.isArray(nodes) || nodes.length < 1 || nodes.length > 20) {
    return { error: errorResponse("INVALID_SCHEMA", "pipeline.nodes must be an array of 1-20 nodes", 400) };
  }

  for (const node of nodes) {
    if (typeof node.id !== "string" || node.id.length < 1 || node.id.length > 64) {
      return { error: errorResponse("INVALID_SCHEMA", "Each node must have an id (1-64 chars)", 400) };
    }
    if (typeof node.type !== "string" || !ALLOWED_NODE_TYPES.has(node.type)) {
      return { error: errorResponse("INVALID_SCHEMA", `Invalid node type: ${node.type}`, 400) };
    }
  }

  const payload = JSON.stringify(pipeline);
  if (payload.length > MAX_PIPELINE_SIZE) {
    return { error: errorResponse("PAYLOAD_TOO_LARGE", "Pipeline payload exceeds 64KB", 400) };
  }

  const expiresIn = typeof body.expiresIn === "number" ? Math.max(3600, Math.min(2592000, body.expiresIn)) : 604800;

  return { pipeline: pipeline as Record<string, unknown>, expiresIn };
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return corsResponse("POST, OPTIONS");
  if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", "Only POST is allowed", 405);

  const clientIP = getClientIP(request);
  const requestId = request.headers.get("X-Request-ID") || crypto.randomUUID();

  try {
    const rateKey = `rate_limit:${clientIP}:share`;
    const count = await kv.incr(rateKey);
    if (count === 1) await kv.expire(rateKey, 60);
    if (count > 10) {
      const ttl = await kv.ttl(rateKey);
      return errorResponse("RATE_LIMIT_EXCEEDED", "Rate limit exceeded", 429, { retryAfter: ttl });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
    }

    const validation = validatePipeline(body);
    if (validation.error) return validation.error;

    const shareId = generateShareId();
    const now = Date.now();
    const expiresAt = new Date(now + (validation.expiresIn || 604800) * 1000).toISOString();

    await kv.set(
      `pipeline:${shareId}`,
      JSON.stringify({
        pipeline: validation.pipeline,
        metadata: { nodeCount: (validation.pipeline!.nodes as Array<unknown>).length, version: validation.pipeline!.version },
        createdAt: new Date(now).toISOString(),
        expiresAt,
      }),
      validation.expiresIn || 604800
    );

    const appUrl = process.env.APP_URL || "https://image-pipeline.vercel.app";

    return jsonResponse({
      shareId, url: `${appUrl}/s/${shareId}`,
      expiresAt, nodeCount: (validation.pipeline!.nodes as Array<unknown>).length,
    }, 200, {
      "X-RateLimit-Limit": "10",
      "X-RateLimit-Remaining": String(Math.max(0, 10 - count)),
    });
  } catch (error) {
    console.error(`[${requestId}] Pipeline share error:`, error);
    return errorResponse("INTERNAL_ERROR", "Failed to share pipeline", 500);
  }
}

export const config = { runtime: "edge" };
