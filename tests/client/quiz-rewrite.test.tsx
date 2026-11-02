// @vitest-environment jsdom
//
// The browser side of a sentence-rewrite question (spec 005): the rewrite panel renders (not the
// multiple-choice layout), the live word counter, a 3/3 answer going straight to the discussion,
// the hinted retry sending phase 2, the FR-045 hint with no terms, the phase 1 sentence shown
// under "Your sentence" at the retry and on the self-mark screen, resuming at the retry, and the
// compulsory retry (no Skip button, FR-042).

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Quiz } from "@/components/Quiz";
import type { AttemptPayload } from "@/lib/drafts";
import type { RewriteGradeResult } from "@/lib/grading";
import type { Question } from "@/lib/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/navigation", () => ({ reloadPage: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const UID = "6f0b6a53-3a39-4a3e-8d5b-0b2f6f3c9d11";
const ATTEMPT = "33333333-3a39-4a3e-8d5b-0b2f6f3c9d11";
const UNIT = "y12-economics-sentence-writing";

const REWRITE: Question = {
  id: `${UNIT}.w01`,
  type: "rewrite",
  prompt: "The government put a tax on stuff coming in from overseas, so people bought more stuff made at home.",
  maxMarks: 3,
};
const SHORT: Question = { id: `${UNIT}.s01`, type: "short", prompt: "A second question.", maxMarks: 2 };

const DISCUSSION = {
  modelSentences: ["A tariff raises the price of imports, so consumers buy more from domestic producers."],
  terms: [
    { term: "tariff", definition: "A tax on imported goods that raises their price.", why: "the tax is on goods from overseas" },
    { term: "domestic producers", definition: "Firms that make goods inside the home country.", why: "the stuff made at home" },
  ],
};
const HINT = { terms: [{ term: "tariff", definition: "A tax on imported goods that raises their price." }] };

const rewriteResult = (over: Partial<RewriteGradeResult>): RewriteGradeResult => ({
  questionId: REWRITE.id,
  type: "rewrite",
  maxMarks: 3,
  phase: 1,
  marksAwarded: 3,
  feedback: "Good.",
  termOutcomes: [],
  needsSelfMark: false,
  ...over,
});

const payload = (over: Partial<AttemptPayload> = {}): AttemptPayload => ({
  attemptToken: "TOKEN-1",
  unitId: UNIT,
  passMark: 60,
  questions: [REWRITE, SHORT],
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

const mount = (initial: AttemptPayload = payload()) =>
  render(<Quiz uid={UID} attemptId={ATTEMPT} unitId={UNIT} initial={initial} />);

const gradeCalls = () => calls.filter((c) => c.url === "/api/grade");
const textbox = () => screen.getByPlaceholderText(/Rewrite the sentence in economics language/);
const type = (text: string) => fireEvent.change(textbox(), { target: { value: text } });

describe("rendering a rewrite question", () => {
  it("shows the rewrite panel with a text box and word counter, not the multiple-choice layout", () => {
    mount();
    expect(screen.getByText(REWRITE.prompt)).toBeTruthy();
    expect(screen.getByText(/Sentence rewrite/)).toBeTruthy();
    expect(screen.queryByText(/Multiple choice/)).toBeNull();
    expect(textbox()).toBeTruthy();
    expect(screen.getByText(/0\/25 words/)).toBeTruthy();
    // no Photo mode for this question type (FR-009)
    expect(screen.queryByRole("tablist", { name: "Answer mode" })).toBeNull();
    // nothing typed yet: submit is disabled (FR-041)
    expect((screen.getByText("Submit answer") as HTMLButtonElement).disabled).toBe(true);
  });

  it("counts words live and allows submitting over the limit (FR-012)", () => {
    mount();
    type(Array.from({ length: 26 }, (_, n) => `w${n}`).join(" "));
    expect(screen.getByText(/26\/25 words/)).toBeTruthy();
    expect(screen.getByText(/over the limit/)).toBeTruthy();
    expect((screen.getByText("Submit answer") as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("phase 1", () => {
  it("sends phase 1 and goes straight to the discussion on 3/3 (FR-014)", async () => {
    mount();
    responder = () =>
      json({ result: rewriteResult({ marksAwarded: 3, discussion: DISCUSSION }), saved: true, attemptCompleted: false });
    type("A tariff raises import prices, so consumers buy from domestic producers.");
    fireEvent.click(screen.getByText("Submit answer"));
    await waitFor(() => expect(screen.getByText("Next question")).toBeTruthy());

    expect(gradeCalls()).toHaveLength(1);
    expect(gradeCalls()[0].body).toMatchObject({
      attemptId: ATTEMPT,
      attemptToken: "TOKEN-1",
      questionId: REWRITE.id,
      answer: "A tariff raises import prices, so consumers buy from domestic producers.",
      phase: 1,
    });
    expect(screen.getByText(DISCUSSION.modelSentences[0])).toBeTruthy();
    expect(screen.queryByPlaceholderText(/Rewrite the sentence/)).toBeNull();
    expect(screen.queryByText(/Terms to use in your retry/)).toBeNull();
    // no separate "Your sentence" block outside the discussion (the discussion shows "Your sentences")
    expect(screen.queryByText("Your sentence")).toBeNull();
  });
});

describe("the hinted retry", () => {
  it("shows only the missed terms, then sends phase 2 and shows the discussion (FR-015 to FR-018)", async () => {
    mount();
    responder = () =>
      json({ result: rewriteResult({ marksAwarded: 1, feedback: "Name the tax.", hint: HINT }), saved: false, phaseSaved: true, attemptCompleted: false });
    type("The government taxed imports so people bought local stuff.");
    fireEvent.click(screen.getByText("Submit answer"));
    await waitFor(() => expect(screen.getByText(/Terms to use in your retry/)).toBeTruthy());

    // the phase 1 sentence is shown under "Your sentence", above the feedback and the hint
    expect(screen.getByText("Your sentence")).toBeTruthy();
    expect(screen.getByText("The government taxed imports so people bought local stuff.")).toBeTruthy();
    const yourSentence = screen.getByText("Your sentence");
    const hint = screen.getByText(/Terms to use in your retry/);
    expect(yourSentence.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // the retry text box starts empty
    expect((textbox() as HTMLTextAreaElement).value).toBe("");

    // the hint: the missed term with its definition, a fresh text box, no Next yet
    expect(screen.getByText("tariff")).toBeTruthy();
    expect(screen.queryByText("domestic producers")).toBeNull();
    expect(screen.getByText("Name the tax.")).toBeTruthy();
    expect(textbox()).toBeTruthy();
    expect(screen.getByText("Submit retry")).toBeTruthy();
    expect(screen.queryByText("Next question")).toBeNull();

    responder = () =>
      json({
        result: rewriteResult({ phase: 2, marksAwarded: 2, feedback: "Better.", discussion: DISCUSSION }),
        saved: true,
        attemptCompleted: false,
      });
    type("A tariff raised import prices, so people bought local goods.");
    fireEvent.click(screen.getByText("Submit retry"));
    await waitFor(() => expect(screen.getByText("Next question")).toBeTruthy());

    expect(gradeCalls()).toHaveLength(2);
    expect(gradeCalls()[1].body).toMatchObject({
      questionId: REWRITE.id,
      answer: "A tariff raised import prices, so people bought local goods.",
      phase: 2,
    });
    expect(screen.getByText(DISCUSSION.modelSentences[0])).toBeTruthy();
    expect(screen.getByText(/Phase 1:/)).toBeTruthy();
    expect(screen.getByText(/Phase 2:/)).toBeTruthy();
    expect(screen.queryByPlaceholderText(/Rewrite the sentence/)).toBeNull();
  });

  it("names the lost criterion when every term was used (FR-045)", async () => {
    mount();
    responder = () =>
      json({
        result: rewriteResult({
          marksAwarded: 2,
          hint: { terms: [], lostCriterion: "c", criterionText: "Cut it to 25 words or fewer." },
        }),
        saved: false,
        phaseSaved: true,
        attemptCompleted: false,
      });
    type("A long but correct sentence.");
    fireEvent.click(screen.getByText("Submit answer"));
    await waitFor(() => expect(screen.getByText("What to fix")).toBeTruthy());
    expect(screen.getByText("Cut it to 25 words or fewer.")).toBeTruthy();
    expect(screen.getByText("Submit retry")).toBeTruthy();
  });

  it("resumes at the retry with the hint showing and the phase 1 sentence intact (FR-021)", () => {
    mount(
      payload({
        rewriteState: {
          [REWRITE.id]: { phase: "phase1", phase1Answer: "The government taxed imports.", marks: 1, hint: HINT },
        },
      }),
    );
    expect(screen.getByText(/Terms to use in your retry/)).toBeTruthy();
    expect(screen.getByText("tariff")).toBeTruthy();
    expect(screen.getByText("Submit retry")).toBeTruthy();
    expect(screen.queryByText("Next question")).toBeNull();
    // the phase 1 sentence is shown under "Your sentence"
    expect(screen.getByText("Your sentence")).toBeTruthy();
    expect(screen.getByText("The government taxed imports.")).toBeTruthy();
  });

  it("has no Skip button at the retry, and Next question stays hidden until phase 2 is submitted (FR-042)", async () => {
    mount(
      payload({
        rewriteState: {
          [REWRITE.id]: { phase: "phase1", phase1Answer: "The government taxed imports.", marks: 1, hint: HINT },
        },
      }),
    );
    // the retry is compulsory: no Skip button, and no Next until phase 2 is submitted
    expect(screen.queryByText(/Skip retry/)).toBeNull();
    expect(screen.queryByText("Next question")).toBeNull();

    responder = () =>
      json({
        result: rewriteResult({ phase: 2, marksAwarded: 2, feedback: "Better.", discussion: DISCUSSION }),
        saved: true,
        attemptCompleted: false,
      });
    type("A tariff raised import prices, so people bought local goods.");
    fireEvent.click(screen.getByText("Submit retry"));
    await waitFor(() => expect(screen.getByText("Next question")).toBeTruthy());
    expect(gradeCalls()).toHaveLength(1);
    expect(gradeCalls()[0].body).toMatchObject({ questionId: REWRITE.id, phase: 2 });
  });

  it("shows the phase 1 sentence on the self-mark screen after a phase 1 model failure (FR-030)", async () => {
    mount();
    responder = () =>
      json({
        result: rewriteResult({ marksAwarded: null, needsSelfMark: true, discussion: DISCUSSION }),
        saved: false,
        attemptCompleted: false,
        selfMarkToken: "SM-1",
      });
    type("The government taxed imports so people bought local stuff.");
    fireEvent.click(screen.getByText("Submit answer"));
    await waitFor(() => expect(screen.getByText("Save my mark")).toBeTruthy());

    // the sentence being marked is shown under "Your sentence", above the model sentence
    // (the model sentence also appears in the discussion block below, so take the first)
    expect(screen.getByText("Your sentence")).toBeTruthy();
    expect(screen.getByText("The government taxed imports so people bought local stuff.")).toBeTruthy();
    const yourSentence = screen.getByText("Your sentence");
    const model = screen.getAllByText(DISCUSSION.modelSentences[0])[0];
    expect(yourSentence.compareDocumentPosition(model) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
