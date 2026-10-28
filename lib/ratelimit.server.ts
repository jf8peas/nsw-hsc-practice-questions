import "server-only";

import { getConfig } from "@/lib/config.server";

// Rate limits for the paid / write paths. Uses Upstash Redis when
// UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set; otherwise a
// per-instance in-memory sliding window (weaker on serverless, but still stops
// one client hammering one instance).
//
//  - per signed-in user per minute is the primary limit on short-answer grading
//    (GRADE_RATE_LIMIT), because school networks share IP addresses;
//  - per IP per minute is a looser backstop (GRADE_IP_RATE_LIMIT);
//  - per user per minute on starting attempts (ATTEMPT_RATE_LIMIT).
//
// MC grading is never rate limited (constitution Principle VI).

const WINDOW_MS = 60_000;

export interface RateResult {
  ok: boolean;
  /** Seconds until the caller may retry, when known. */
  retryAfter?: number;
}

// ---- in-memory fallback --------------------------------------------------

const memory = new Map<string, Map<string, number[]>>();

function memoryLimit(prefix: string, key: string, max: number): RateResult {
  let hits = memory.get(prefix);
  if (!hits) {
    hits = new Map();
    memory.set(prefix, hits);
  }
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((WINDOW_MS - (now - recent[0])) / 1000)),
    };
  }
  recent.push(now);
  hits.set(key, recent);
  // opportunistic cleanup
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return { ok: true };
}

// ---- Upstash ------------------------------------------------------------

type UpstashLimiter = { limit: (k: string) => Promise<{ success: boolean; reset: number }> };
const upstash = new Map<string, Promise<UpstashLimiter | null>>();

function getUpstash(prefix: string, max: number): Promise<UpstashLimiter | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return Promise.resolve(null);
  const id = `${prefix}:${max}`;
  let pending = upstash.get(id);
  if (!pending) {
    pending = (async () => {
      try {
        const [{ Ratelimit }, { Redis }] = await Promise.all([
          import("@upstash/ratelimit"),
          import("@upstash/redis"),
        ]);
        return new Ratelimit({
          redis: new Redis({ url, token }),
          limiter: Ratelimit.slidingWindow(max, "60 s"),
          prefix,
          analytics: false,
        }) as UpstashLimiter;
      } catch {
        return null;
      }
    })();
    upstash.set(id, pending);
  }
  return pending;
}

/** Count one hit for `key` under `prefix`; `ok: false` once `max` per minute is exceeded. */
export async function checkRateLimit(
  prefix: string,
  key: string,
  max: number,
): Promise<RateResult> {
  const k = key || "unknown";
  const up = await getUpstash(prefix, max);
  if (up) {
    try {
      const r = await up.limit(k);
      return r.success
        ? { ok: true }
        : { ok: false, retryAfter: Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)) };
    } catch {
      // fall through to memory
    }
  }
  return memoryLimit(prefix, k, max);
}

/** Primary limit on short-answer grading: per signed-in student. */
export function checkUserRateLimit(userId: string): Promise<RateResult> {
  return checkRateLimit("grade-user", userId, getConfig().gradeRateLimit);
}

/** Looser per-IP backstop on short-answer grading. */
export function checkIpRateLimit(ip: string): Promise<RateResult> {
  return checkRateLimit("grade-ip", ip, getConfig().gradeIpRateLimit);
}

/** Limit on starting attempts: per signed-in student. */
export function checkAttemptRateLimit(userId: string): Promise<RateResult> {
  return checkRateLimit("attempt", userId, getConfig().attemptRateLimit);
}

/** Limit on the unit page asking for concept content to be prepared: per signed-in student. */
export function checkConceptRateLimit(userId: string): Promise<RateResult> {
  return checkRateLimit("concept", userId, getConfig().conceptRateLimit);
}
