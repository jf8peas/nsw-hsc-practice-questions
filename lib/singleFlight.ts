import "server-only";

/**
 * Single-flight mutex for preventing duplicate concurrent operations.
 *
 * Used for photo transcription (per user, attempt, question) to prevent:
 * - Double slot reservation when a student taps "Check my answer" twice
 * - Bypassing the 3-read limit via concurrent requests
 *
 * In-memory Map for single-instance locking.
 */

interface Pending<T> {
  promise: Promise<T>;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

const memory = new Map<string, Pending<unknown>>();

const TIMEOUT_MS = 70_000; // Longer than vision call chain (25s x 2 = 50s)

/**
 * Execute `fn` with exclusive access for `key`. If another call is already
 * in-flight for the same key, wait for it to complete and return its result.
 *
 * @param key - Unique identifier (e.g., `transcribe:${userId}:${attemptId}:${questionId}`)
 * @param fn - Async function to execute with exclusive access
 * @returns The result of `fn` (shared if another call was in-flight)
 */
export async function withSingleFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = memory.get(key) as Pending<T> | undefined;
  if (existing) {
    // Another call is in-flight: wait for it
    return existing.promise;
  }

  let resolve!: (value: unknown) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res as (value: unknown) => void;
    reject = rej;
  });
  // The stored promise is only awaited by concurrent callers. When the first
  // (only) caller's fn rejects, nobody awaits it, so mark it handled to avoid
  // an unhandled rejection; concurrent callers still receive the rejection.
  promise.catch(() => {});

  memory.set(key, { promise, resolve, reject });

  const timeoutId = setTimeout(() => {
    memory.delete(key);
  }, TIMEOUT_MS);

  try {
    const result = await fn();
    resolve(result);
    return result;
  } catch (error) {
    reject(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    clearTimeout(timeoutId);
    memory.delete(key);
  }
}

/**
 * Check if a key is currently locked (in-flight).
 *
 * @param key - Unique identifier
 * @returns true if an operation is in-flight for this key
 */
export function isInFlight(key: string): boolean {
  return memory.has(key);
}

/**
 * Clear all in-flight locks (for testing only).
 */
export function clearAllForTesting(): void {
  memory.clear();
}
