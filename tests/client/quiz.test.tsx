// @vitest-environment jsdom
//
// The browser side of the quiz: sending the right requests, showing marks at once,
// keeping unsaved results in the outbox, surviving a session expiry, and running
// from sessionStorage when the server could not load the attempt.

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Quiz } from "@/components/Quiz";
import { loadDraft, saveAttemptPayload, saveDraft, type AttemptPayload } from "@/lib/drafts";
import { outboxKey } from "@/lib/outbox";
import type { Question } from "@/lib/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const UID = "6f0b6a53-3a39-4a3e-8d5b-0b2f6f3c9d11";
const ATTEMPT = "22222222-3a39-4a3e-8d5b-0b2f6f3c9d11";
const UNIT = "y11-formula-test";

const MC: Question = {
  id: `${UNIT}.m01`,
  type: "mc",
  prompt: "Which is the SI unit of force?",
  maxMarks: 1,
  options: ["joule", "newton", "watt", "pascal"], // display order
};
const SHORT: Question = {
  id: `${UNIT}.s01`,
  type: "short",
  prompt: "State Newton's second law.",
  maxMarks: 2,
};
const MC2: Question = { ...MC, id: `${UNIT}.m02`, prompt: "Second MC?" };

const payload = (over: Partial<AttemptPayload> = {}): AttemptPayload => ({
  attemptToken: "TOKEN-1",
  unitId: UNIT,
  passMark: 70,
  questions: [SHORT, MC, MC2],
  answered: {},
  ...over,
});

type FetchCall = { url: string; body: Record<string, unknown> };
let calls: FetchCall[];
let responder: (url: string, body: Record<string, unknown>) => Response | Promise<Response>;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
  calls = [];
  responder = () => json({});
  push.mockClear();
  window.sessionStorage.clear();
  window.localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      calls.push({ url: String(url), body });
      return responder(String(url), body);
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const mount = (initial: AttemptPayload | null = payload()) =>
  render(<Quiz uid={UID} attemptId={ATTEMPT} unitId={UNIT} initial={initial} />);

const gradeCalls = () => calls.filter((c) => c.url === "/api/grade");

describe("rendering and resuming", () => {
  it("starts at the first question of a fresh attempt", () => {
    mount();
    expect(screen.getByText(/Question 1 of 3/)).toBeTruthy();
    expect(screen.getByText("State Newton's second law.")).toBeTruthy();
  });

  it("starts at the first unanswered question when resuming", () => {
    mount(payload({ answered: { [SHORT.id]: { marks: 2, max: 2 } } }));
    expect(screen.getByText(/Question 2 of 3/)).toBeTruthy();
    expect(screen.getByText("Which is the SI unit of force?")).toBeTruthy();
  });

  it("shows the results screen when everything is already answered", () => {
    mount(
      payload({
        answered: {
          [SHORT.id]: { marks: 2, max: 2 },
          [MC.id]: { marks: 1, max: 1 },
          [MC2.id]: { marks: 0, max: 1 },
        },
      }),
    );
    expect(screen.getByText("Quiz complete")).toBeTruthy();
    expect(screen.getByText("3/4")).toBeTruthy();
    expect(screen.getByText("75% marks")).toBeTruthy();
    expect(screen.getByText("Pass")).toBeTruthy();
  });
});

describe("answering multiple choice", () => {
  it("sends the DISPLAY index with the attempt token, shows the mark and the correct option", async () => {
    mount(payload({ questions: [MC, SHORT], answered: {} }));
    responder = () =>
      json({ result: { questionId: MC.id, type: "mc", maxMarks: 1, marksAwarded: 1, correctDisplayIndex: 1, needsSelfMark: false }, saved: true, attemptCompleted: false });
    fireEvent.click(screen.getByText("newton"));
    await waitFor(() => expect(screen.getByText("Next question")).toBeTruthy());

    expect(gradeCalls()).toHaveLength(1);
    expect(gradeCalls()[0].body).toEqual({
      attemptId: ATTEMPT,
      attemptToken: "TOKEN-1",
      questionId: MC.id,
      answer: "1", // "newton" is displayed at index 1
    });
    expect(screen.getByText("newton").className).toContain("correct");
    expect(screen.getByText("joule").className).toContain("dim");
  });

  it("marks a wrong choice and highlights the right one", async () => {
    mount(payload({ questions: [MC], answered: {} }));
    responder = () =>
      json({ result: { questionId: MC.id, type: "mc", maxMarks: 1, marksAwarded: 0, correctDisplayIndex: 1, needsSelfMark: false }, saved: true, attemptCompleted: true });
    fireEvent.click(screen.getByText("watt"));
    await waitFor(() => expect(screen.getByText("Finish")).toBeTruthy());
    expect(screen.getByText("watt").className).toContain("wrong");
    expect(screen.getByText("newton").className).toContain("correct");
  });

  it("never sends marks, a user id or a grading method", async () => {
    mount(payload({ questions: [MC], answered: {} }));
    responder = () => json({ result: { questionId: MC.id, type: "mc", maxMarks: 1, marksAwarded: 1, correctDisplayIndex: 0, needsSelfMark: false }, saved: true, attemptCompleted: true });
    fireEvent.click(screen.getByText("joule"));
    await waitFor(() => expect(gradeCalls()).toHaveLength(1));
    expect(Object.keys(gradeCalls()[0].body).sort()).toEqual(["answer", "attemptId", "attemptToken", "questionId"]);
  });

  it("completes the quiz: Finish shows the results from the marks", async () => {
    mount(payload({ questions: [MC], answered: {} }));
    responder = () => json({ result: { questionId: MC.id, type: "mc", maxMarks: 1, marksAwarded: 1, correctDisplayIndex: 0, needsSelfMark: false }, saved: true, attemptCompleted: true });
    fireEvent.click(screen.getByText("joule"));
    await waitFor(() => fireEvent.click(screen.getByText("Finish")));
    expect(screen.getByText("Quiz complete")).toBeTruthy();
    expect(screen.getByText("100% marks")).toBeTruthy();
  });
});

