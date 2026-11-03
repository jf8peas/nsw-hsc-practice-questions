// @vitest-environment jsdom
//
// The browser side of the redesigned sentence-rewrite question (spec 006): the five card states
// (writing, marking first try, feedback + retry, marking retry, result) plus the self-mark
// screen, the locked sentence that stays visible while marking with the box never cleared, a
// grading error returning an editable box holding the text, the pre-filled retry box, the hint
// that never maps to the plain-English sentence, the outcome lines, the term-table statuses, the
// spans-not-found rule, resume with the drafts and display data restored, the live region and
// result focus, and reduced motion.

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Quiz } from "@/components/Quiz";
import type { AttemptPayload } from "@/lib/drafts";
import type { RewriteDiscussion, RewriteGradeResult } from "@/lib/grading";
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

const DISCUSSION: RewriteDiscussion = {
  modelSentences: ["A tariff raises the price of imports, so consumers buy more from domestic producers."],
  terms: [
    { term: "tariff", definition: "A tax on imported goods that raises their price.", why: "the tax is on goods from overseas", conceptId: "c-tariff" },
    { term: "domestic producers", definition: "Firms that make goods inside the home country.", why: "the stuff made at home", conceptId: "c-domestic" },
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

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

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
const textboxes = () => screen.getAllByPlaceholderText(/Write your sentence here/);
const textbox = (index = 0) => textboxes()[index] as HTMLTextAreaElement;
const type = (text: string, index = 0) => fireEvent.change(textbox(index), { target: { value: text } });

describe("state 1: writing", () => {
  it("shows the tracker, the plain-English block, the box, the meter, the retry info line and Submit for marking (FR-001 to FR-006)", () => {
    mount();
    expect(screen.getByText(REWRITE.prompt)).toBeTruthy();
    expect(screen.getByText(/Sentence rewrite/)).toBeTruthy();
    expect(screen.queryByText(/Multiple choice/)).toBeNull();
    expect(textbox(0)).toBeTruthy();
    expect(screen.getByText("Plain English")).toBeTruthy();
    expect(screen.getByText("Write")).toBeTruthy();
    expect(screen.getByText("Retry with hints")).toBeTruthy();
    expect(screen.getByText("Compare")).toBeTruthy();
    expect(screen.getByText("Rewrite it in economics language")).toBeTruthy();
    expect(screen.getByText("Use the precise terms an HSC marker looks for")).toBeTruthy();
    expect(screen.getByText(/0 \/ 25 words/)).toBeTruthy();
    expect(screen.getByText("Miss a term? You'll get one retry with hints, worth up to 2 marks.")).toBeTruthy();
    // no Photo mode for this question type (FR-009)
    expect(screen.queryByRole("tablist", { name: "Answer mode" })).toBeNull();
    // nothing typed yet: submit is disabled (FR-041)
    expect((screen.getByText("Submit for marking") as HTMLButtonElement).disabled).toBe(true);
  });

  it("counts words live and allows submitting over the limit (FR-005, FR-012)", () => {
    mount();
    type(Array.from({ length: 26 }, (_, n) => `w${n}`).join(" "));
    expect(screen.getByText(/26 \/ 25 words/)).toBeTruthy();
    expect(screen.getByText(/over the limit/)).toBeTruthy();
    expect((screen.getByText("Submit for marking") as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("state 2: marking first try", () => {
  it("keeps the submitted sentence visible in the locked block while marking and never clears the box (FR-007, FR-045)", async () => {
    const d = deferred<Response>();
    responder = () => d.promise;
    mount();
    type("A tariff raises import prices, so consumers buy from domestic producers.");
    fireEvent.click(screen.getByText("Submit for marking"));
    // the locked block shows the sentence with its word count; the status list ticks
    expect(screen.getByText("Your sentence")).toBeTruthy();
    expect(screen.getByText("A tariff raises import prices, so consumers buy from domestic producers.")).toBeTruthy();
    expect(screen.getByText(/11 \/ 25 words/)).toBeTruthy();
    expect(screen.getAllByText("Read your sentence").length).toBeGreaterThan(0);
    expect(screen.getByText("Checking your economics terms…")).toBeTruthy();
    expect(screen.getByText("Writing your feedback")).toBeTruthy();
    expect(screen.getByText("Usually takes a few seconds.")).toBeTruthy();
    expect(screen.getByText("Marking…")).toBeTruthy();
    d.resolve(
      json({ result: rewriteResult({ marksAwarded: 3, discussion: DISCUSSION }), saved: true, attemptCompleted: false }),
    );
    await waitFor(() => expect(screen.getByText("Full marks on your first try.")).toBeTruthy());
  });

  it("returns an editable box holding the text on a grading error (FR-011, FR-045)", async () => {
    const d = deferred<Response>();
    responder = () => d.promise;
    mount();
    type("A tariff raises import prices.");
    fireEvent.click(screen.getByText("Submit for marking"));
    await waitFor(() => expect(screen.getByText("Your sentence")).toBeTruthy());
    d.resolve(new Response("boom", { status: 500 }));
    await waitFor(() => expect(screen.getByText(/Grader returned 500/)).toBeTruthy());
    // the box is editable again and holds the same text
    await waitFor(() => expect(textbox(0).disabled).toBe(false));
    expect(textbox(0).value).toBe("A tariff raises import prices.");
  });
});

describe("state 3: feedback + retry", () => {
  it("shows the first-try result, the hint and a pre-filled retry box (FR-012 to FR-017, FR-046)", async () => {
    mount();
    responder = () =>
      json({ result: rewriteResult({ marksAwarded: 1, feedback: "Name the tax.", hint: HINT }), saved: false, phaseSaved: true, attemptCompleted: false });
    type("The government taxed imports so people bought local stuff.");
    fireEvent.click(screen.getByText("Submit for marking"));
    await waitFor(() => expect(screen.getByText("Use these terms in your retry")).toBeTruthy());

    expect(screen.getByText("First try")).toBeTruthy();
    expect(screen.getByText("Name the tax.")).toBeTruthy();
    expect(screen.getByText("Your first try")).toBeTruthy();
    // the retry box is pre-filled with the first-try sentence (FR-046)
    await waitFor(() => expect(textbox(0).value).toBe("The government taxed imports so people bought local stuff."));
    expect(screen.getByText("Your retry")).toBeTruthy();
    expect(screen.getByText("Starts from your first try — edit it")).toBeTruthy();
    expect(screen.getByText("Retry is worth up to 2 marks")).toBeTruthy();
    expect(screen.getByText("Submit retry")).toBeTruthy();
    // no Next yet (the retry is compulsory, FR-042)
    expect(screen.queryByText("Next question")).toBeNull();
  });

  it("the hint never maps to the plain-English sentence and the plain-English sentence is never highlighted (FR-047)", async () => {
    mount();
    responder = () =>
      json({ result: rewriteResult({ marksAwarded: 1, feedback: "Name the tax.", hint: HINT }), saved: false, phaseSaved: true, attemptCompleted: false });
    type("The government taxed imports so people bought local stuff.");
    fireEvent.click(screen.getByText("Submit for marking"));
    await waitFor(() => expect(screen.getByText("Use these terms in your retry")).toBeTruthy());
    // the hint card has the term and its definition only
    expect(screen.getByText("tariff")).toBeTruthy();
    expect(screen.getByText("A tax on imported goods that raises their price.")).toBeTruthy();
    // no "replaces" line anywhere, and the hint cards contain only the term and its definition
    expect(screen.queryByText(/replaces/)).toBeNull();
    const hintCards = document.querySelectorAll(".rw-hint-card");
    expect(hintCards.length).toBeGreaterThan(0);
    for (const card of hintCards) {
      expect(card.textContent).not.toMatch(/stuff coming in from overseas/);
      expect(card.textContent).not.toMatch(/replaces/);
    }
    // the plain-English sentence is rendered without any highlight
    const plain = screen.getByText(REWRITE.prompt);
    expect(plain.querySelector("mark")).toBeNull();
  });

  it("shows the What to fix criterion hint when every term was used (FR-016, FR-045)", async () => {
    mount();
    responder = () =>
      json({
        result: rewriteResult({
          marksAwarded: 2,
          hint: { terms: [], lostCriterion: "c", criterionText: "Cut your sentence to 25 words or fewer." },
        }),
        saved: false,
        phaseSaved: true,
        attemptCompleted: false,
      });
    type("A long but correct sentence.");
    fireEvent.click(screen.getByText("Submit for marking"));
    await waitFor(() => expect(screen.getByText("What to fix")).toBeTruthy());
    expect(screen.getByText("Cut your sentence to 25 words or fewer.")).toBeTruthy();
    expect(screen.getByText("Submit retry")).toBeTruthy();
  });
});

describe("state 4: marking retry", () => {
  it("shows the collapsed first try, the asked-terms pills and the retry status list (FR-018 to FR-021)", async () => {
    const d = deferred<Response>();
    mount();
    responder = () =>
      json({ result: rewriteResult({ marksAwarded: 1, feedback: "Name the tax.", hint: HINT }), saved: false, phaseSaved: true, attemptCompleted: false });
    type("The government taxed imports so people bought local stuff.");
    fireEvent.click(screen.getByText("Submit for marking"));
    await waitFor(() => expect(screen.getByText("Use these terms in your retry")).toBeTruthy());

    responder = () => d.promise;
    type("A tariff raised import prices, so people bought local goods.", 0);
    fireEvent.click(screen.getByText("Submit retry"));
    expect(screen.getByText("Terms you were asked to use:")).toBeTruthy();
    expect(screen.getByText("tariff")).toBeTruthy();
    expect(screen.getByText("Your retry")).toBeTruthy();
    expect(screen.getAllByText("Read your retry").length).toBeGreaterThan(0);
    expect(screen.getByText("Checking tariff…")).toBeTruthy();
    expect(screen.getByText("Preparing the model sentence")).toBeTruthy();
    expect(screen.getByText("Retry is worth up to 2 marks.")).toBeTruthy();
    d.resolve(
      json({ result: rewriteResult({ phase: 2, marksAwarded: 2, feedback: "Better.", discussion: DISCUSSION }), saved: true, attemptCompleted: false }),
    );
    await waitFor(() => expect(screen.getByText("Next question")).toBeTruthy());
  });
});

describe("state 5: result", () => {
  it("a 3/3 first try goes straight to the result with the first-try outcome line (FR-014, FR-022, FR-024)", async () => {
    mount();
    responder = () =>
      json({ result: rewriteResult({ marksAwarded: 3, discussion: DISCUSSION }), saved: true, attemptCompleted: false });
    type("A tariff raises import prices, so consumers buy from domestic producers.");
    fireEvent.click(screen.getByText("Submit for marking"));
    await waitFor(() => expect(screen.getByText("Full marks on your first try.")).toBeTruthy());
    expect(gradeCalls()).toHaveLength(1);
    expect(gradeCalls()[0].body).toMatchObject({
      attemptId: ATTEMPT,
      attemptToken: "TOKEN-1",
      questionId: REWRITE.id,
      answer: "A tariff raises import prices, so consumers buy from domestic producers.",
      phase: 1,
    });
    // YOUR SENTENCE (phase 1 was final), the model card, the term table, no hint, no retry
    expect(screen.getByText("YOUR SENTENCE")).toBeTruthy();
    expect(screen.getByText("Model sentence")).toBeTruthy();
    expect(screen.getByText("The two terms")).toBeTruthy();
    expect(screen.queryByText("Use these terms in your retry")).toBeNull();
    expect(screen.queryByText("Submit retry")).toBeNull();
    // the tracker shows Write · 3/3 then Compare (two steps)
    expect(screen.getByText("Write · 3/3")).toBeTruthy();
    expect(screen.queryByText("Retry with hints")).toBeNull();
    await waitFor(() => expect(screen.getByText("Next question")).toBeTruthy());
  });

  it("shows the capped-retry outcome line with the term-count wording (FR-024)", async () => {
    mount();
    responder = () =>
      json({ result: rewriteResult({ marksAwarded: 1, feedback: "Name the tax.", hint: HINT }), saved: false, phaseSaved: true, attemptCompleted: false });
    type("The government taxed imports so people bought local stuff.");
    fireEvent.click(screen.getByText("Submit for marking"));
    await waitFor(() => expect(screen.getByText("Use these terms in your retry")).toBeTruthy());
    responder = () =>
      json({ result: rewriteResult({ phase: 2, marksAwarded: 2, feedback: "Better.", discussion: DISCUSSION }), saved: true, attemptCompleted: false });
    type("A tariff raised import prices, so people bought local goods.", 0);
    fireEvent.click(screen.getByText("Submit retry"));
    await waitFor(() => expect(screen.getByText("Full marks for a retry — both terms used.")).toBeTruthy());
    expect(screen.getByText("A retry can earn at most 2. Use every term on the first try next time for the full 3.")).toBeTruthy();
    expect(screen.getByText("YOUR RETRY")).toBeTruthy();
  });

  it("shows the retry feedback with the cap line when the retry is below 2 (FR-024)", async () => {
    mount();
    responder = () =>
      json({ result: rewriteResult({ marksAwarded: 1, feedback: "Name the tax.", hint: HINT }), saved: false, phaseSaved: true, attemptCompleted: false });
    type("The government taxed imports so people bought local stuff.");
    fireEvent.click(screen.getByText("Submit for marking"));
    await waitFor(() => expect(screen.getByText("Use these terms in your retry")).toBeTruthy());
    responder = () =>
      json({ result: rewriteResult({ phase: 2, marksAwarded: 1, feedback: "Worse.", discussion: DISCUSSION }), saved: true, attemptCompleted: false });
    type("A tariff raised import prices.", 0);
    fireEvent.click(screen.getByText("Submit retry"));
    await waitFor(() => expect(screen.getByText("Worse.")).toBeTruthy());
    expect(screen.getByText("A retry can earn at most 2.")).toBeTruthy();
  });

  it("shows the better-try line with the real phase 1 mark when phase 1 beats phase 2 (FR-024, FR-019)", async () => {
    mount();
    responder = () =>
      json({ result: rewriteResult({ marksAwarded: 2, feedback: "Name the tax.", hint: HINT }), saved: false, phaseSaved: true, attemptCompleted: false });
    type("The government taxed imports so people bought local stuff.");
    fireEvent.click(screen.getByText("Submit for marking"));
    await waitFor(() => expect(screen.getByText("Use these terms in your retry")).toBeTruthy());
    responder = () =>
      json({ result: rewriteResult({ phase: 2, marksAwarded: 1, feedback: "Worse.", discussion: DISCUSSION }), saved: true, attemptCompleted: false });
    type("A tariff raised import prices.", 0);
    fireEvent.click(screen.getByText("Submit retry"));
    await waitFor(() => expect(screen.getByText("Your recorded mark is 2 / 3 (your better try).")).toBeTruthy());
  });

  it("derives term statuses from the phase outcomes, keeping First try for a term dropped in phase 2 (FR-028, FR-049)", async () => {
    mount();
    responder = () =>
      json({
        result: rewriteResult({
          marksAwarded: 1,
          feedback: "Name the tax.",
          hint: HINT,
          termOutcomes: [
            { conceptId: "c-tariff", correct: false },
            { conceptId: "c-domestic", correct: true },
          ],
        }),
        saved: false,
        phaseSaved: true,
        attemptCompleted: false,
      });
    type("The government taxed imports so people bought local stuff.");
    fireEvent.click(screen.getByText("Submit for marking"));
    await waitFor(() => expect(screen.getByText("Use these terms in your retry")).toBeTruthy());
    responder = () =>
      json({
        result: rewriteResult({
          phase: 2,
          marksAwarded: 2,
          feedback: "Better.",
          discussion: DISCUSSION,
          phase2TermOutcomes: [
            { conceptId: "c-tariff", correct: true },
            { conceptId: "c-domestic", correct: false },
          ],
        }),
        saved: true,
        attemptCompleted: false,
      });
    type("A tariff raised import prices, so people bought local goods.", 0);
    fireEvent.click(screen.getByText("Submit retry"));
    await waitFor(() => expect(screen.getByText("The two terms")).toBeTruthy());
    // tariff: wrong in phase 1, correct in phase 2 → Added in retry
    // domestic producers: correct in phase 1, dropped in phase 2 → First try (matches concept tracking)
    expect(screen.getByText("Added in retry")).toBeTruthy();
    expect(screen.getAllByText("First try").length).toBeGreaterThan(0);
    expect(screen.queryByText("Not used")).toBeNull();
  });

  it("does not highlight a span not found in the sentence (FR-032, FR-049)", async () => {
    mount();
    responder = () =>
      json({
        result: rewriteResult({
          marksAwarded: 3,
          discussion: DISCUSSION,
          creditedSpans: [
            { conceptId: "c-tariff", span: "tariff" },
            { conceptId: "c-domestic", span: "zzz not in the sentence" },
          ],
        }),
        saved: true,
        attemptCompleted: false,
      });
    type("A tariff raises import prices, so consumers buy from domestic producers.");
    fireEvent.click(screen.getByText("Submit for marking"));
    await waitFor(() => expect(screen.getByText("Full marks on your first try.")).toBeTruthy());
    // the found span is highlighted; the missing span's text never appears
    expect(screen.getAllByText("tariff", { selector: "mark" }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/zzz not in the sentence/)).toBeNull();
  });
});

describe("self-mark screen (degrade path)", () => {
  it("shows the new layout with the locked sentence, the model card, the term table without pills and Save my mark (FR-051, FR-037)", async () => {
    mount();
    responder = () =>
      json({
        result: rewriteResult({ marksAwarded: null, needsSelfMark: true, discussion: DISCUSSION }),
        saved: false,
        attemptCompleted: false,
        selfMarkToken: "SM-1",
      });
    type("The government taxed imports so people bought local stuff.");
    fireEvent.click(screen.getByText("Submit for marking"));
    await waitFor(() => expect(screen.getByText("Save my mark")).toBeTruthy());
    expect(screen.getByText("Your sentence")).toBeTruthy();
    expect(screen.getByText("Model sentence")).toBeTruthy();
    expect(screen.getByText("The two terms")).toBeTruthy();
    // no status pills on the self-mark screen
    expect(screen.queryByText("First try")).toBeNull();
    expect(screen.queryByText("Added in retry")).toBeNull();
    expect(screen.queryByText("Not used")).toBeNull();
    // the tracker shows Write then Mark it yourself
    expect(screen.getByText("Mark it yourself")).toBeTruthy();
  });
});

describe("resume", () => {
  it("resumes at feedback + retry with the hint and the retry box pre-filled from the saved draft (FR-038, FR-053)", async () => {
    mount(
      payload({
        rewriteState: {
          [REWRITE.id]: {
            phase: "phase1",
            phase1Answer: "The government taxed imports.",
            phase1Marks: 1,
            phase1Feedback: "Name the tax.",
            marks: 1,
            hint: HINT,
            phase1CreditedSpans: [{ conceptId: "c-tariff", span: "taxed imports" }],
            phase2Draft: "A tariff raised import prices.",
          },
        },
      }),
    );
    expect(screen.getByText("Use these terms in your retry")).toBeTruthy();
    expect(screen.getByText("tariff")).toBeTruthy();
    await waitFor(() => expect(textbox(0).value).toBe("A tariff raised import prices."));
    expect(screen.queryByText("Next question")).toBeNull();
  });

  it("a draft-only entry (no phase row yet) opens the writing state with the box holding the draft (FR-038, FR-053)", async () => {
    mount(
      payload({
        rewriteState: {
          [REWRITE.id]: {
            phase: "draft",
            phase1Draft: "half-typed sentence",
          },
        },
      }),
    );
    // the writing state: the box holds the restored draft, submit is enabled, no grade shown
    await waitFor(() => expect(textbox(0).value).toBe("half-typed sentence"));
    expect((screen.getByText("Submit for marking") as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByText("Use these terms in your retry")).toBeNull();
    expect(screen.queryByText("Next question")).toBeNull();
  });

  it("resumes a final question with the full display data restored (FR-054, FR-055)", async () => {
    mount(
      payload({
        rewriteState: {
          [REWRITE.id]: {
            phase: "final",
            phase1Answer: "The government taxed imports.",
            phase1Marks: 1,
            phase1Feedback: "Name the tax.",
            phase1TermOutcomes: [
              { conceptId: "c-tariff", correct: false },
              { conceptId: "c-domestic", correct: true },
            ],
            phase2Answer: "A tariff raised import prices.",
            phase2Marks: 2,
            phase2Feedback: "Better.",
            marks: 2,
            discussion: DISCUSSION,
            phase1CreditedSpans: [{ conceptId: "c-tariff", span: "taxed imports" }],
            phase2CreditedSpans: [{ conceptId: "c-tariff", span: "tariff" }],
            phase2TermOutcomes: [
              { conceptId: "c-tariff", correct: true },
              { conceptId: "c-domestic", correct: false },
            ],
            languageNote: { spelling: [{ wrong: "fromm", fix: "from" }] },
          },
        },
      }),
    );
    await waitFor(() => expect(screen.getByText("Full marks for a retry — both terms used.")).toBeTruthy());
    expect(screen.getByText("YOUR RETRY")).toBeTruthy();
    expect(screen.getByText("The two terms")).toBeTruthy();
    expect(screen.getByText("Added in retry")).toBeTruthy();
    expect(screen.getAllByText("First try").length).toBeGreaterThan(0);
    expect(screen.getByText(/Spelling: fromm → from/)).toBeTruthy();
    await waitFor(() => expect(screen.getByText("Next question")).toBeTruthy());
  });

  it("has no Skip button at the retry, and Next question stays hidden until phase 2 is submitted (FR-042)", async () => {
    mount(
      payload({
        rewriteState: {
          [REWRITE.id]: {
            phase: "phase1",
            phase1Answer: "The government taxed imports.",
            phase1Marks: 1,
            phase1Feedback: "Name the tax.",
            marks: 1,
            hint: HINT,
          },
        },
      }),
    );
    expect(screen.queryByText(/Skip retry/)).toBeNull();
    expect(screen.queryByText("Next question")).toBeNull();

    responder = () =>
      json({ result: rewriteResult({ phase: 2, marksAwarded: 2, feedback: "Better.", discussion: DISCUSSION }), saved: true, attemptCompleted: false });
    type("A tariff raised import prices, so people bought local goods.", 0);
    fireEvent.click(screen.getByText("Submit retry"));
    await waitFor(() => expect(screen.getByText("Next question")).toBeTruthy());
    expect(gradeCalls()).toHaveLength(1);
    expect(gradeCalls()[0].body).toMatchObject({ questionId: REWRITE.id, phase: 2 });
  });
});

describe("accessibility", () => {
  it("announces the marking progress through the live region and focuses the result summary (FR-009, FR-025, FR-040)", async () => {
    const d = deferred<Response>();
    responder = () => d.promise;
    mount();
    type("A tariff raises import prices, so consumers buy from domestic producers.");
    fireEvent.click(screen.getByText("Submit for marking"));
    await waitFor(() => expect(screen.getByText("Your sentence")).toBeTruthy());
    // the status list is a polite live region
    expect(screen.getByRole("status")).toBeTruthy();
    d.resolve(
      json({ result: rewriteResult({ marksAwarded: 3, discussion: DISCUSSION }), saved: true, attemptCompleted: false }),
    );
    await waitFor(() => expect(screen.getByText("Full marks on your first try.")).toBeTruthy());
    // the result summary receives focus
    expect(document.activeElement?.textContent).toContain("Full marks on your first try.");
  });

  it("renders static progress under reduced motion (FR-041)", async () => {
    const d = deferred<Response>();
    responder = () => d.promise;
    // stub matchMedia to report reduced motion
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn(),
      })),
    );
    mount();
    type("A tariff raises import prices, so consumers buy from domestic producers.");
    fireEvent.click(screen.getByText("Submit for marking"));
    await waitFor(() => expect(screen.getByText("Your sentence")).toBeTruthy());
    // the static progress bar is rendered instead of the animated fill
    expect(document.querySelector(".rw-progress-static")).toBeTruthy();
    expect(document.querySelector(".rw-progress-fill")).toBeNull();
    d.resolve(
      json({ result: rewriteResult({ marksAwarded: 3, discussion: DISCUSSION }), saved: true, attemptCompleted: false }),
    );
    await waitFor(() => expect(screen.getByText("Full marks on your first try.")).toBeTruthy());
  });
});
