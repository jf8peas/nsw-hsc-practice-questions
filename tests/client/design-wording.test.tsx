// @vitest-environment jsdom
//
// The on-screen wording of the paragraph unit matches design.md exactly (spec 007 FR-010): every
// label, heading, helper line, button and summary line, in each state of the question card.

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UNITS } from "@/content";
import { Quiz } from "@/components/Quiz";
import type { AttemptPayload } from "@/lib/drafts";
import { paragraphDiscussion, paragraphQuestionView } from "@/lib/grading.server";
import type { CriterionView, ParagraphGradeResult, ParagraphState } from "@/lib/paragraph/types";
import type { ParagraphQuestion } from "@/lib/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/navigation", () => ({ reloadPage: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const UNIT = "y12-economics-paragraph-writing";
const Q3 = `${UNIT}.e01p3`;
const question = UNITS.find((u) => u.id === UNIT)!.questions.find((q) => q.id === Q3) as ParagraphQuestion;
const crit = (met: string): CriterionView[] =>
  (["a", "b", "c", "d"] as const).map((key) => ({ key, met: met.includes(key), reason: "Because." }));

let responder: (url: string, body: Record<string, unknown>) => Response | Promise<Response>;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
beforeEach(() => {
  window.sessionStorage.clear();
  responder = () => json({});
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => responder(String(url), init?.body ? JSON.parse(String(init.body)) : {})));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const mount = (state: ParagraphState) => {
  const initial: AttemptPayload = { attemptToken: "T", unitId: UNIT, passMark: 60, questions: [question], answered: {}, paragraphState: state };
  return render(<Quiz uid="u" attemptId="44444444-3a39-4a3e-8d5b-0b2f6f3c9d11" unitId={UNIT} initial={initial} />);
};
const view = () => paragraphQuestionView(Q3)!;
const has = (...texts: string[]) => {
  for (const t of texts) expect(screen.getAllByText(t, { exact: false }).length, t).toBeGreaterThan(0);
};
const hasExact = (...texts: string[]) => {
  for (const t of texts) expect(screen.getAllByText(t).length, t).toBeGreaterThan(0);
};

describe("writing", () => {
  it("uses the design wording", () => {
    mount({ stage: "write", view: view() });
    hasExact(
      "ESSAY QUESTION", "What this part must do", "Marked out of 4 on these", "The brief",
      "The content in plain English — you do the writing", "The model paragraph so far", "Your part continues from here",
      "Write the Evidence & Application", "Every figure you need is in the brief",
      "Lose a mark? You’ll get one correction with tips, worth up to 3 marks.",
      "Paragraph writing · 4 marks", "Essay 1 · Part 3 of 5",
    );
    for (const label of ["Economy", "Argument", "Counterpoint", "Chain steps", "Facts", "Limitation"]) {
      expect(screen.getAllByText(label, { exact: false }).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByText("Use in this part").length).toBe(view().uses.length);
    expect(screen.getByRole("button", { name: /Submit for marking/ })).toBeTruthy();
    expect(screen.getByLabelText("Steps").textContent).toContain("Write");
    expect(screen.getByLabelText("Steps").textContent).toContain("Correct with tips");
    expect(screen.getByLabelText("Steps").textContent).toContain("Discuss");
    has("0 / 80 words");
  });
});

describe("marking", () => {
  it("uses the design wording for the locked block, status steps and footer", async () => {
    responder = () => new Promise(() => {});
    mount({ stage: "write", view: view() });
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "My evidence" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit for marking/ }));
    await waitFor(() => has("Your Evidence & Application"));
    hasExact("Read your writing", "Writing your feedback", "The brief and the model paragraph so far", "Usually takes 10–20 seconds.");
    has("Checking it against the four criteria…");
    expect(screen.getByRole("button", { name: /Marking…/ })).toBeTruthy();
  });
});

