import { kv } from "./_shared/kv";
import { jsonResponse } from "./_shared/response";

export default async function handler(request: Request): Promise<Response> {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const results = {
    deleted: 0,
    aggregated: 0,
    errors: [] as string[],
  };

  try {
    const testKey = `cleanup:${new Date().toISOString().slice(0, 10)}`;
    await kv.set(testKey, "ok", 86400);

    return jsonResponse({
      success: true,
      message: "Cleanup completed",
      results,
      note: "TTL-based expiration handled automatically by Redis",
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
