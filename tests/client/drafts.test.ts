import { describe, expect, it } from "vitest";

import {
  attemptKey,
  clearDraft,
  clearGraded,
  draftKey,
  loadAttemptPayload,
  loadDraft,
  loadGraded,
  saveAttemptPayload,
  saveDraft,
  saveGraded,
  type GradedState,
  type StorageLike,
} from "@/lib/drafts";

function fakeStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const A = "attempt-1";
const Q = "y11-formula-test.s01";

describe("the typed answer (FR-028)", () => {
  it("is saved per attempt and question, and restored on reload", () => {
    const tab = fakeStorage();
    saveDraft(A, Q, "half an answer", tab);
    saveDraft(A, "other.q", "another", tab);
    expect(loadDraft(A, Q, tab)).toBe("half an answer");
    expect(loadDraft(A, "other.q", tab)).toBe("another");
    expect(loadDraft("attempt-2", Q, tab)).toBe("");
  });

  it("is cleared once the question is graded", () => {
    const tab = fakeStorage();
    saveDraft(A, Q, "text", tab);
    clearDraft(A, Q, tab);
    expect(loadDraft(A, Q, tab)).toBe("");
    expect(tab.data.has(draftKey(A, Q))).toBe(false);
  });

  it("is preserved across a simulated 401 sign-in redirect (same tab, same storage)", () => {
    const tab = fakeStorage();
    saveDraft(A, Q, "my answer so far", tab);
    // the grade call returns 401: the page shows 'sign in' and does NOT clear the draft;
    // after Google sign-in the same tab reloads the quiz and reads the draft back
    expect(loadDraft(A, Q, tab)).toBe("my answer so far");
  });

  it("an emptied draft removes the entry", () => {
    const tab = fakeStorage();
    saveDraft(A, Q, "x", tab);
    saveDraft(A, Q, "", tab);
    expect(tab.data.size).toBe(0);
  });
});

describe("the pending self-mark step and last grade result", () => {
  const state: GradedState = {
    answer: "my answer",
    marks: null,
    selfMarkToken: "tok",
    aiUnavailable: true,
    result: {
      questionId: Q,
      type: "short",
      maxMarks: 3,
      marksAwarded: null,
      needsSelfMark: true,
      modelAnswer: "model",
      rubric: ["r1"],
    },
  };

  it("is restored after a reload so the self-mark step is not lost", () => {
    const tab = fakeStorage();
    saveGraded(A, Q, state, tab);
    expect(loadGraded(A, Q, tab)).toEqual(state);
    clearGraded(A, Q, tab);
    expect(loadGraded(A, Q, tab)).toBeNull();
  });
});

describe("the attempt payload (lets a quiz run when the database is down)", () => {
  it("round-trips questions, token and answered marks", () => {
    const tab = fakeStorage();
    const payload = {
      attemptToken: "tok",
      unitId: "y11-formula-test",
      passMark: 70,
      questions: [{ id: Q, type: "short" as const, prompt: "p", maxMarks: 3 }],
      answered: { [Q]: { marks: 2, max: 3 } },
    };
    saveAttemptPayload(A, payload, tab);
    expect(tab.data.has(attemptKey(A))).toBe(true);
    expect(loadAttemptPayload(A, tab)).toEqual(payload);
    expect(loadAttemptPayload("missing", tab)).toBeNull();
  });
});

describe("storage trouble is swallowed", () => {
  const broken: StorageLike = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("quota");
    },
    removeItem: () => {
      throw new Error("blocked");
    },
  };

  it("never throws when storage is blocked or full", () => {
    expect(() => saveDraft(A, Q, "x", broken)).not.toThrow();
    expect(loadDraft(A, Q, broken)).toBe("");
    expect(() => clearDraft(A, Q, broken)).not.toThrow();
    expect(loadGraded(A, Q, broken)).toBeNull();
    expect(loadAttemptPayload(A, broken)).toBeNull();
  });

  it("works without any storage (null)", () => {
    expect(loadDraft(A, Q, null)).toBe("");
    expect(() => saveDraft(A, Q, "x", null)).not.toThrow();
  });

  it("corrupt stored JSON reads as empty", () => {
    const tab = fakeStorage();
    tab.setItem(attemptKey(A), "{not json");
    expect(loadAttemptPayload(A, tab)).toBeNull();
  });
});
