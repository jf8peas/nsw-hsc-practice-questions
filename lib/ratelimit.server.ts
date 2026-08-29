import "server-only";

// Per-IP limit for the paid grading path (short answers). Uses Upstash Redis
// when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set; otherwise a
// per-instance in-memory sliding window (weaker on serverless, but still stops
// one client hammering one instance). MC grading is never rate limited.

const WINDOW_MS = 60_000;
const MAX = Math.max(1, Number(process.env.GRADE_RATE_LIMIT || 30));

export interface RateResult {
  ok: boolean;
  /** Seconds until the caller may retry, when known. */
  retryAfter?: number;
}

// ---- in-memory fallback --------------------------------------------------

const hits = new Map<string, number[]>();

function memoryLimit(ipKey: string): RateResult {
  const now = Date.now();
  const recent = (hits.get(ipKey) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX) {
    return { ok: false, retryAfter: Math.ceil((WINDOW_MS - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(ipKey, recent);
  // opportunistic cleanup
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return { ok: true };
}

// ---- Upstash ------------------------------------------------------------

let limiter: { limit: (k: string) => Promise<{ success: boolean; reset: number }> } | null = null;
let upstashTried = false;

async function getUpstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (limiter || upstashTried) return limiter;
  upstashTried = true;
  try {
    const [{ Ratelimit }, { Redis }] = await Promise.all([
      import("@upstash/ratelimit"),
      import("@upstash/redis"),
    ]);
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(MAX, "60 s"),
      prefix: "grade",
      analytics: false,
    });
  } catch {
    limiter = null;
  }
  return limiter;
}

export async function checkGradeRateLimit(ip: string): Promise<RateResult> {
  const key = ip || "unknown";
  const up = await getUpstash();
  if (up) {
    try {
      const r = await up.limit(key);
      return r.success
        ? { ok: true }
        : { ok: false, retryAfter: Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)) };
    } catch {
      // fall through to memory
    }
  }
  return memoryLimit(key);
}
