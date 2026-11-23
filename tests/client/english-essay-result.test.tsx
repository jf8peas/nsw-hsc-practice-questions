// @vitest-environment jsdom
//
// The English essay result (spec 011 FR-024 to FR-031): the focused summary, four word-and-shape verdicts with reasons, two
// lift points, the question-focus warning only for partly or barely, every knowledge error and flagged quotation (a near
// match with its exact correction and no penalty note; a not-found flag with the attribution hint), the adjustments in plain
// words, the essay beside the locked plan, the collapsed model and at most five gaps. Nothing from the marker's own band or
// the raw mark ever appears, and nothing relies on colour alone.

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { EnglishEssayResult } from "@/components/english-essay/Result";
import { emptyEnglishEssayScaffold } from "@/lib/english-essay/scaffold";
import type { EnglishEssayResultView } from "@/lib/english-essay/types";

afterEach(cleanup);

function result(over: Partial<EnglishEssayResultView> = {}): EnglishEssayResultView {
  const plan = emptyEnglishEssayScaffold();
  plan.thesis = "A plan thesis";
  plan.body[0] = { claim: "A plan claim", evidence: "Plan evidence notes" };
  const reason = (r: string) => ({ reason: r });
  return {
    questionId: "y12-english-essay-writing.e1",
    essay: {
      type: "englishEssay",
      group: "englishEssay",
      maxMarks: 20,
      live: true,
      id: "y12-english-essay-writing.e1",
      prompt: "To what extent do you agree with this statement?",
      directive: "to what extent",
      directiveDefinition: "Make a judgement about how far the statement holds.",
      directiveGuidance: "unit",
      offer: 1,
      source: "Knox 2025 Trial, Q6",
      conceptIds: [],
    },
    finalMark: 14,
    finalBand: 2,
    capped: false,
    knowledgeCapApplied: false,
    focusCap: null,
    criteria: {
      argument: { verdict: "strong", ...reason("Argument reason text.") },
      analysis: { verdict: "sound", ...reason("Analysis reason text.") },
      knowledge: { verdict: "developing", ...reason("Knowledge reason text.") },
      expression: { verdict: "weak", ...reason("Expression reason text.") },
    },
    bandReason: "Band reason sentence.",
    lift: ["First lift point.", "Second lift point."],
    questionFocus: "fully",
    questionFocusReason: "Engages the question's own terms.",
    knowledgeErrors: [],
    quoteFlags: [],
    gaps: [],
    essayText: "THE STUDENT ESSAY TEXT",
    plan,
    words: 905,
    ...over,
  };
}

describe("the summary", () => {
  it("shows the final mark out of 20 and the final band with its range, and never the raw mark or marker band", () => {
    render(<EnglishEssayResult result={result()} />);
    expect(screen.getByText("14")).toBeTruthy();
    expect(screen.getByText(/Band 2 \(13–16\)/)).toBeTruthy();
    expect(screen.getByText("Band reason sentence.")).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/raw mark|marker band|selected band/i);
  });

  it("explains a knowledge-error deduction and the 16 cap, and a focus cap, in plain words", () => {
    render(
      <EnglishEssayResult
        result={result({
          finalMark: 12,
          finalBand: 3,
          capped: true,
          knowledgeCapApplied: true,
          focusCap: 12,
          questionFocus: "partly",
          knowledgeErrors: [
            { quote: "wrong one", why: "Mistake one." },
            { quote: "wrong two", why: "Mistake two." },
          ],
        })}
      />,
    );
    expect(screen.getByText(/2 mistakes about the text lowered your mark/)).toBeTruthy();
    expect(screen.getByText(/cannot go above 16/)).toBeTruthy();
    expect(screen.getByText(/answered the question only partly, so the mark is held to 12 or below/)).toBeTruthy();
  });
});

describe("criteria and lift", () => {
  it("shows four criteria each with a verdict word, a shape and its reason", () => {
    const { container } = render(<EnglishEssayResult result={result()} />);
    for (const word of ["Strong", "Sound", "Developing", "Weak"]) expect(screen.getByText(word, { exact: false })).toBeTruthy();
    expect(container.querySelectorAll(".es-criteria > li")).toHaveLength(4);
    expect(container.querySelectorAll(".es-bars")).toHaveLength(4);
    for (const r of ["Argument reason text.", "Analysis reason text.", "Knowledge reason text.", "Expression reason text."]) expect(screen.getByText(r)).toBeTruthy();
  });

  it("lists the two lift points", () => {
    render(<EnglishEssayResult result={result()} />);
    expect(screen.getByText("First lift point.")).toBeTruthy();
    expect(screen.getByText("Second lift point.")).toBeTruthy();
  });
});