describe("short answers, drafts and self-marking", () => {
  it("saves the typed answer in this tab as it is typed, and restores it after a reload (FR-028)", () => {
    const { unmount } = mount();
    fireEvent.change(screen.getByPlaceholderText("Type your answer here..."), { target: { value: "F equals" } });
    expect(loadDraft(ATTEMPT, SHORT.id)).toBe("F equals");
    unmount();
    mount();
    expect((screen.getByPlaceholderText("Type your answer here...") as HTMLTextAreaElement).value).toBe("F equals");
  });

  it("clears the draft once the answer is graded", async () => {
    mount();
    responder = () =>
      json({ result: { questionId: SHORT.id, type: "short", maxMarks: 2, marksAwarded: 2, feedback: "Great.", modelAnswer: "F = ma", rubric: ["a"], needsSelfMark: false }, saved: true, attemptCompleted: false });
    fireEvent.change(screen.getByPlaceholderText("Type your answer here..."), { target: { value: "F = ma" } });
    fireEvent.click(screen.getByText("Submit answer"));
    await waitFor(() => expect(screen.getByText("Great.")).toBeTruthy());
    expect(loadDraft(ATTEMPT, SHORT.id)).toBe("");
    expect(screen.getByText("2 / 2 marks")).toBeTruthy();
  });

  it("asks the student to self-mark when the grader could not, then sends the self-mark token", async () => {
    mount();
    responder = (url) =>
      url === "/api/grade"
        ? json({
            result: { questionId: SHORT.id, type: "short", maxMarks: 2, marksAwarded: null, modelAnswer: "F = ma", rubric: ["r"], needsSelfMark: true },
            saved: false,
            degraded: true,
            aiUnavailable: true,
            attemptCompleted: null,
            selfMarkToken: "SELF-TOKEN",
          })
        : json({ saved: true, attemptCompleted: false });
    fireEvent.change(screen.getByPlaceholderText("Type your answer here..."), { target: { value: "my words" } });
    fireEvent.click(screen.getByText("Submit answer"));
    await waitFor(() => expect(screen.getByText("I got it right")).toBeTruthy());
    expect(screen.getByText(/AI marking is unavailable right now/)).toBeTruthy();
    expect(screen.queryByText("Next question")).toBeNull();

    fireEvent.click(screen.getByText("I got it right"));
    await waitFor(() => expect(screen.getByText("Next question")).toBeTruthy());
    const self = calls.find((c) => c.url === "/api/results/self-mark")!;
    expect(self.body).toEqual({
      attemptId: ATTEMPT,
      attemptToken: "TOKEN-1",
      questionId: SHORT.id,
      answer: "my words",
      correct: true,
      token: "SELF-TOKEN",
    });
  });

  it("shows when AI marking returns when today's allowance is used up", async () => {
    mount();
    responder = () =>
      json({
        result: { questionId: SHORT.id, type: "short", maxMarks: 2, marksAwarded: null, modelAnswer: "x", rubric: [], needsSelfMark: true },
        saved: false,
        attemptCompleted: false,
        selfMarkToken: "T",
        aiLimit: { reached: true, resetsAt: "2026-10-27T00:00:00+11:00" },
      });
    fireEvent.change(screen.getByPlaceholderText("Type your answer here..."), { target: { value: "answer" } });
    fireEvent.click(screen.getByText("Submit answer"));
    await waitFor(() => expect(screen.getByText(/AI marking is paused until midnight Sydney time/)).toBeTruthy());
    expect(screen.getByText("I got it wrong")).toBeTruthy();
  });

  it("keeps the self-mark step after a reload", async () => {
    const first = mount();
    responder = () =>
      json({
        result: { questionId: SHORT.id, type: "short", maxMarks: 2, marksAwarded: null, modelAnswer: "x", rubric: [], needsSelfMark: true },
        saved: false,
        attemptCompleted: false,
        selfMarkToken: "T",
      });
    fireEvent.change(screen.getByPlaceholderText("Type your answer here..."), { target: { value: "answer" } });
    fireEvent.click(screen.getByText("Submit answer"));
    await waitFor(() => expect(screen.getByText("I got it right")).toBeTruthy());
    first.unmount();
    mount();
    await waitFor(() => expect(screen.getByText("I got it right")).toBeTruthy());
  });
});

