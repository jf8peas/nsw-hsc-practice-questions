import { beforeAll, describe, expect, it } from "vitest";

import {
  ATTEMPT_TTL_SECONDS,
  RECEIPT_TTL_SECONDS,
  SELF_MARK_TTL_SECONDS,
  attemptFieldsOf,
  hashAnswer,
  signAttemptToken,
  signReceipt,
  signSelfMarkToken,
  verifyAttemptToken,
  verifyReceipt,
  verifySelfMarkToken,
  type ReceiptInput,
} from "@/lib/tokens.server";

const UID = "6f0b6a53-3a39-4a3e-8d5b-0b2f6f3c9d11";
const OTHER = "11111111-3a39-4a3e-8d5b-0b2f6f3c9d11";
const ATTEMPT = "22222222-3a39-4a3e-8d5b-0b2f6f3c9d11";
const T0 = 1_800_000_000_000;

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-test-secret-test-secret-1234";
});

const attemptInput = () => ({
  uid: UID,
  attemptId: ATTEMPT,
  unitId: "y11-physics-preliminary",
  questionIds: ["y11-physics-preliminary.s01", "y11-physics-preliminary.m01"],
  mcOptionOrder: { "y11-physics-preliminary.m01": [2, 0, 1, 3] },
});

const receiptInput = (): ReceiptInput => ({
  uid: UID,
  attemptId: ATTEMPT,
  attempt: {
    unitId: "y11-physics-preliminary",
    questionIds: ["y11-physics-preliminary.m01"],
    mcOptionOrder: { "y11-physics-preliminary.m01": [1, 0] },
    issuedAt: T0 / 1000,
  },
  questionId: "y11-physics-preliminary.m01",
  answer: "9.8 m/s^2",
  marks: 1,
  max: 1,
  gradedBy: "auto",
  feedback: null,
  hits: null,
  misses: null,
});

function tamper(token: string): string {
  const [body, sig] = token.split(".");
  const json = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  json.uid = OTHER;
  return `${Buffer.from(JSON.stringify(json)).toString("base64url")}.${sig}`;
}

describe("attempt token", () => {
  it("round-trips attemptId, unitId, questionIds, mcOptionOrder and expiry", () => {
    const token = signAttemptToken(attemptInput(), T0);
    const r = verifyAttemptToken(token, { uid: UID, attemptId: ATTEMPT }, T0 + 1000);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.payload).toMatchObject({ v: 1, ...attemptInput(), iat: T0 / 1000 });
    expect(r.payload.exp).toBe(T0 / 1000 + ATTEMPT_TTL_SECONDS);
    expect(attemptFieldsOf(r.payload)).toEqual({
      unitId: "y11-physics-preliminary",
      questionIds: attemptInput().questionIds,
      mcOptionOrder: attemptInput().mcOptionOrder,
      issuedAt: T0 / 1000,
    });
  });

  it("rejects a modified payload, a wrong user, a wrong attempt and an expired token", () => {
    const token = signAttemptToken(attemptInput(), T0);
    expect(verifyAttemptToken(tamper(token), { uid: OTHER, attemptId: ATTEMPT }, T0)).toEqual({ ok: false, reason: "invalid" });
    expect(verifyAttemptToken(token, { uid: OTHER, attemptId: ATTEMPT }, T0)).toEqual({ ok: false, reason: "wrong_user" });
    expect(verifyAttemptToken(token, { uid: UID, attemptId: OTHER }, T0)).toEqual({ ok: false, reason: "mismatch" });
    expect(verifyAttemptToken(token, { uid: UID, attemptId: ATTEMPT }, T0 + (ATTEMPT_TTL_SECONDS + 1) * 1000)).toEqual({ ok: false, reason: "expired" });
  });
});

