// @vitest-environment jsdom
//
// The English essay panel's marking states (spec 011 FR-014 to FR-018): the essay stays visible and read-only with a polite
// status while marking, every failure returns an editable box holding the same text and never invents a mark, the daily
// limit and the missing reference text are plain notices, boundary errors restore the counter and network errors keep the
// essay. Components only; the route is tested in tests/api/grade-english-essay.test.ts.

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EssayPanel } from "@/components/english-essay/EssayPanel";
import { emptyEnglishEssayScaffold } from "@/lib/english-essay/scaffold";
import type { EnglishEssayResultView, EnglishEssayState } from "@/lib/english-essay/types";

const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");
const ESSAY = words(900);

const state = (over: Partial<EnglishEssayState> = {}): EnglishEssayState => {
  const scaffold = emptyEnglishEssayScaffold();
  scaffold.thesis = "Locked thesis";
  return {
    stage: "write",
    essay: {
      type: "englishEssay",
      group: "englishEssay",
      maxMarks: 20,
      live: true,
      id: "y12-english-essay-writing.e3",
      prompt: "Discuss how the composer makes connections.",
      directive: "discuss",
      directiveDefinition: "identify issues and provide points for and/or against.",
      directiveGuidance: "nesa",
      offer: 3,
      source: "Abbotsleigh 2025 Trial, Q6",
      conceptIds: [],
    },
    scaffold,
    locked: true,
    draft: ESSAY,
    ...over,
  };
};

const RESULT = { finalMark: 14, finalBand: 2 } as unknown as EnglishEssayResultView;
const fullResult = (): EnglishEssayResultView => ({
  questionId: "q",
  essay: state().essay,
  finalMark: 14,
  finalBand: 2,
  capped: false,
  knowledgeCapApplied: false,
  focusCap: null,
  criteria: { argument: { verdict: "sound", reason: "r" }, analysis: { verdict: "sound", reason: "r" }, knowledge: { verdict: "sound", reason: "r" }, expression: { verdict: "sound", reason: "r" } },
  bandReason: "Reason.",
  lift: ["a", "b"],
  questionFocus: "fully",
  questionFocusReason: "ok",
  knowledgeErrors: [],
  quoteFlags: [],
  gaps: [],
  essayText: ESSAY,
  plan: emptyEnglishEssayScaffold(),
  words: 900,
});
void RESULT;

beforeEach(() => {
  window.sessionStorage.clear();
  Object.defineProperty(navigator, "sendBeacon", { value: vi.fn(() => true), configurable: true });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const reply = (body: unknown, status = 200) => vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status })));
const box = () => screen.getByLabelText("Your essay") as HTMLTextAreaElement;
const submit = () => screen.getByRole("button", { name: /Submit essay/ }) as HTMLButtonElement;
const panel = (s = state()) => render(<EssayPanel attemptId="a1" attemptToken="t" state={s} onFinish={() => {}} />);

describe("marking", () => {
  it("keeps the essay visible and read-only with a polite status while the one request runs, then shows the result", async () => {
    let release!: (r: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((res) => (release = res))));
    panel();
    fireEvent.click(submit());
    await waitFor(() => expect(box().readOnly).toBe(true));
    expect(box().value).toBe(ESSAY);
    expect(box().getAttribute("aria-busy")).toBe("true");
    expect(document.querySelector('.rw-status[role="status"][aria-live="polite"]')).not.toBeNull();
    release(new Response(JSON.stringify({ result: fullResult(), saved: true }), { status: 200 }));
    await screen.findByText("To lift your mark");
    expect(screen.getByText("14")).toBeTruthy();
  });

  it("posts the essay with the ids and no mark, band, model or word count", async () => {
    reply({ result: fullResult(), saved: true });
    panel();
    fireEvent.click(submit());
    await screen.findByText("To lift your mark");
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(url).toBe("/api/grade");
    expect(JSON.parse(init.body)).toEqual({ attemptId: "a1", attemptToken: "t", questionId: "y12-english-essay-writing.e3", answer: ESSAY });
  });
});

describe("when marking cannot happen", () => {
  it("marker unavailable: the editable box returns with the same text, a notice and no mark", async () => {
    reply({ notMarked: { reason: "marker_unavailable" }, saved: false });
    panel();
    fireEvent.click(submit());
    await screen.findByText(/couldn’t mark your essay just now/);
    expect(box().readOnly).toBe(false);
    expect(box().value).toBe(ESSAY);
    expect(screen.queryByText("To lift your mark")).toBeNull();
  });

  it("daily limit: says to come back tomorrow, keeps the text and disables Submit, and stays disabled after a reload", async () => {
    reply({ notMarked: { reason: "daily_limit", resetsAt: "2026-11-24T00:00:00+11:00" }, saved: false });
    const { unmount } = panel();
    fireEvent.click(submit());
    await screen.findByText(/Come back tomorrow/);
    expect(box().value).toBe(ESSAY);
    expect(submit().disabled).toBe(true);
    unmount();
    panel(state({ cap: { resetsAt: "2026-11-24T00:00:00+11:00" } }));
    expect(submit().disabled).toBe(true);
    expect(screen.getByText(/Come back tomorrow/)).toBeTruthy();
  });

  it("missing reference text: explains quotations could not be checked and keeps the essay", async () => {
    reply({ notMarked: { reason: "reference_text_unavailable" }, saved: false });
    panel();
    fireEvent.click(submit());
    await screen.findByText(/couldn’t check your quotations against the play/);
    expect(box().value).toBe(ESSAY);
    expect(box().readOnly).toBe(false);
    expect(submit().disabled).toBe(false);
  });

  it("a boundary error restores the counter state with the essay", async () => {
    reply({ error: "essay_too_short", words: 799, min: 800, max: 1200 }, 400);
    panel();
    fireEvent.click(submit());
    await screen.findByText("Your essay needs to be 800 to 1,200 words.");
    expect(box().value).toBe(ESSAY);
    expect(box().readOnly).toBe(false);
  });

  it("a network error keeps the essay and says to check the connection", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
    panel();
    fireEvent.click(submit());
    await screen.findByText(/Could not reach the server/);
    expect(box().value).toBe(ESSAY);
    expect(box().readOnly).toBe(false);
  });

  it("shows the stored result when a double submit returns already_answered", async () => {
    reply({ error: "already_answered", result: fullResult() }, 409);
    panel();
    fireEvent.click(submit());
    await screen.findByText("To lift your mark");
  });
});

describe("stages", () => {
  it("opens at the result for a finished attempt and goes back through onFinish", () => {
    const onFinish = vi.fn();
    render(<EssayPanel attemptId="a1" attemptToken="t" state={state({ stage: "result", result: fullResult() })} onFinish={onFinish} />);
    fireEvent.click(screen.getByRole("button", { name: "Back to essays" }));
    expect(onFinish).toHaveBeenCalled();
  });

  it("shows the locked plan above the essay box and no timer in S1", () => {
    panel();
    expect(screen.getByText("Your plan")).toBeTruthy();
    expect(screen.getByText("Locked thesis")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /start timer|timer/i })).toBeNull();
  });
});