describe("a session that ends mid-quiz (FR-028)", () => {
  it("shows a sign-in prompt and keeps the typed answer", async () => {
    mount();
    responder = () => json({ error: "unauthenticated" }, 401);
    fireEvent.change(screen.getByPlaceholderText("Type your answer here..."), { target: { value: "half an answer" } });
    fireEvent.click(screen.getByText("Submit answer"));
    await waitFor(() => expect(screen.getByText(/Your session has ended/)).toBeTruthy());
    const link = screen.getByText("Sign in to continue") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toMatch(/^\/signin\?callbackUrl=/);
    expect(loadDraft(ATTEMPT, SHORT.id)).toBe("half an answer");
    expect((screen.getByPlaceholderText("Type your answer here...") as HTMLTextAreaElement).value).toBe("half an answer");
  });
});

describe("already answered on another device (409)", () => {
  it("shows the stored mark and lets the student move on, with no error", async () => {
    mount(payload({ questions: [MC, SHORT], answered: {} }));
    responder = () =>
      json({ error: "already_answered", result: { questionId: MC.id, type: "mc", maxMarks: 1, marksAwarded: 1, needsSelfMark: false } }, 409);
    fireEvent.click(screen.getByText("newton"));
    await waitFor(() => expect(screen.getByText("Next question")).toBeTruthy());
    expect(screen.queryByText(/try again/)).toBeNull();
    fireEvent.click(screen.getByText("Next question"));
    expect(screen.getByText(/Question 2 of 2/)).toBeTruthy();
  });
});

describe("unsaved results go to the outbox and are retried (FR-008, FR-009)", () => {
  it("keeps the receipt, shows the mark at once, and removes it when the retry succeeds", async () => {
    mount(payload({ questions: [MC], answered: {} }));
    responder = (url) =>
      url === "/api/grade"
        ? json({
            result: { questionId: MC.id, type: "mc", maxMarks: 1, marksAwarded: 1, correctDisplayIndex: 1, needsSelfMark: false },
            saved: false,
            degraded: false,
            attemptCompleted: null,
            receipt: "RECEIPT-1",
          })
        : json({ saved: true, duplicate: false }, 200);
    fireEvent.click(screen.getByText("newton"));
    await waitFor(() => expect(screen.getByText("Finish")).toBeTruthy()); // the mark appears immediately
    await waitFor(() => expect(window.localStorage.getItem(outboxKey(UID))).not.toBeNull()); // queued
    expect(calls.some((c) => c.url === "/api/results/retry")).toBe(false); // retried later, not instantly
    act(() => {
      window.dispatchEvent(new Event("online")); // connectivity is back: the outbox is flushed
    });
    await waitFor(() => expect(calls.some((c) => c.url === "/api/results/retry" && c.body.receipt === "RECEIPT-1")).toBe(true));
    await waitFor(() => expect(window.localStorage.getItem(outboxKey(UID))).toBeNull());
    expect(screen.queryByText(/could not be saved/)).toBeNull();
  });

  it("shows 'saving' while a receipt is waiting, and says nothing is lost until it finally is", async () => {
    mount(payload({ questions: [MC], answered: {} }));
    responder = (url) =>
      url === "/api/grade"
        ? json({
            result: { questionId: MC.id, type: "mc", maxMarks: 1, marksAwarded: 1, correctDisplayIndex: 1, needsSelfMark: false },
            saved: false,
            attemptCompleted: null,
            receipt: "RECEIPT-2",
          })
        : json({ error: "temporarily_unavailable" }, 503);
    fireEvent.click(screen.getByText("newton"));
    await waitFor(() => expect(screen.getByText("Finish")).toBeTruthy());
    await waitFor(() => expect(screen.getByText(/Saving 1 result/)).toBeTruthy());
    expect(screen.queryByText(/could not be saved/)).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(outboxKey(UID))!)).toHaveLength(1);
  });

  it("tells the student only when a result is rejected for good", async () => {
    mount(payload({ questions: [MC], answered: {} }));
    responder = (url) =>
      url === "/api/grade"
        ? json({
            result: { questionId: MC.id, type: "mc", maxMarks: 1, marksAwarded: 1, correctDisplayIndex: 1, needsSelfMark: false },
            saved: false,
            attemptCompleted: null,
            receipt: "RECEIPT-3",
          })
        : json({ error: "invalid_receipt" }, 400);
    fireEvent.click(screen.getByText("newton"));
    await waitFor(() => expect(window.localStorage.getItem(outboxKey(UID))).not.toBeNull());
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    await waitFor(() => expect(screen.getByText(/A result could not be saved/)).toBeTruthy());
  });

  it("a deleted student's receipt is dropped silently (410)", async () => {
    mount(payload({ questions: [MC], answered: {} }));
    responder = (url) =>
      url === "/api/grade"
        ? json({
            result: { questionId: MC.id, type: "mc", maxMarks: 1, marksAwarded: 1, correctDisplayIndex: 1, needsSelfMark: false },
            saved: false,
            attemptCompleted: null,
            receipt: "RECEIPT-4",
          })
        : json({ error: "student_not_found" }, 410);
    fireEvent.click(screen.getByText("newton"));
    await waitFor(() => expect(window.localStorage.getItem(outboxKey(UID))).not.toBeNull());
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    await waitFor(() => expect(window.localStorage.getItem(outboxKey(UID))).toBeNull());
    expect(screen.queryByText(/could not be saved/)).toBeNull();
  });
});

