declare var process: { env: Record<string, string | undefined> };

const KV_URL = process.env.KV_REST_API_URL!;
const KV_TOKEN = process.env.KV_REST_API_TOKEN!;

export async function kvCommand<T = unknown>(
  command: string,
  ...args: (string | number)[]
): Promise<T> {
  const url = `${KV_URL}/${command}/${args.map(encodeURIComponent).join("/")}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });

  if (!response.ok) {
    throw new Error(`KV ${command} failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json() as { result?: T; error?: string };

  if (result.error) {
    throw new Error(`KV ${command} error: ${result.error}`);
  }

  return result.result as T;
}

export const kv = {
  async get(key: string): Promise<string | null> {
    return kvCommand<string | null>("get", key);
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<string> {
    if (ttlSeconds) {
      return kvCommand<string>("set", key, value, "ex", ttlSeconds);
    }
    return kvCommand<string>("set", key, value);
  },

  async setnx(key: string, value: string, ttlSeconds: number): Promise<string | null> {
    return kvCommand<string | null>("set", key, value, "nx", "ex", ttlSeconds);
  },

  async del(...keys: string[]): Promise<number> {
    return kvCommand<number>("del", ...keys);
  },

  async incr(key: string): Promise<number> {
    return kvCommand<number>("incr", key);
  },

  async expire(key: string, seconds: number): Promise<number> {
    return kvCommand<number>("expire", key, seconds);
  },

  async ttl(key: string): Promise<number> {
    return kvCommand<number>("ttl", key);
  },

  async keys(pattern: string): Promise<string[]> {
    return kvCommand<string[]>("keys", pattern);
  },

  async zadd(key: string, score: number, member: string): Promise<number> {
    return kvCommand<number>("zadd", key, score, member);
  },

  async zremrangebyscore(key: string, min: number | string, max: number | string): Promise<number> {
    return kvCommand<number>("zremrangebyscore", key, min as string, max as string);
  },

  async zcard(key: string): Promise<number> {
    return kvCommand<number>("zcard", key);
  },

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    return kvCommand<string[]>("zrevrange", key, start, stop);
  },
};