describe("receipt", () => {
  it("round-trips, including its attempt object", () => {
    const token = signReceipt(receiptInput(), T0);
    const r = verifyReceipt(token, { uid: UID }, T0);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.payload).toMatchObject(receiptInput());
    expect(r.payload.exp).toBe(T0 / 1000 + RECEIPT_TTL_SECONDS);
  });

  it("rejects tampering, another user's receipt and an expired receipt", () => {
    const token = signReceipt(receiptInput(), T0);
    expect(verifyReceipt(tamper(token), {}, T0)).toEqual({ ok: false, reason: "invalid" });
    expect(verifyReceipt(token, { uid: OTHER }, T0)).toEqual({ ok: false, reason: "wrong_user" });
    expect(verifyReceipt(token, { uid: UID }, T0 + (RECEIPT_TTL_SECONDS + 1) * 1000)).toEqual({ ok: false, reason: "expired" });
  });
});

describe("self-mark token", () => {
  const bind = { uid: UID, attemptId: ATTEMPT, questionId: "q.s1", answer: "my answer" };

  it("round-trips and binds uid, attempt, question and answer hash", () => {
    const token = signSelfMarkToken(bind, T0);
    const r = verifySelfMarkToken(token, bind, T0);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload.answerHash).toBe(hashAnswer("my answer"));
      expect(r.payload.exp).toBe(T0 / 1000 + SELF_MARK_TTL_SECONDS);
    }
  });

  it("rejects each binding mismatch and expiry", () => {
    const token = signSelfMarkToken(bind, T0);
    expect(verifySelfMarkToken(token, { ...bind, uid: OTHER }, T0)).toEqual({ ok: false, reason: "wrong_user" });
    expect(verifySelfMarkToken(token, { ...bind, attemptId: OTHER }, T0)).toEqual({ ok: false, reason: "mismatch" });
    expect(verifySelfMarkToken(token, { ...bind, questionId: "q.s2" }, T0)).toEqual({ ok: false, reason: "mismatch" });
    expect(verifySelfMarkToken(token, { ...bind, answer: "different" }, T0)).toEqual({ ok: false, reason: "mismatch" });
    expect(verifySelfMarkToken(token, bind, T0 + (SELF_MARK_TTL_SECONDS + 1) * 1000)).toEqual({ ok: false, reason: "expired" });
  });
});

describe("key separation and malformed input", () => {
  it("a token signed with one kind's key fails as another kind", () => {
    const receipt = signReceipt(receiptInput(), T0);
    const attempt = signAttemptToken(attemptInput(), T0);
    const selfmark = signSelfMarkToken({ uid: UID, attemptId: ATTEMPT, questionId: "q", answer: "a" }, T0);
    expect(verifyAttemptToken(receipt, { uid: UID, attemptId: ATTEMPT }, T0).ok).toBe(false);
    expect(verifyReceipt(attempt, {}, T0).ok).toBe(false);
    expect(verifyReceipt(selfmark, {}, T0).ok).toBe(false);
    expect(verifySelfMarkToken(receipt, { uid: UID, attemptId: ATTEMPT, questionId: "q", answer: "a" }, T0).ok).toBe(false);
  });

  it("a different AUTH_SECRET invalidates tokens", () => {
    const token = signReceipt(receiptInput(), T0);
    const saved = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = "another-secret-another-secret-another-1";
    try {
      expect(verifyReceipt(token, {}, T0)).toEqual({ ok: false, reason: "invalid" });
    } finally {
      process.env.AUTH_SECRET = saved;
    }
  });

  it("rejects garbage without throwing", () => {
    for (const bad of [undefined, null, 42, "", "abc", "a.b.c", ".", "x.", ".y", { a: 1 }]) {
      expect(verifyReceipt(bad, {}, T0).ok).toBe(false);
      expect(verifyAttemptToken(bad, { uid: UID, attemptId: ATTEMPT }, T0).ok).toBe(false);
    }
  });

  it("uses a constant-time comparison", async () => {
    const src = (await import("node:fs")).readFileSync(
      new URL("../lib/tokens.server.ts", import.meta.url),
      "utf8",
    );
    expect(src).toContain("timingSafeEqual");
  });
});