describe("question focus", () => {
  it("shows no warning when fully on the question", () => {
    render(<EnglishEssayResult result={result()} />);
    expect(screen.queryByText("Answering the question")).toBeNull();
  });

  it.each([
    ["partly", "Partly on the question."],
    ["barely", "Barely on the question."],
  ] as const)("shows the warning with its reason for %s", (focus, label) => {
    render(<EnglishEssayResult result={result({ questionFocus: focus, questionFocusReason: "It never uses the word desire.", focusCap: focus === "partly" ? 12 : 10 })} />);
    expect(screen.getByText("Answering the question")).toBeTruthy();
    expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText(/never uses the word desire/)).toBeTruthy();
  });
});

describe("knowledge errors and quotations", () => {
  it("lists every knowledge error with the student's words", () => {
    render(<EnglishEssayResult result={result({ knowledgeErrors: [{ quote: "he was twelve", why: "Tom is seventeen." }] })} />);
    const section = screen.getByRole("heading", { name: "Mistakes about the text" }).closest("section")!;
    expect(within(section).getByText("he was twelve")).toBeTruthy();
    expect(within(section).getByText("Tom is seventeen.")).toBeTruthy();
  });

  it("shows a near match with the exact correction and the no-penalty note", () => {
    render(<EnglishEssayResult result={result({ quoteFlags: [{ quote: "the lantern trembles", status: "near", correct: "The lantern trembled", ratio: 0.9 }] })} />);
    const section = screen.getByRole("heading", { name: "Check these quotations" }).closest("section")!;
    expect(within(section).getByText("the lantern trembles")).toBeTruthy();
    expect(within(section).getByText("The lantern trembled")).toBeTruthy();
    expect(section.textContent).toMatch(/Check this quote/);
    expect(section.textContent).toMatch(/did not cost you marks/);
  });

  it("shows a not-found flag with the attribution hint and no play words", () => {
    render(<EnglishEssayResult result={result({ quoteFlags: [{ quote: "the moon repaired every sorrow", status: "not-found", ratio: 0.2 }] })} />);
    const section = screen.getByRole("heading", { name: "Check these quotations" }).closest("section")!;
    expect(section.textContent).toMatch(/not found in the play/);
    expect(section.textContent).toMatch(/If these words come from another source, name it in your sentence\./);
    expect(section.textContent).not.toMatch(/did not cost you marks/);
  });

  it("omits both sections when there is nothing to show", () => {
    render(<EnglishEssayResult result={result()} />);
    expect(screen.queryByText("Check these quotations")).toBeNull();
    expect(screen.queryByText("Mistakes about the text")).toBeNull();
  });
});

describe("the essay, the plan, the model and the gaps", () => {
  it("shows the student's essay with the locked plan beside it", () => {
    const { container } = render(<EnglishEssayResult result={result()} />);
    expect(screen.getByText("THE STUDENT ESSAY TEXT")).toBeTruthy();
    expect(screen.getByText("Your essay (905 words)")).toBeTruthy();
    expect(container.querySelector(".es-sbs-plan")!.textContent).toMatch(/A plan thesis/);
    expect(container.querySelector(".es-sbs-plan")!.textContent).toMatch(/Plan evidence notes/);
  });

  it("collapses the model and shows it only when the result carries it", () => {
    const { container, rerender } = render(<EnglishEssayResult result={result()} />);
    expect(container.querySelector("details.es-collapse")).toBeNull();
    rerender(<EnglishEssayResult result={result({ modelEssay: "THE MODEL ESSAY" })} />);
    const details = container.querySelector("details.es-collapse") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(details.textContent).toContain("THE MODEL ESSAY");
  });

  it("lists up to five gaps with their detail, or says nothing is new", () => {
    const gaps = [1, 2, 3, 4, 5].map((n) => ({ conceptId: `c${n}`, term: `Term ${n}`, detail: `Detail ${n}` }));
    const { rerender } = render(<EnglishEssayResult result={result({ gaps })} />);
    expect(screen.getByText("Term 5")).toBeTruthy();
    expect(screen.getByText(/: Detail 3/)).toBeTruthy();
    rerender(<EnglishEssayResult result={result()} />);
    expect(screen.getByText("Nothing new this time.")).toBeTruthy();
  });

  it("offers Back to essays only when given a handler", () => {
    const { rerender } = render(<EnglishEssayResult result={result()} />);
    expect(screen.queryByRole("button", { name: "Back to essays" })).toBeNull();
    rerender(<EnglishEssayResult result={result()} onBack={() => {}} />);
    expect(screen.getByRole("button", { name: "Back to essays" })).toBeTruthy();
  });
});
