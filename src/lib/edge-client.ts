interface LimitResponse {
  allowed: boolean;
  current: number;
  limit: number;
  resetAt: string | null;
  tier: string;
  limitType: string;
  reason?: string;
  upgradeUrl?: string;
}

interface EdgeClientOptions {
  maxRetries?: number;
  retryDelay?: number;
}

class EdgeClient {
  private maxRetries: number;
  private retryDelay: number;
  private offlineMode = false;

  constructor(options: EdgeClientOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 1000;
  }

  private async fetchWithRetry(url: string, options: RequestInit = {}): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return response;

        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          await this.delay(parseInt(retryAfter || "5") * 1000);
          continue;
        }

        if (response.status >= 400 && response.status < 500) {
          return response;
        }

        throw new Error(`Server error: ${response.status}`);
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt - 1));
        }
      }
    }

    throw lastError || new Error("Max retries exceeded");
  }

  async checkLimit(sessionId: string, limitType: string): Promise<LimitResponse> {
    if (this.offlineMode) {
      return this.fallbackLimitCheck(limitType);
    }

    try {
      const response = await this.fetchWithRetry(
        `/api/check-limit?sessionId=${encodeURIComponent(sessionId)}&limitType=${limitType}`,
        { headers: { "X-Session-Id": sessionId } }
      );

      if (response.ok) {
        const data = await response.json();
        return { ...data.data, tier: data.data.tier || "free" };
      }

      return this.fallbackLimitCheck(limitType);
    } catch {
      return this.fallbackLimitCheck(limitType);
    }
  }

  async trackEvent(
    event: string,
    properties: Record<string, unknown>,
    sessionId: string
  ): Promise<void> {
    if (this.offlineMode) {
      this.queueEvent({ event, properties, sessionId, timestamp: Date.now() });
      return;
    }

    try {
      const response = await this.fetchWithRetry("/api/event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Id": sessionId,
        },
        body: JSON.stringify({
          event,
          properties,
          sessionId,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch {
      console.warn("Edge functions unavailable, entering offline mode");
      this.offlineMode = true;
      this.queueEvent({ event, properties, sessionId, timestamp: Date.now() });
    }
  }

  private fallbackLimitCheck(limitType: string): LimitResponse {
    const limits: Record<string, { limit: number; window: number }> = {
      files: { limit: 10, window: 3600000 },
      nodes: { limit: 4, window: 3600000 },
      batches: { limit: 10, window: 3600000 },
    };

    const config = limits[limitType];
    if (!config) {
      return { allowed: true, current: 0, limit: -1, resetAt: null, tier: "free", limitType };
    }

    const key = `ip_limit_${limitType}`;
    const stored = localStorage.getItem(key);
    const now = Date.now();

    if (stored) {
      try {
        const { count, resetAt } = JSON.parse(stored) as { count: number; resetAt: number };
        if (now < resetAt) {
          if (count >= config.limit) {
            return {
              allowed: false, current: count, limit: config.limit,
              resetAt: new Date(resetAt).toISOString(), tier: "free", limitType,
              reason: "FREE_TIER_LIMIT_REACHED",
            };
          }
          localStorage.setItem(key, JSON.stringify({ count: count + 1, resetAt }));
          return { allowed: true, current: count + 1, limit: config.limit, resetAt: new Date(resetAt).toISOString(), tier: "free", limitType };
        }
      } catch {
        /* ignore corrupt data */
      }
    }

    localStorage.setItem(key, JSON.stringify({ count: 1, resetAt: now + config.window }));
    return { allowed: true, current: 1, limit: config.limit, resetAt: new Date(now + config.window).toISOString(), tier: "free", limitType };
  }

  private queueEvent(event: unknown): void {
    try {
      const queue = JSON.parse(localStorage.getItem("ip_event_queue") || "[]") as unknown[];
      queue.push(event);
      localStorage.setItem("ip_event_queue", JSON.stringify(queue.slice(-100)));
    } catch {
      /* ignore queue errors */
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const edgeClient = new EdgeClient();
