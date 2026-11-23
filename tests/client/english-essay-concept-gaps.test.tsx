// @vitest-environment jsdom
//
// "Things I need to know" for the English essay unit (spec 011 FR-032 to FR-034): the panel lists an uncleared concept with its
// one-sentence detail beneath it when `details` is supplied, omits cleared concepts, says an idea clears after 2 later essays
// and a redo does not clear it, and renders exactly as before without the prop. The result lists the same terms and details.

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { concepts } from "@/content/units/y12-english-essay-writing/concepts";
import { ConceptPanel } from "@/components/ConceptPanel";
import { EnglishEssayResult } from "@/components/english-essay/Result";
import { emptyEnglishEssayScaffold } from "@/lib/english-essay/scaffold";
import type { EnglishEssayResultView } from "@/lib/english-essay/types";
import type { Unit } from "@/lib/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));
afterEach(cleanup);

const THESIS = "y12-english-essay-writing.c-skill-thesis";
const SYMBOLS = "y12-english-essay-writing.c-away-symbols";
const unit = { id: "y12-english-essay-writing", flow: "englishEssay", conceptsReady: true, questions: [], concepts } as unknown as Unit;
const row = (conceptId: string, count: number) => ({ conceptId, count, lastMissedAt: new Date() });
const progress = (...rows: ReturnType<typeof row>[]) => ({ status: "ok", data: rows }) as never;

describe("the concept panel for the English essay unit", () => {
  it("shows the latest detail beneath the matching concept and uses the essay wording", () => {
    render(<ConceptPanel unit={unit} progress={progress(row(THESIS, 2))} details={{ [THESIS]: "Thesis named but not sustained" }} />);
    expect(screen.getByText("Things I need to know")).toBeTruthy();
    expect(screen.getByText(/A clear thesis that takes a position/)).toBeTruthy();
    expect(screen.getByText("Thesis named but not sustained")).toBeTruthy();
    expect(screen.getByText(/clears after 2 later essays use it correctly; redoing the same essay does not clear it/)).toBeTruthy();
  });

  it("omits cleared concepts and details for concepts that are not listed", () => {
    render(<ConceptPanel unit={unit} progress={progress(row(THESIS, 1))} details={{ [THESIS]: "Still to do", [SYMBOLS]: "A cleared one" }} />);
    expect(screen.getByText("Still to do")).toBeTruthy();
    expect(screen.queryByText("A cleared one")).toBeNull();
    expect(screen.queryByText(/objects and symbols/i)).toBeNull();
  });

  it("renders no detail lines without the prop, and an all-clear message when nothing is uncleared", () => {
    const { container } = render(<ConceptPanel unit={unit} progress={progress(row(THESIS, 2))} />);
    expect(container.querySelector(".concept-detail")).toBeNull();
    cleanup();
    render(<ConceptPanel unit={unit} progress={{ status: "ok", data: [] } as never} />);
    expect(screen.getByText(/Ideas a marked essay misses will show up here/)).toBeTruthy();
  });
});

describe("the result's gaps", () => {
  const result = (gaps: EnglishEssayResultView["gaps"]): EnglishEssayResultView => ({
    questionId: "q",
    essay: { type: "englishEssay", group: "englishEssay", maxMarks: 20, live: true, id: "q", prompt: "Discuss it.", directive: "discuss", directiveDefinition: "d", directiveGuidance: "nesa", offer: 1, source: "S", conceptIds: [] },
    finalMark: 12,
    finalBand: 3,
    capped: false,
    knowledgeCapApplied: false,
    focusCap: null,
    criteria: { argument: { verdict: "sound", reason: "r" }, analysis: { verdict: "sound", reason: "r" }, knowledge: { verdict: "sound", reason: "r" }, expression: { verdict: "sound", reason: "r" } },
    bandReason: "b",
    lift: ["a", "b"],
    questionFocus: "fully",
    questionFocusReason: "ok",
    knowledgeErrors: [],
    quoteFlags: [],
    gaps,
    essayText: "e",
    plan: emptyEnglishEssayScaffold(),
    words: 900,
  });

  it("lists the same terms and details the page will show, at most five", () => {
    const gaps = [THESIS, SYMBOLS].map((id, i) => ({ conceptId: id, term: concepts.find((c) => c.id === id)?.term ?? id, detail: `Detail number ${i + 1}` }));
    render(<EnglishEssayResult result={result(gaps)} />);
    expect(screen.getByText("A sustained thesis")).toBeTruthy();
    expect(screen.getByText(/: Detail number 1/)).toBeTruthy();
    expect(screen.getByText("Objects and symbols")).toBeTruthy();
    expect(screen.getByText(/: Detail number 2/)).toBeTruthy();
  });
});
