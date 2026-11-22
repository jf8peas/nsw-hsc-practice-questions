// @vitest-environment jsdom
//
// The plan review on the screens (spec 010 FR-012 to FR-016): both buttons share one disabled rule, a review opens the
// essay page with "Feedback on your plan" (seven lines, a word and a mark for each status), a review that cannot
// happen keeps the student on the plan with "Start writing" still on offer, and "Start writing" shows no review.

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EssayPanel } from "@/components/essay/EssayPanel";
import { ReviewPanel } from "@/components/essay/ReviewPanel";
import { Scaffold } from "@/components/essay/Scaffold";
import { CHECK_ORDER } from "@/lib/essay/review-labels";
import { emptyScaffold, setField, type EssayScaffold } from "@/lib/essay/scaffold";
import type { EssayState, PlanReview, PublicEssay } from "@/lib/essay/types";

const essay: PublicEssay = { id: "u.e1", prompt: "Explain the role of globalisation.", verb: "explain", verbDefinition: "relate cause and effect.", economy: "china", offer: 1 };
const review: PlanReview = {
  checks: CHECK_ORDER.map((id, i) => ({ id, status: i % 2 === 0 ? ("fix" as const) : ("strength" as const), line: i % 2 === 0 ? `Which evidence for ${id}?` : `Good on ${id}.` })),
  figureFlags: [{ quote: "GDP was $90 trillion", why: "This figure looks wrong; check it against a source." }],
};

const filled = (): EssayScaffold => setField(setField(emptyScaffold(), { section: "intro", key: "judgement" }, "China gained"), { section: "body1", key: "point" }, "Trade grew");

beforeEach(() => {
  window.sessionStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ saved: true }), { status: 200 })));
  Object.defineProperty(navigator, "sendBeacon", { value: vi.fn(() => true), configurable: true });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const reviewBtn = () => screen.getByRole("button", { name: /Get feedback on my plan/ }) as HTMLButtonElement;
const startBtn = () => screen.getByRole("button", { name: /Start writing/ }) as HTMLButtonElement;

describe("the two buttons", () => {
  const renderScaffold = (initial: EssayScaffold, onStarted = vi.fn()) => render(<Scaffold attemptId="a" attemptToken="t" essay={essay} initial={initial} onStarted={onStarted} />);

  it("are both disabled without a judgement or a body point, and both enabled with them", () => {
    renderScaffold(emptyScaffold());
    expect(reviewBtn().disabled).toBe(true);
    expect(startBtn().disabled).toBe(true);
    cleanup();
    renderScaffold(filled());
    expect(reviewBtn().disabled).toBe(false);
    expect(startBtn().disabled).toBe(false);
  });

  it("are both disabled over 250 words", () => {
    renderScaffold(setField(filled(), { section: "conclusion", key: "weighs" }, Array.from({ length: 260 }, () => "w").join(" ")));
    expect(reviewBtn().disabled).toBe(true);
    expect(startBtn().disabled).toBe(true);
  });
});

