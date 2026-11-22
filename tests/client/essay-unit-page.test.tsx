// @vitest-environment jsdom
//
// The essay unit's list and the discard button (spec 010 FR-001 to FR-005, FR-002a): the essays in the offered order
// with their latest marks, Start / Redo / Resume, other essays off while one is open, a confirm before a discard that
// says what is deleted, and the waiting message when no essay is live.

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UnitEssays } from "@/components/essay/UnitEssays";
import type { EssayListItem } from "@/lib/essay/progress.server";

const refresh = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push }) }));

const item = (n: number, over: Partial<EssayListItem> = {}): EssayListItem => ({
  question: {
    id: `y12-economics-essay-writing.e${n}`,
    prompt: `Question ${n}: evaluate it.`,
    verb: "evaluate",
    verbDefinition: "d",
    economy: n === 3 ? "nepal" : n === 5 ? "both" : "china",
    offer: n,
    ...(n === 1 ? { source: "Barker 2024 Trial, Q27" } : {}),
  },
  latest: null,
  open: false,
  nextUp: false,
  ...over,
});

beforeEach(() => {
  refresh.mockClear();
  push.mockClear();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ attemptId: "att-1", attemptToken: "tok", persisted: true, unitId: "u", passMark: 60, questions: [], answered: {} }), { status: 201 })));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const card = (n: number) => screen.getByText(`Question ${n}: evaluate it.`).closest("li") as HTMLElement;

describe("the list", () => {
  it("shows essays in the order given, with economy, source, latest mark and the right button", () => {
    render(
      <UnitEssays
        unitId="y12-economics-essay-writing"
        data={{
          openAttempt: null,
          essays: [
            item(1, { latest: { mark: 14, band: 2, attemptId: "a1", at: "2026-11-22T00:00:00Z" } }),
            item(3, { nextUp: true }),
            item(5),
          ],
        }}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items.map((li) => within(li).getByText(/Question \d/).textContent)).toEqual(["Question 1: evaluate it.", "Question 3: evaluate it.", "Question 5: evaluate it."]);
    expect(within(card(1)).getByText("Barker 2024 Trial, Q27")).toBeTruthy();
    expect(within(card(1)).getByText(/14 \/ 20/)).toBeTruthy();
    expect(within(card(1)).getByText(/band 2/)).toBeTruthy();
    expect(within(card(1)).getByRole("button", { name: "Redo" })).toBeTruthy();
    expect(within(card(3)).getByRole("button", { name: "Start" })).toBeTruthy();
    expect(within(card(3)).getByText("Next up")).toBeTruthy();
    expect(within(card(5)).getByText("China and Nepal")).toBeTruthy();
  });

  it("starts the picked essay and opens it", async () => {
    render(<UnitEssays unitId="y12-economics-essay-writing" data={{ openAttempt: null, essays: [item(1), item(3)] }} />);
    fireEvent.click(within(card(3)).getByRole("button", { name: "Start" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/unit/y12-economics-essay-writing/quiz?attempt=att-1"));
    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(JSON.parse(call[1].body)).toEqual({ unitId: "y12-economics-essay-writing", questionId: "y12-economics-essay-writing.e3" });
  });

  it("with an attempt open: Resume on that essay, the others off with a reason, and a discard button", () => {
    render(
      <UnitEssays
        unitId="y12-economics-essay-writing"
        data={{
          openAttempt: { essayId: "y12-economics-essay-writing.e3", attemptId: "att", stage: "write", attemptToken: "tok" },
          essays: [item(1), item(3, { open: true }), item(5)],
        }}
      />,
    );
    expect((within(card(3)).getByRole("button", { name: "Resume" }) as HTMLButtonElement).disabled).toBe(false);
    expect((within(card(1)).getByRole("button", { name: "Start" }) as HTMLButtonElement).disabled).toBe(true);
    expect(within(card(1)).getByText("Finish your open essay first.")).toBeTruthy();
    expect(within(card(5)).getByRole("button", { name: "Start" })).toBeTruthy();
    expect(within(card(3)).getByRole("button", { name: "Discard this attempt" })).toBeTruthy();
    expect(within(card(1)).queryByRole("button", { name: "Discard this attempt" })).toBeNull();
    expect(screen.queryByText("Next up")).toBeNull();
  });

  it("says essays are being checked when none is live", () => {
    render(<UnitEssays unitId="u" data={{ openAttempt: null, essays: [] }} />);
    expect(screen.getByText(/Essays are being checked/)).toBeTruthy();
  });

  it("shows the reason and refreshes when the server says another essay is open", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "attempt_open", questionId: "y12-economics-essay-writing.e1" }), { status: 409 })));
    render(<UnitEssays unitId="y12-economics-essay-writing" data={{ openAttempt: null, essays: [item(1), item(3)] }} />);
    fireEvent.click(within(card(3)).getByRole("button", { name: "Start" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/Finish or discard your open essay/);
    expect(refresh).toHaveBeenCalled();
  });
});

describe("discarding", () => {
  const openData = {
    openAttempt: { essayId: "y12-economics-essay-writing.e1", attemptId: "att", stage: "write" as const, attemptToken: "tok" },
    essays: [item(1, { open: true })],
  };

  it("asks first, naming what is deleted and that marked essays are kept, and does nothing if cancelled", async () => {
    render(<UnitEssays unitId="y12-economics-essay-writing" data={openData} />);
    fireEvent.click(screen.getByRole("button", { name: "Discard this attempt" }));
    expect(await screen.findByText(/deletes your plan and anything you have written/)).toBeTruthy();
    expect(screen.getByText(/already had marked are not affected/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Keep it" }));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends the signed token on confirm and refreshes the page", async () => {
    render(<UnitEssays unitId="y12-economics-essay-writing" data={openData} />);
    fireEvent.click(screen.getByRole("button", { name: "Discard this attempt" }));
    fireEvent.click(await screen.findByRole("button", { name: "Discard" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(call[0]).toBe("/api/essay/discard");
    expect(JSON.parse(call[1].body)).toEqual({ attemptId: "att", attemptToken: "tok", questionId: "y12-economics-essay-writing.e1" });
  });

  it("explains when a marking is in flight instead of discarding", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "marking_in_progress" }), { status: 409 })));
    render(<UnitEssays unitId="y12-economics-essay-writing" data={openData} />);
    fireEvent.click(screen.getByRole("button", { name: "Discard this attempt" }));
    fireEvent.click(await screen.findByRole("button", { name: "Discard" }));
    expect((await screen.findByText(/being marked right now/)).textContent).toMatch(/can.t be discarded/);
    expect(refresh).not.toHaveBeenCalled();
  });
});
