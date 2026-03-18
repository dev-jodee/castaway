/**
 * Simple in-memory rate limiter.
 *
 * NOTE: Vercel serverless functions don't share memory across instances, so
 * this provides a per-instance limit rather than a global one. For a
 * high-traffic deployment, replace this with a Redis-backed solution
 * (e.g. Upstash + @upstash/ratelimit).
 */

interface Entry {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000; // 1 minute

const LIMITS: Record<string, number> = {
  "fetch-idl": 30,
  generate: 10,
};

const store = new Map<string, Entry>();

// Periodically clean up expired entries to avoid unbounded memory growth.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, WINDOW_MS);
}

export function rateLimit(
  ip: string,
  endpoint: keyof typeof LIMITS
): { allowed: boolean; remaining: number; resetAt: number } {
  const max = LIMITS[endpoint] ?? 10;
  const key = `${ip}:${endpoint}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + WINDOW_MS;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, resetAt };
  }

  entry.count += 1;
  return {
    allowed: entry.count <= max,
    remaining: Math.max(0, max - entry.count),
    resetAt: entry.resetAt,
  };
}

export function getIp(req: Request): string {
  // x-real-ip is set by Vercel to the true client IP.
  // x-forwarded-for is a comma-separated chain — Vercel appends the real IP
  // last, so take the last entry to avoid spoofing via a crafted first value.
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ??
    "127.0.0.1"
  );
}