describe("getting feedback", () => {
  it("sends the plan, and on success opens the essay page with the review", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify(url.includes("review") ? { review, stage: "write", locked: true } : { saved: true }), { status: 200 })));
    const onStarted = vi.fn();
    render(<Scaffold attemptId="a" attemptToken="t" essay={essay} initial={filled()} onStarted={onStarted} />);
    fireEvent.click(reviewBtn());
    await waitFor(() => expect(onStarted).toHaveBeenCalledTimes(1));
    expect(onStarted.mock.calls[0]![1]).toEqual(review);
    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find((c) => String(c[0]).includes("/api/essay/review"))!;
    expect(JSON.parse(call[1].body)).toMatchObject({ attemptId: "a", questionId: essay.id });
  });

  it("when the reviewer cannot be reached says so, keeps the plan and keeps Start writing on offer", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify(url.includes("review") ? { notReviewed: { reason: "reviewer_unavailable" } } : { saved: true }), { status: 200 })));
    const onStarted = vi.fn();
    render(<Scaffold attemptId="a" attemptToken="t" essay={essay} initial={filled()} onStarted={onStarted} />);
    fireEvent.click(reviewBtn());
    expect((await screen.findByText(/couldn.t review your plan just now/)).textContent).toMatch(/still start writing/);
    expect(onStarted).not.toHaveBeenCalled();
    expect(startBtn().disabled).toBe(false);
    expect(reviewBtn().disabled).toBe(false);
    expect((screen.getByLabelText(/Judgement/) as HTMLTextAreaElement).value).toBe("China gained");
  });

  it("at the daily limit says so and still offers Start writing", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify(url.includes("review") ? { notReviewed: { reason: "daily_limit", resetsAt: "2026-11-24T00:00:00+11:00" } } : { saved: true }), { status: 200 })));
    render(<Scaffold attemptId="a" attemptToken="t" essay={essay} initial={filled()} onStarted={vi.fn()} />);
    fireEvent.click(reviewBtn());
    expect((await screen.findByText(/feedback limit/)).textContent).toMatch(/still start writing/);
    expect(startBtn().disabled).toBe(false);
  });

  it("treats an already-locked plan as moving on (another tab)", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify(url.includes("review") ? { error: "scaffold_locked" } : { saved: true }), { status: url.includes("review") ? 409 : 200 })));
    const onStarted = vi.fn();
    render(<Scaffold attemptId="a" attemptToken="t" essay={essay} initial={filled()} onStarted={onStarted} />);
    fireEvent.click(reviewBtn());
    await waitFor(() => expect(onStarted).toHaveBeenCalledWith(expect.anything()));
  });
});

describe("the feedback on the essay page", () => {
  const state = (over: Partial<EssayState> = {}): EssayState => ({ stage: "write", essay, scaffold: filled(), locked: true, ...over });

  it("shows seven lines each with a word and a mark, the figure flag, and no mark or band", () => {
    const { container } = render(<ReviewPanel review={review} />);
    expect(container.querySelectorAll("li.es-check")).toHaveLength(7);
    for (const li of container.querySelectorAll("li.es-check")) expect(li.textContent).toMatch(/Strength|Fix/);
    expect(screen.getByText("GDP was $90 trillion")).toBeTruthy();
    expect(container.textContent).not.toMatch(/\bBand\b|\/ 20/);
    expect(container.querySelector("details")!.hasAttribute("open")).toBe(true);
  });

  it("appears on the essay page above the box only when a review was chosen", () => {
    const { container, unmount } = render(<EssayPanel attemptId="a" attemptToken="t" state={state({ review })} onFinish={() => {}} />);
    expect(screen.getByText("Feedback on your plan")).toBeTruthy();
    const html = container.innerHTML;
    expect(html.indexOf("Feedback on your plan")).toBeLessThan(html.indexOf("Your essay"));
    unmount();
    render(<EssayPanel attemptId="a" attemptToken="t" state={state()} onFinish={() => {}} />);
    expect(screen.queryByText("Feedback on your plan")).toBeNull();
  });

  it("shows the review after a successful review on the plan screen, and none after Start writing", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify(url.includes("review") ? { review, stage: "write", locked: true } : { started: true, saved: true }), { status: 200 })));
    render(<EssayPanel attemptId="a" attemptToken="t" state={{ stage: "scaffold", essay, scaffold: filled(), locked: false }} onFinish={() => {}} />);
    fireEvent.click(reviewBtn());
    expect(await screen.findByText("Feedback on your plan")).toBeTruthy();
    cleanup();
    render(<EssayPanel attemptId="a" attemptToken="t" state={{ stage: "scaffold", essay, scaffold: filled(), locked: false }} onFinish={() => {}} />);
    fireEvent.click(startBtn());
    await screen.findByRole("textbox", { name: /Your essay/ });
    expect(screen.queryByText("Feedback on your plan")).toBeNull();
  });
});
