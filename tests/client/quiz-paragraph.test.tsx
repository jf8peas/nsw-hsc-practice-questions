// @vitest-environment jsdom
//
// The browser side of the paragraph unit (spec 007): the question screen, the locked marking state
// with the text never cleared, the result + tip cards + pre-filled correction, the discussion
// variants (full marks, corrected, FR-019a, self-mark), the flag, focus, and resume.

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UNITS } from "@/content";
import { Quiz } from "@/components/Quiz";
import type { AttemptPayload } from "@/lib/drafts";
import { paragraphDiscussion, paragraphQuestionView } from "@/lib/grading.server";
import type { CriterionView, ParagraphGradeResult, ParagraphState } from "@/lib/paragraph/types";
import type { ParagraphQuestion } from "@/lib/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));
vi.mock("@/lib/navigation", () => ({ reloadPage: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const UID = "6f0b6a53-3a39-4a3e-8d5b-0b2f6f3c9d11";
const ATTEMPT = "44444444-3a39-4a3e-8d5b-0b2f6f3c9d11";
const UNIT = "y12-economics-paragraph-writing";
const questionOf = (id: string) => UNITS.find((u) => u.id === UNIT)!.questions.find((q) => q.id === id) as ParagraphQuestion;
const Q3 = `${UNIT}.e01p3`; // Evidence & Application: limit 80, uses chain steps and facts
const Q5 = `${UNIT}.e01p5`;

const crit = (met: string, reason = "A reason."): CriterionView[] =>
  (["a", "b", "c", "d"] as const).map((key) => ({
    key,
    met: met.includes(key),
    reason,
    ...(key === "d" ? { subs: { preciseLanguage: met.includes("d"), noPadding: met.includes("d"), withinLimit: true } } : {}),
  }));

const writeState = (qid = Q3, extra: Partial<ParagraphState> = {}): ParagraphState => ({ stage: "write", view: paragraphQuestionView(qid)!, ...extra });

const payloadFor = (qid: string, state: ParagraphState): AttemptPayload => ({
  attemptToken: "TOKEN-1",
  unitId: UNIT,
  passMark: 60,
  questions: [questionOf(qid)],
  answered: {},
  paragraphState: state,
});

type FetchCall = { url: string; body: Record<string, unknown> };
let calls: FetchCall[];
let responder: (url: string, body: Record<string, unknown>) => Response | Promise<Response>;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

beforeEach(() => {
  calls = [];
  push.mockReset();
  responder = () => json({});
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
});

const mount = (qid = Q3, state: ParagraphState = writeState(qid)) =>
  render(<Quiz uid={UID} attemptId={ATTEMPT} unitId={UNIT} initial={payloadFor(qid, state)} />);
const box = () => screen.getByRole("textbox") as HTMLTextAreaElement;
const gradeCalls = () => calls.filter((c) => c.url === "/api/grade");

const under4 = (qid = Q3): { result: ParagraphGradeResult; saved: boolean; phaseSaved: boolean; attemptCompleted: boolean } => ({
  result: { questionId: qid, type: "paragraph", maxMarks: 4, phase: 1, marksAwarded: 2, criteria: crit("ad"), feedback: "Tie each figure to what it shows.", wordCount: 6, needsSelfMark: false },
  saved: false, phaseSaved: true, attemptCompleted: false,
});
const corrected = (qid = Q3, p1 = 2) => ({
  result: {
    questionId: qid, type: "paragraph", maxMarks: 4, phase: 2, marksAwarded: 3, recordedMark: Math.max(p1, 3), ending: "corrected",
    criteria: crit("abcd"), feedback: "Now every figure is explained.", wordCount: 9,
    phase1: { text: "First try text here", mark: p1, criteria: crit("ad"), feedback: "Tie each figure.", wordCount: 4 },
    discussion: paragraphDiscussion(qid)!, needsSelfMark: false,
  } satisfies ParagraphGradeResult,
  saved: true, attemptCompleted: true,
});

describe("the question screen (writing)", () => {
  it("shows the progress bar, the question with its verb, the guidance, the brief, the earlier models and the slot", () => {
    mount();
    expect(screen.getByLabelText("Essay 1 progress: part 3 of 5")).toBeTruthy();
    expect(screen.getByText("Paragraph writing · 4 marks")).toBeTruthy();
    expect(screen.getByText("Essay 1 · Part 3 of 5")).toBeTruthy();
    const verb = document.querySelector("mark.pg-verb")!;
    expect(verb.textContent?.toLowerCase()).toBe("evaluate");
    expect(screen.getByText(/make a judgement based on criteria/)).toBeTruthy();
    const view = paragraphQuestionView(Q3)!;
    for (const line of view.guidance) expect(screen.getByText(line)).toBeTruthy();
    expect(document.querySelectorAll(".pg-brief-row").length).toBe(6);
    expect(document.querySelectorAll(".pg-use-pill").length).toBe(view.uses.length);
    for (const e of view.earlier) expect(screen.getByText(e.text)).toBeTruthy();
    expect(screen.getByText("3 · Evidence & Application — you write this below")).toBeTruthy();
    // later parts' model text is not in the page
    const q5model = paragraphDiscussion(Q5)!.modelPart;
    expect(document.body.textContent).not.toContain(q5model.slice(0, 40));
    expect(box().placeholder).toBe("Write your part here…");
  });

  it("counts words like the marker and shows the over state without blocking submission", () => {
    mount(Q3);
    const over = Array.from({ length: 81 }, () => "word").join(" ");
    fireEvent.change(box(), { target: { value: over } });
    expect(screen.getByText(/81 \/ 80 words · over the limit/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /Submit for marking/ }) as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("marking: the text stays, locked, and an error returns it", () => {
  it("locks the submitted text with a live status region, and never clears it", async () => {
    const d = deferred<Response>();
    responder = () => d.promise;
    mount();
    fireEvent.change(box(), { target: { value: "My evidence paragraph." } });
    fireEvent.click(screen.getByRole("button", { name: /Submit for marking/ }));
    await waitFor(() => expect(screen.getByText("My evidence paragraph.")).toBeTruthy());
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("Usually takes 10–20 seconds.")).toBeTruthy();
    expect(gradeCalls()[0].body).toMatchObject({ attemptId: ATTEMPT, questionId: Q3, answer: "My evidence paragraph.", phase: 1 });
    d.resolve(json(under4()));
    await waitFor(() => expect(screen.getByText("Fix these in your correction")).toBeTruthy());
  });

  it("returns the editable box holding the text on a server error and on a network error", async () => {
    responder = () => json({ error: "boom" }, 500);
    mount();
    fireEvent.change(box(), { target: { value: "Keep this text" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit for marking/ }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(box().value).toBe("Keep this text");

    cleanup();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    mount();
    fireEvent.change(box(), { target: { value: "Still here" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit for marking/ }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/Could not reach the server/));
    expect(box().value).toBe("Still here");
  });
});

describe("result, tip cards and the correction", () => {
  async function toCorrection() {
    responder = () => json(under4());
    mount();
    fireEvent.change(box(), { target: { value: "First try text here" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit for marking/ }));
    await waitFor(() => expect(screen.getByText("Fix these in your correction")).toBeTruthy());
  }

  it("shows the mark, a verdict with an accessible name and a reason per criterion, and a card per lost criterion", async () => {
    await toCorrection();
    expect(screen.getByText("2 / 4")).toBeTruthy();
    const list = screen.getByRole("list", { name: "Results by criterion" });
    expect(within(list).getAllByRole("img", { name: "Met" })).toHaveLength(2);
    expect(within(list).getAllByRole("img", { name: "Not met" })).toHaveLength(2);
    expect(within(list).getAllByText("A reason.")).toHaveLength(4);
    const cards = document.querySelectorAll(".pg-tip-card");
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain("Lost: (b) Ties every number to what it shows");
    expect(cards[0].textContent).toContain("Tie every number to what it shows; no data dumping.");
    expect(cards[1].textContent).toContain("Lost: (c) Connects the evidence back to the mechanism");
  });

  it("pre-fills the correction with the first try, focused, and offers no skip and no third try", async () => {
    await toCorrection();
    const correction = box();
    expect(correction.value).toBe("First try text here");
    await waitFor(() => expect(document.activeElement).toBe(correction));
    expect(correction.selectionStart).toBe(correction.value.length);
    expect(screen.getByText("Correction is worth up to 3 marks")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /skip/i })).toBeNull();
    expect(screen.getByRole("button", { name: /Submit correction/ })).toBeTruthy();
  });

  it("locks the correction while it is marked and sends phase 2", async () => {
    await toCorrection();
    const d = deferred<Response>();
    responder = () => d.promise;
    fireEvent.change(box(), { target: { value: "Better text with explanation" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit correction/ }));
    await waitFor(() => expect(screen.getByText("Correction is worth up to 3 marks.")).toBeTruthy());
    expect(screen.getByText("Better text with explanation")).toBeTruthy();
    expect(gradeCalls().at(-1)!.body).toMatchObject({ phase: 2, answer: "Better text with explanation" });
    d.resolve(json(corrected()));
    await waitFor(() => expect(screen.getByText(/Full marks for a correction/)).toBeTruthy());
  });
});

describe("the discussion", () => {
  async function toDiscussion(p1 = 2) {
    responder = (_u, body) => (body.phase === 2 ? json(corrected(Q3, p1)) : json(under4()));
    mount();
    fireEvent.change(box(), { target: { value: "First try text here" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit for marking/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Submit correction/ })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /Submit correction/ }));
    await waitFor(() => expect(screen.getByText(/Full marks for a correction/)).toBeTruthy());
  }

  it("takes focus on the summary and shows the recorded mark, the cap line, pills, the beside cards and the model so far", async () => {
    await toDiscussion();
    const summary = document.querySelector(".rw-summary") as HTMLElement;
    expect(document.activeElement).toBe(summary);
    expect(summary.textContent).toContain("3 / 4 marks");
    expect(summary.textContent).toContain("A correction can earn at most 3. Meet all four on the first try next time for the full 4.");
    expect(screen.getAllByText("First try").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Fixed in correction")).toHaveLength(2);
    expect(screen.getByText("Your correction, criterion by criterion")).toBeTruthy();
    expect(screen.getByText("YOUR CORRECTION")).toBeTruthy();
    expect(screen.getByText("MODEL EVIDENCE & APPLICATION")).toBeTruthy();
    const d = paragraphDiscussion(Q3)!;
    expect(document.querySelector("mark.pg-this")!.textContent).toBe(d.modelPart);
    expect(screen.getByText("4 · EVALUATION — NEXT QUIZ")).toBeTruthy();
    expect(screen.getByText("5 · LINK — QUIZ AFTER")).toBeTruthy();
    expect(document.body.textContent).not.toContain(paragraphDiscussion(Q5)!.modelPart.slice(0, 40));
    expect(screen.getByText("Added to Things I need to know")).toBeTruthy();
    expect(document.querySelectorAll(".pg-added .concept-item")).toHaveLength(2);
    expect(screen.getByText("Next quiz: Part 4 of 5, Evaluation & Limitation")).toBeTruthy();
  });

  it("says when the first try is the better mark", async () => {
    responder = (_u, body) => (body.phase === 2 ? json({ ...corrected(Q3, 3), result: { ...corrected(Q3, 3).result, criteria: crit("abd"), marksAwarded: 2, recordedMark: 3 } }) : json({ ...under4(), result: { ...under4().result, marksAwarded: 3, criteria: crit("abd") } }));
    mount();
    fireEvent.change(box(), { target: { value: "First try text here" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit for marking/ }));
    await waitFor(() => screen.getByRole("button", { name: /Submit correction/ }));
    fireEvent.click(screen.getByRole("button", { name: /Submit correction/ }));
    await waitFor(() => expect(screen.getByText("Your recorded mark is 3 / 4 (your better try).")).toBeTruthy());
  });

  it("the flag stores once and the button shows the done state", async () => {
    await toDiscussion();
    responder = () => json({ flagged: true });
    fireEvent.click(screen.getByRole("button", { name: /This mark seems wrong/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Flagged for your teacher/ })).toBeTruthy());
    expect((screen.getByRole("button", { name: /Flagged for your teacher/ }) as HTMLButtonElement).disabled).toBe(true);
    const flagCall = calls.find((c) => c.url === "/api/paragraph/flag")!;
    expect(Object.keys(flagCall.body).sort()).toEqual(["attemptId", "attemptToken", "questionId"]);
  });

  it("Finish returns to the unit page", async () => {
    await toDiscussion();
    fireEvent.click(screen.getByRole("button", { name: /Finish/ }));
    expect(push).toHaveBeenCalledWith(`/unit/${UNIT}`);
  });
});

describe("a 4/4 first try goes straight to the discussion", () => {
  it("has no correction step and no first-try row", async () => {
    responder = () =>
      json({
        result: { questionId: Q3, type: "paragraph", maxMarks: 4, phase: 1, marksAwarded: 4, recordedMark: 4, ending: "full_marks", criteria: crit("abcd"), feedback: "Spot on.", wordCount: 5, discussion: paragraphDiscussion(Q3)!, needsSelfMark: false },
        saved: true, attemptCompleted: true,
      });
    mount();
    fireEvent.change(box(), { target: { value: "Perfect text" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit for marking/ }));
    await waitFor(() => expect(screen.getByText("Full marks on your first try.")).toBeTruthy());
    expect(screen.getByText("Spot on.")).toBeTruthy();
    expect(screen.getByText("Your part, criterion by criterion")).toBeTruthy();
    expect(screen.queryByText("Correct with tips")).toBeNull();
    expect(document.querySelector(".pg-firsttry")).toBeNull();
    expect(screen.queryByText("Added to Things I need to know")).toBeNull();
  });
});

describe("FR-019a: the correction could not be marked", () => {
  it("keeps the first-try mark: tip cards, no pills, no correction box, no error", async () => {
    responder = (_u, body) =>
      body.phase === 2
        ? json({
            result: { questionId: Q3, type: "paragraph", maxMarks: 4, phase: 2, marksAwarded: null, recordedMark: 2, ending: "no_correction", criteria: crit("ad"), feedback: "Tie each figure to what it shows.", wordCount: 6, phase1: { text: "First try text here", mark: 2, criteria: crit("ad"), feedback: "Tie each figure to what it shows.", wordCount: 4 }, discussion: paragraphDiscussion(Q3)!, needsSelfMark: false },
            saved: true, attemptCompleted: true, aiLimit: { reached: true, resetsAt: "x" },
          })
        : json(under4());
    mount();
    fireEvent.change(box(), { target: { value: "First try text here" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit for marking/ }));
    await waitFor(() => screen.getByRole("button", { name: /Submit correction/ }));
    fireEvent.click(screen.getByRole("button", { name: /Submit correction/ }));
    await waitFor(() => expect(screen.getByText("Your first try is recorded: 2 / 4 marks.")).toBeTruthy());
    expect(screen.getByText(/We couldn't mark a correction this time/)).toBeTruthy();
    expect(screen.getByText("Work on these next")).toBeTruthy();
    expect(screen.queryByText("Fixed in correction")).toBeNull();
    expect(screen.queryByText("Fix these in your correction")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("button", { name: /This mark seems wrong/ })).toBeTruthy();
  });
});

describe("self-mark (the marker is unavailable at phase 1)", () => {
  it("shows the model part and four ticks, saves the ticks, and has no flag", async () => {
    responder = (url) =>
      url === "/api/grade"
        ? json({ result: { questionId: Q3, type: "paragraph", maxMarks: 4, phase: 1, marksAwarded: null, feedback: "", wordCount: 3, discussion: paragraphDiscussion(Q3)!, needsSelfMark: true }, saved: false, degraded: false, attemptCompleted: false, selfMarkToken: "SELF-TOKEN" })
        : json({ saved: true, marksAwarded: 3, recordedMark: 3, ending: "self_mark", attemptCompleted: true, discussion: paragraphDiscussion(Q3)! });
    mount();
    fireEvent.change(box(), { target: { value: "My own text" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit for marking/ }));
    await waitFor(() => expect(screen.getAllByText("Mark it yourself").length).toBeGreaterThan(0));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getAllByRole("checkbox")).toHaveLength(4);
    expect(document.body.textContent).toContain(paragraphDiscussion(Q3)!.modelPart.slice(0, 40));
    for (const c of screen.getAllByRole("checkbox").slice(0, 3)) fireEvent.click(c);
    fireEvent.click(screen.getByRole("button", { name: /Save my mark/ }));
    await waitFor(() => expect(screen.getByText("You marked 3 / 4.")).toBeTruthy());
    const save = calls.find((c) => c.url === "/api/results/self-mark")!;
    expect(save.body).toMatchObject({ token: "SELF-TOKEN", phase: 1, ticks: { a: true, b: true, c: true, d: false }, answer: "My own text" });
    expect(screen.getAllByText("Your tick").length).toBe(4);
    expect(screen.queryByRole("button", { name: /This mark seems wrong/ })).toBeNull();
  });
});

describe("resume", () => {
  it("opens the correction with the saved correction draft", () => {
    const state: ParagraphState = {
      stage: "correct", view: paragraphQuestionView(Q3)!,
      phase1: { text: "First try", mark: 2, criteria: crit("ad"), feedback: "Fix b and c.", wordCount: 2 },
      draft2: "My half-finished correction",
    };
    mount(Q3, state);
    expect(box().value).toBe("My half-finished correction");
    expect(screen.getAllByText("Lost: (b) Ties every number to what it shows").length).toBe(1);
  });
  it("falls back to the first try when there is no correction draft", () => {
    mount(Q3, { stage: "correct", view: paragraphQuestionView(Q3)!, phase1: { text: "First try", mark: 2, criteria: crit("ad"), feedback: "f", wordCount: 2 } });
    expect(box().value).toBe("First try");
  });
  it("opens the writing screen with the saved draft", () => {
    mount(Q3, writeState(Q3, { draft1: "Half a paragraph" }));
    expect(box().value).toBe("Half a paragraph");
  });
  it("opens the discussion for a final part", () => {
    const d = paragraphDiscussion(Q3)!;
    mount(Q3, {
      stage: "discussion", view: paragraphQuestionView(Q3)!, ending: "full_marks", recordedMark: 4, mode: "marker", flagged: true, discussion: d,
      phase1: { text: "Good text", mark: 4, criteria: crit("abcd"), feedback: "Great.", wordCount: 2 },
    });
    expect(screen.getByText("Full marks on your first try.")).toBeTruthy();
    expect((screen.getByRole("button", { name: /Flagged for your teacher/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});