describe("result and correction", () => {
  it("uses the design wording", () => {
    mount({ stage: "correct", view: view(), phase1: { text: "My first try text", mark: 2, criteria: crit("ad"), feedback: "Make them argue.", wordCount: 4 } });
    hasExact("FIRST TRY", "2 / 4", "Make them argue.", "Fix these in your correction", "Your correction", "Starts from your first try — edit it", "Correction is worth up to 3 marks");
    expect(screen.getByLabelText("Results by criterion")).toBeTruthy();
    has("Your first try · 4 words", "Lost: (b) Ties every number to what it shows");
    expect(screen.getByLabelText("Steps").textContent).toContain("Write · 2/4");
    expect(screen.getByRole("button", { name: /Submit correction/ })).toBeTruthy();
  });
});

describe("discussion", () => {
  const corrected = (): ParagraphState => ({
    stage: "discussion", view: view(), ending: "corrected", recordedMark: 3, mode: "marker",
    phase1: { text: "My first try text", mark: 2, criteria: crit("ad"), feedback: "Make them argue.", wordCount: 4 },
    phase2: { text: "My correction text", mark: 3, criteria: crit("abcd"), feedback: "Explained.", wordCount: 3 },
    discussion: paragraphDiscussion(Q3)!,
  });
  it("uses the design wording for the corrected discussion", () => {
    mount(corrected());
    hasExact(
      "Your correction, criterion by criterion", "First try", "Fixed in correction",
      "Think the marker got a criterion wrong? Flag it and your teacher will look at it.",
      "YOUR CORRECTION", "MODEL EVIDENCE & APPLICATION", "The model paragraph", "This part",
      "4 · EVALUATION — NEXT QUIZ", "5 · LINK — QUIZ AFTER", "Added to Things I need to know",
      "Missed on your first try, so they count even though you fixed them",
      "Next quiz: Part 4 of 5, Evaluation & Limitation",
    );
    expect(screen.getByRole("button", { name: /This mark seems wrong/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Finish/ })).toBeTruthy();
    has("Full marks for a correction — every criterion met.", "A correction can earn at most 3. Meet all four on the first try next time for the full 4.");
    expect(screen.getByLabelText("Steps").textContent).toContain("Correct · 3/3");
  });

  it("uses the design wording for the other summaries", () => {
    const full: ParagraphState = { stage: "discussion", view: view(), ending: "full_marks", recordedMark: 4, mode: "marker", phase1: { text: "t", mark: 4, criteria: crit("abcd"), feedback: "Spot on.", wordCount: 1 }, discussion: paragraphDiscussion(Q3)! };
    mount(full);
    has("Full marks on your first try.", "Spot on.");
    expect(screen.getByLabelText("Steps").textContent).toContain("Write · 4/4");
    cleanup();
    mount({ ...full, ending: "no_correction", recordedMark: 2, phase1: { text: "t", mark: 2, criteria: crit("ad"), feedback: "f", wordCount: 1 } });
    has("Your first try is recorded: 2 / 4 marks.", "We couldn't mark a correction this time, so your first-try mark stands. The tips below are what to work on.", "Work on these next");
    cleanup();
    mount({ ...full, ending: "self_mark", recordedMark: 3, mode: "self_mark", phase1: { text: "t", mark: 3, criteria: crit("abc").map((c) => ({ ...c, reason: "" })), feedback: "", wordCount: 1 } });
    has("You marked 3 / 4.", "Compare your text with the model part.");
  });

  it("the flag button reads 'Flagged for your teacher' once flagged", () => {
    mount({ ...corrected(), flagged: true });
    expect(screen.getByRole("button", { name: /Flagged for your teacher/ })).toBeTruthy();
  });

  it("the footer names the next essay after the Link", () => {
    expect(paragraphDiscussion(`${UNIT}.e01p5`)!.next).toEqual({ kind: "essay", essayNo: 2, part: 1, name: "Topic Sentence" });
    expect(paragraphDiscussion(`${UNIT}.e02p5`)!.next).toEqual({ kind: "none" }); // the last essay in the shipped bank
    expect(paragraphDiscussion(`${UNIT}.e01p2`)!.next).toEqual({ kind: "part", essayNo: 1, part: 3, name: "Evidence & Application" });
  });
});
