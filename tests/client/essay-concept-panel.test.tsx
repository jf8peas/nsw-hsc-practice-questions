// @vitest-environment jsdom
//
// "Things I need to know" for the essay unit (spec 010 FR-038 to FR-040): the panel lists an uncleared concept with its
// one-line "what was missing" under it, says an idea clears after 2 later essays and that a redo does not clear it,
// and a unit with no details renders exactly as before.

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConceptPanel } from "@/components/ConceptPanel";
import type { Unit } from "@/lib/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));
afterEach(cleanup);

const WTO = "y12-economics-essay-writing.c-china-wto";
const unit = {
  id: "y12-economics-essay-writing",
  flow: "essay",
  conceptsReady: true,
  questions: [],
  concepts: [{ id: WTO, term: "China", description: "WTO accession (2001) and export-led growth", clearAfter: 2 }],
} as unknown as Unit;
const progress = { status: "ok", data: [{ conceptId: WTO, count: 2, lastMissedAt: new Date() }] } as never;

describe("the concept panel for the essay unit", () => {
  it("lists the concept with the sentence about what was missing", () => {
    render(<ConceptPanel unit={unit} progress={progress} details={{ [WTO]: "WTO named but no effect on exports shown" }} />);
    expect(screen.getByText(/WTO accession \(2001\)/)).toBeTruthy();
    expect(screen.getByText("WTO named but no effect on exports shown")).toBeTruthy();
    expect(screen.getByText("Things I need to know")).toBeTruthy();
  });

  it("explains that 2 later essays clear an idea and a redo does not", () => {
    render(<ConceptPanel unit={unit} progress={progress} details={{}} />);
    expect(screen.getByText(/clears after 2 later essays use it correctly; redoing the same essay does not clear it/)).toBeTruthy();
  });

  it("shows no detail line when there is none, and an all-clear message when nothing is uncleared", () => {
    const { container } = render(<ConceptPanel unit={unit} progress={progress} />);
    expect(container.querySelector(".concept-detail")).toBeNull();
    cleanup();
    render(<ConceptPanel unit={unit} progress={{ status: "ok", data: [] } as never} />);
    expect(screen.getByText(/Ideas a marked essay misses will show up here/)).toBeTruthy();
  });
});
