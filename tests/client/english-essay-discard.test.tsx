// @vitest-environment jsdom
//
// Discarding an open English essay attempt (spec 011 FR-002a): the button only on the open, unmarked card, a confirmation that
// names the plan and draft deletion, cancel changing nothing, the English discard route with the signed token,a refresh on
// success so other essays become startable (the shared Dialog owns focus trapping and restoring, which jsdom cannot show), and refusals (marking in progress, already finished) leaving the attempt intact.

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UnitEssays } from "@/components/english-essay/UnitEssays";
import type { EnglishEssayListItem } from "@/lib/english-essay/progress.server";

const refresh = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push }) }));

const UNIT = "y12-english-essay-writing";
const item = (n: number, over: Partial<EnglishEssayListItem> = {}): EnglishEssayListItem => ({
  question: {
    type: "englishEssay",
    group: "englishEssay",
    maxMarks: 20,
    live: true,
    id: `${UNIT}.e${n}`,
    prompt: `Question ${n}: discuss it.`,
    directive: "discuss",
    directiveDefinition: "d",
    directiveGuidance: "nesa",
    offer: n,
    source: `Source ${n}`,
    conceptIds: [],
  },
  latest: null,
  open: false,
  nextUp: false,
  ...over,
});
const card = (n: number) => screen.getByText(`Question ${n}: discuss it.`).closest("li") as HTMLElement;

beforeEach(() => {
  refresh.mockClear();
  push.mockClear();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ discarded: true }), { status: 200 })));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const openData = {
  openAttempt: { essayId: `${UNIT}.e2`, attemptId: "att", stage: "write" as const, attemptToken: "tok" },
  essays: [item(1), item(2, { open: true }), item(3, { latest: { mark: 12, band: 3, attemptId: "old", at: "2026-11-23T00:00:00Z" } })],
};

describe("the Discard button", () => {
  it("appears only on the open unmarked card", () => {
    render(<UnitEssays unitId={UNIT} data={openData} />);
    expect(within(card(2)).getByRole("button", { name: "Discard this attempt" })).toBeTruthy();
    expect(within(card(1)).queryByRole("button", { name: "Discard this attempt" })).toBeNull();
    expect(within(card(3)).queryByRole("button", { name: "Discard this attempt" })).toBeNull();
    // the other cards' Start/Redo are off while one attempt is open
    expect((within(card(1)).getByRole("button", { name: "Start" }) as HTMLButtonElement).disabled).toBe(true);
    expect((within(card(3)).getByRole("button", { name: "Redo" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("asks first, names the plan and draft, and does nothing if cancelled", async () => {
    render(<UnitEssays unitId={UNIT} data={openData} />);
    fireEvent.click(screen.getByRole("button", { name: "Discard this attempt" }));
    expect(await screen.findByText(/deletes your plan and anything you have written/)).toBeTruthy();
    expect(screen.getByText(/already had marked are not affected/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Keep it" }));
    expect(fetch).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("confirming", () => {
  it("sends the English discard route with the signed token, then refreshes so another essay can start", async () => {
    render(<UnitEssays unitId={UNIT} data={openData} />);
    fireEvent.click(screen.getByRole("button", { name: "Discard this attempt" }));
    fireEvent.click(await screen.findByRole("button", { name: "Discard" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(call[0]).toBe("/api/english-essay/discard");
    expect(JSON.parse(call[1].body)).toEqual({ attemptId: "att", attemptToken: "tok", questionId: `${UNIT}.e2` });
  });

  it.each([
    ["marking_in_progress", /being marked right now/],
    ["already_finished", /already been marked/],
  ])("%s leaves the attempt intact and says why", async (error, text) => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error }), { status: 409 })));
    render(<UnitEssays unitId={UNIT} data={openData} />);
    fireEvent.click(screen.getByRole("button", { name: "Discard this attempt" }));
    fireEvent.click(await screen.findByRole("button", { name: "Discard" }));
    expect(await screen.findByText(text)).toBeTruthy();
    expect(refresh).not.toHaveBeenCalled();
  });
});
