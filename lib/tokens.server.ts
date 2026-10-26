import "server-only";

import { createHash, createHmac, hkdfSync, timingSafeEqual } from "node:crypto";

/**
 * Signed, stateless tokens (specs/001-student-saved-scores/contracts/tokens.md).
 *
 *   token = base64url(JSON payload) + "." + base64url(HMAC-SHA256(key, base64url(JSON payload)))
 *
 * Keys are derived from AUTH_SECRET with HKDF using a distinct label per kind, so
 * one kind of token (or the Auth.js session) can never stand in for another.
 * This is the only module that touches the key.
 */

type Kind = "receipt" | "selfmark" | "attempt";

export const RECEIPT_TTL_SECONDS = 7 * 24 * 60 * 60;
export const SELF_MARK_TTL_SECONDS = 2 * 60 * 60;
export const ATTEMPT_TTL_SECONDS = 24 * 60 * 60;

export type GradedBy = "auto" | "llm" | "self";

/** Attempt fields carried so a retry can create an attempt row that was never stored. */
export interface AttemptFields {
  unitId: string;
  questionIds: string[];
  mcOptionOrder: Record<string, number[]>;
  /** Seconds since the epoch: when the attempt token was issued (becomes started_at). */
  issuedAt: number;
}

export interface AttemptTokenPayload {
  v: 1;
  uid: string;
  attemptId: string;
  unitId: string;
  questionIds: string[];
  mcOptionOrder: Record<string, number[]>;
  iat: number;
  exp: number;
}

export interface ReceiptPayload {
  v: 1;
  uid: string;
  attemptId: string;
  attempt: AttemptFields;
  questionId: string;
  answer: string;
  marks: number;
  max: number;
  gradedBy: GradedBy;
  feedback: string | null;
  hits: string[] | null;
  misses: string[] | null;
  iat: number;
  exp: number;
}

export interface SelfMarkPayload {
  v: 1;
  uid: string;
  attemptId: string;
  questionId: string;
  answerHash: string;
  iat: number;
  exp: number;
}

export type VerifyFailure = "invalid" | "expired" | "wrong_user" | "mismatch";
export type Verified<T> = { ok: true; payload: T } | { ok: false; reason: VerifyFailure };

const b64 = (buf: Buffer | string) => Buffer.from(buf).toString("base64url");

function key(kind: Kind): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return Buffer.from(hkdfSync("sha256", secret, "", kind, 32));
}

function sign(kind: Kind, payload: object): string {
  const body = b64(JSON.stringify(payload));
  const sig = b64(createHmac("sha256", key(kind)).update(body).digest());
  return `${body}.${sig}`;
}

function open<T extends { v: number; exp: number }>(
  kind: Kind,
  token: unknown,
  nowMs: number,
): Verified<T> {
  if (typeof token !== "string") return { ok: false, reason: "invalid" };
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: "invalid" };
  const [body, sig] = parts;
  const expected = createHmac("sha256", key(kind)).update(body).digest();
  let given: Buffer;
  try {
    given = Buffer.from(sig, "base64url");
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return { ok: false, reason: "invalid" };
  }
  let payload: T;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (!payload || payload.v !== 1 || typeof payload.exp !== "number") {
    return { ok: false, reason: "invalid" };
  }
  if (payload.exp * 1000 <= nowMs) return { ok: false, reason: "expired" };
  return { ok: true, payload };
}

const seconds = (nowMs: number) => Math.floor(nowMs / 1000);

export function hashAnswer(answer: string): string {
  return createHash("sha256").update(answer, "utf8").digest("hex");
}

// ---- attempt token ------------------------------------------------------

export function signAttemptToken(
  input: Omit<AttemptTokenPayload, "v" | "iat" | "exp">,
  nowMs: number = Date.now(),
): string {
  const iat = seconds(nowMs);
  const payload: AttemptTokenPayload = { v: 1, ...input, iat, exp: iat + ATTEMPT_TTL_SECONDS };
  return sign("attempt", payload);
}

export function verifyAttemptToken(
  token: unknown,
  bind: { uid: string; attemptId: string },
  nowMs: number = Date.now(),
): Verified<AttemptTokenPayload> {
  const r = open<AttemptTokenPayload>("attempt", token, nowMs);
  if (!r.ok) return r;
  if (r.payload.uid !== bind.uid) return { ok: false, reason: "wrong_user" };
  if (r.payload.attemptId !== bind.attemptId) return { ok: false, reason: "mismatch" };
  return r;
}

/** The attempt fields a receipt carries, taken from a verified attempt token. */
export function attemptFieldsOf(token: AttemptTokenPayload): AttemptFields {
  return {
    unitId: token.unitId,
    questionIds: token.questionIds,
    mcOptionOrder: token.mcOptionOrder,
    issuedAt: token.iat,
  };
}

// ---- self-mark token ----------------------------------------------------

export function signSelfMarkToken(
  input: { uid: string; attemptId: string; questionId: string; answer: string },
  nowMs: number = Date.now(),
): string {
  const iat = seconds(nowMs);
  const payload: SelfMarkPayload = {
    v: 1,
    uid: input.uid,
    attemptId: input.attemptId,
    questionId: input.questionId,
    answerHash: hashAnswer(input.answer),
    iat,
    exp: iat + SELF_MARK_TTL_SECONDS,
  };
  return sign("selfmark", payload);
}

export function verifySelfMarkToken(
  token: unknown,
  bind: { uid: string; attemptId: string; questionId: string; answer: string },
  nowMs: number = Date.now(),
): Verified<SelfMarkPayload> {
  const r = open<SelfMarkPayload>("selfmark", token, nowMs);
  if (!r.ok) return r;
  if (r.payload.uid !== bind.uid) return { ok: false, reason: "wrong_user" };
  if (
    r.payload.attemptId !== bind.attemptId ||
    r.payload.questionId !== bind.questionId ||
    r.payload.answerHash !== hashAnswer(bind.answer)
  ) {
    return { ok: false, reason: "mismatch" };
  }
  return r;
}

// ---- result receipt -----------------------------------------------------

export type ReceiptInput = Omit<ReceiptPayload, "v" | "iat" | "exp">;

export function signReceipt(input: ReceiptInput, nowMs: number = Date.now()): string {
  const iat = seconds(nowMs);
  const payload: ReceiptPayload = { v: 1, ...input, iat, exp: iat + RECEIPT_TTL_SECONDS };
  return sign("receipt", payload);
}

/** Verify signature and expiry, and (when given) that the receipt belongs to `uid`. */
export function verifyReceipt(
  token: unknown,
  bind: { uid?: string } = {},
  nowMs: number = Date.now(),
): Verified<ReceiptPayload> {
  const r = open<ReceiptPayload>("receipt", token, nowMs);
  if (!r.ok) return r;
  if (bind.uid !== undefined && r.payload.uid !== bind.uid) {
    return { ok: false, reason: "wrong_user" };
  }
  return r;
}