describe("offline mode: the server could not load the attempt (research R19)", () => {
  it("runs from the attempt saved in sessionStorage when the quiz started", () => {
    saveAttemptPayload(ATTEMPT, payload({ attemptToken: "TOKEN-OFFLINE" }));
    mount(null);
    expect(screen.getByText(/Question 1 of 3/)).toBeTruthy();
  });

  it("sends the stored attempt token when answering", async () => {
    saveAttemptPayload(ATTEMPT, payload({ attemptToken: "TOKEN-OFFLINE", questions: [MC], answered: {} }));
    mount(null);
    responder = () =>
      json({ result: { questionId: MC.id, type: "mc", maxMarks: 1, marksAwarded: 1, correctDisplayIndex: 1, needsSelfMark: false }, saved: false, degraded: true, attemptCompleted: null, receipt: "R" });
    fireEvent.click(screen.getByText("newton"));
    await waitFor(() => expect(gradeCalls()).toHaveLength(1));
    expect(gradeCalls()[0].body.attemptToken).toBe("TOKEN-OFFLINE");
    await waitFor(() => expect(screen.getByText("Finish")).toBeTruthy());
    // the results screen is built from local marks while the server could not say
    fireEvent.click(screen.getByText("Finish"));
    expect(screen.getByText("Quiz complete")).toBeTruthy();
    expect(screen.getByText("100% marks")).toBeTruthy();
  });

  it("says so, and offers a way back, when there is nothing stored for this attempt", async () => {
    mount(null);
    await waitFor(() => expect(screen.getByText(/can.t be loaded right now/)).toBeTruthy());
    expect(screen.getByText("Back to unit")).toBeTruthy();
  });
});

describe("a rejected attempt token", () => {
  it("reloads the page to get a fresh token, keeping the draft", async () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload, pathname: "/unit/x/quiz", search: "?attempt=1" });
    mount();
    responder = () => json({ error: "invalid_attempt_token" }, 400);
    saveDraft(ATTEMPT, SHORT.id, "my draft");
    fireEvent.change(screen.getByPlaceholderText("Type your answer here..."), { target: { value: "my draft" } });
    fireEvent.click(screen.getByText("Submit answer"));
    await waitFor(() => expect(reload).toHaveBeenCalled());
    expect(loadDraft(ATTEMPT, SHORT.id)).toBe("my draft");
  });
});

describe("retry quiz", () => {
  it("starts a new attempt and opens it", async () => {
    mount(payload({ answered: { [SHORT.id]: { marks: 2, max: 2 }, [MC.id]: { marks: 1, max: 1 }, [MC2.id]: { marks: 1, max: 1 } } }));
    responder = () =>
      json(
        { attemptId: "new-attempt-id", attemptToken: "T2", persisted: true, unitId: UNIT, passMark: 70, questions: [MC], answered: {} },
        201,
      );
    await act(async () => {
      fireEvent.click(screen.getByText("Retry quiz"));
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith(`/unit/${UNIT}/quiz?attempt=new-attempt-id`));
    expect(calls.find((c) => c.url === "/api/attempts")!.body).toEqual({ unitId: UNIT });
    expect(window.sessionStorage.getItem("attempt:new-attempt-id")).toContain("T2");
  });
});
