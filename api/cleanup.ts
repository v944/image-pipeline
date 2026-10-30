declare var process: { env: Record<string, string | undefined> };

import { kv } from "./_shared/kv.js";
import { jsonResponse } from "./_shared/response.js";

const ABUSE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export default async function handler(request: Request): Promise<Response> {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = Date.now();
  const results = {
    markersRemoved: 0,
    expiredAbuseLogs: 0,
    stats: {} as Record<string, number>,
  };

  try {
    // Markers written by previous cleanup runs (TTL backup)
    const markers = await kv.keys("cleanup:*");
    for (const key of markers) {
      await kv.del(key);
      results.markersRemoved++;
    }

    // Abuse logs older than 30 days — TTL backup in case expire was missed
    const abuseKeys = await kv.keys("abuse:*");
    for (const key of abuseKeys) {
      const ts = parseInt(key.split(":").pop() || "0", 10);
      if (ts > 0 && now - ts > ABUSE_MAX_AGE_MS) {
        await kv.del(key);
        results.expiredAbuseLogs++;
      }
    }

    results.stats = {
      sessions: (await kv.keys("session:*")).length,
      activations: (await kv.keys("crypto:activation:*")).length,
      pendingSubscriptions: (await kv.keys("sub_pending:*")).length,
      subscribers: await kv.zcard("subscribers"),
    };

    await kv.set(`cleanup:${new Date(now).toISOString().slice(0, 10)}`, "ok", 86400 * 7);

    return jsonResponse({
      success: true,
      ranAt: new Date(now).toISOString(),
      results,
    }, 200);
  } catch (error) {
    const err = error as Error;
    return jsonResponse({
      success: false,
      message: "Cleanup failed",
      error: err.message,
    }, 500);
  }
}

export const config = { runtime: "edge" };
