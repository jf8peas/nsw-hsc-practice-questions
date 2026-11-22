// @vitest-environment jsdom
//
// The essay unit's screens (spec 010): the plan's buttons and counter, the essay box's counter wording, Submit rules
// and blocked pasting, the marking states (failure and daily limit return the editable box with the text), and the
// result (verdict words, the cap message, the model essay collapsed, focus). Components only; the routes are tested
// in tests/api/essay-flow.test.ts.

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EssayBox } from "@/components/essay/EssayBox";
import { EssayPanel } from "@/components/essay/EssayPanel";
import { EssayResult } from "@/components/essay/Result";
import { Scaffold } from "@/components/essay/Scaffold";
import { emptyScaffold, setField, type EssayScaffold } from "@/lib/essay/scaffold";
import type { EssayResultView, EssayState, PublicEssay } from "@/lib/essay/types";

const essay: PublicEssay = {
  id: "y12-economics-essay-writing.e5",
  prompt: "Evaluate the effectiveness of the strategies used to promote economic growth and development in one emerging and one developing economy you have studied.",
  verb: "evaluate",
  verbDefinition: "make a judgement based on criteria; determine the value of.",
  economy: "both",
  offer: 3,
};

const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ saved: true, words: 1 }), { status: 200 })));
  window.sessionStorage.clear();
  // the draft beacon is not under test here
  Object.defineProperty(navigator, "sendBeacon", { value: vi.fn(() => true), configurable: true });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function filled(extra?: (s: EssayScaffold) => EssayScaffold): EssayScaffold {
  let s = setField(emptyScaffold(), { section: "intro", key: "judgement" }, "China benefited");
  s = setField(s, { section: "body1", key: "point" }, "Trade grew");
  return extra ? extra(s) : s;
}

describe("the plan screen", () => {
  const renderScaffold = (initial: EssayScaffold, onStarted = vi.fn()) =>
    render(<Scaffold attemptId="a1" attemptToken="t" essay={essay} initial={initial} onStarted={onStarted} />);
  const start = () => screen.getByRole("button", { name: /Start writing/ }) as HTMLButtonElement;

  it("shows the question with its verb defined, the economy line and five collapsible sections", () => {
    const { container } = renderScaffold(emptyScaffold());
    expect(screen.getByText(/determine the value of/)).toBeTruthy();
    expect(screen.getByText(/both economies: China \(emerging\) and Nepal \(developing\)/)).toBeTruthy();
    expect(container.querySelectorAll("details.es-section")).toHaveLength(5);
    expect(container.querySelectorAll("textarea")).toHaveLength(20);
    expect(screen.getByText("0 / 250 words")).toBeTruthy();
  });

  it("is disabled with no judgement, with no body point, and over 250 words; enabled otherwise", () => {
    const { unmount } = renderScaffold(emptyScaffold());
    expect(start().disabled).toBe(true);
    unmount();

    renderScaffold(setField(emptyScaffold(), { section: "intro", key: "judgement" }, "A judgement"));
    expect(start().disabled).toBe(true);
    cleanup();

    renderScaffold(setField(emptyScaffold(), { section: "body2", key: "point" }, "A point"));
    expect(start().disabled).toBe(true);
    cleanup();

    renderScaffold(filled());
    expect(start().disabled).toBe(false);
    cleanup();

    renderScaffold(filled((s) => setField(s, { section: "conclusion", key: "weighs" }, words(248))));
    expect(screen.getByText("252 / 250 words, cut 2 words")).toBeTruthy();
    expect(start().disabled).toBe(true);
  });

  it("allows exactly 250 words", () => {
    renderScaffold(setField(filled(), { section: "conclusion", key: "weighs" }, words(246)));
    // 2 + 2 + 246 = 250
    expect(screen.getByText("250 / 250 words")).toBeTruthy();
    expect(start().disabled).toBe(false);
  });

  it("types into a field and updates the counter and section summary", () => {
    renderScaffold(emptyScaffold());
    fireEvent.change(screen.getByLabelText(/Judgement/), { target: { value: "one two three" } });
    expect(screen.getByText("3 / 250 words")).toBeTruthy();
    expect(screen.getByText("1 of 3 filled")).toBeTruthy();
  });

  it("saves to the server after a pause and mirrors to this tab at once", async () => {
    vi.useFakeTimers();
    try {
      renderScaffold(emptyScaffold());
      fireEvent.change(screen.getByLabelText(/Judgement/), { target: { value: "hello world" } });
      expect(window.sessionStorage.getItem("draft:essay-scaffold:a1")).toContain("hello world");
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1600);
      });
      const calls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const body = JSON.parse(calls[0][1].body);
      expect(body).toMatchObject({ action: "save", attemptId: "a1", questionId: essay.id });
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not send an over-long plan to be saved", async () => {
    vi.useFakeTimers();
    try {
      renderScaffold(filled((s) => setField(s, { section: "conclusion", key: "weighs" }, words(300))));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("locks the plan and moves on when Start writing succeeds", async () => {
    const onStarted = vi.fn();
    renderScaffold(filled(), onStarted);
    fireEvent.click(start());
    await waitFor(() => expect(onStarted).toHaveBeenCalledTimes(1));
    const last = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)!;
    expect(JSON.parse(last[1].body).action).toBe("start");
  });

  it("keeps the plan and says so when the server cannot save it", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "temporarily_unavailable" }), { status: 503 })));
    const onStarted = vi.fn();
    renderScaffold(filled(), onStarted);
    fireEvent.click(start());
    expect((await screen.findByRole("alert")).textContent).toMatch(/can.t save your plan/);
    expect(onStarted).not.toHaveBeenCalled();
    expect(start().disabled).toBe(false);
  });

  it("restores the plan from this tab when the server has none yet", () => {
    window.sessionStorage.setItem("draft:essay-scaffold:a1", JSON.stringify(filled()));
    renderScaffold(emptyScaffold());
    expect((screen.getByLabelText(/Judgement/) as HTMLTextAreaElement).value).toBe("China benefited");
  });
});

describe("the essay box", () => {
  const renderBox = (value: string, extra: Partial<Parameters<typeof EssayBox>[0]> = {}) => {
    const onSubmit = vi.fn();
    const onChange = vi.fn();
    render(<EssayBox attemptId="a1" attemptToken="t" questionId="q" value={value} onChange={onChange} onSubmit={onSubmit} locked={false} limitReached={false} {...extra} />);
    return { onSubmit, onChange, box: screen.getByRole("textbox") as HTMLTextAreaElement, submit: () => screen.getByRole("button", { name: "Submit essay" }) as HTMLButtonElement };
  };

  it.each([
    [0, "0 / 600–800 words — 600 more to go", true],
    [599, "599 / 600–800 words — 1 more to go", true],
    [600, "600 / 600–800 words", false],
    [800, "800 / 600–800 words", false],
    [801, "801 / 800 — cut 1 word", true],
  ])("at %i words the counter reads %s", (n, text, disabled) => {
    const { submit } = renderBox(words(n));
    // the visible counter and the polite live region carry the same text
    expect(screen.getAllByText(text).length).toBeGreaterThanOrEqual(1);
    expect(document.getElementById("es-essay-counter")!.textContent).toBe(text);
    expect(submit().disabled).toBe(disabled);
  });

  it("blocks pasting, dropping and the browser's paste and drop input types, and says so", () => {
    const { box } = renderBox("");
    expect(fireEvent.paste(box, { clipboardData: { getData: () => "pasted" } })).toBe(false);
    expect(screen.getByText(/Pasting is switched off, as in the exam. Type your answer./)).toBeTruthy();
    expect(fireEvent.drop(box, { dataTransfer: { getData: () => "dropped" } })).toBe(false);
    for (const inputType of ["insertFromPaste", "insertFromPasteAsQuotation", "insertFromDrop", "insertFromYank"]) {
      const ev = new InputEvent("beforeinput", { inputType, cancelable: true, bubbles: true });
      box.dispatchEvent(ev);
      expect(ev.defaultPrevented, inputType).toBe(true);
    }
  });

  it("lets typing and autocorrect through", () => {
    const { box } = renderBox("");
    for (const inputType of ["insertText", "insertReplacementText", "deleteContentBackward"]) {
      const ev = new InputEvent("beforeinput", { inputType, cancelable: true, bubbles: true });
      box.dispatchEvent(ev);
      expect(ev.defaultPrevented, inputType).toBe(false);
    }
  });

  it("calls onChange as the student types and onSubmit only when enabled", () => {
    const { box, onChange, onSubmit, submit } = renderBox(words(700));
    fireEvent.change(box, { target: { value: "x" } });
    expect(onChange).toHaveBeenCalledWith("x");
    fireEvent.click(submit());
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("turns Submit off and says why at the daily limit, and is read-only while locked", () => {
    const { submit } = renderBox(words(700), { limitReached: true });
    expect(submit().disabled).toBe(true);
    expect(screen.getByText(/Submit is off until marking is available again tomorrow/)).toBeTruthy();
    cleanup();
    const locked = renderBox(words(700), { locked: true });
    expect(locked.box.readOnly).toBe(true);
    expect(locked.submit().disabled).toBe(true);
  });

  it("keeps a polite live region for the counter", () => {
    const { container } = render(<EssayBox attemptId="a1" attemptToken="t" questionId="q" value="" onChange={() => {}} onSubmit={() => {}} locked={false} limitReached={false} />);
    expect(container.querySelector('[role="status"][aria-live="polite"]')).toBeTruthy();
  });

  it("saves the draft to this tab at once and to the server after a pause", async () => {
    vi.useFakeTimers();
    try {
      renderBox("some words");
      expect(window.sessionStorage.getItem("draft:rewrite:a1:q:phase1")).toContain("some words");
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3100);
      });
      expect((navigator.sendBeacon as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("marking an essay", () => {
  const state = (over: Partial<EssayState> = {}): EssayState => ({
    stage: "write",
    essay,
    scaffold: filled(),
    locked: true,
    draft: words(700),
    ...over,
  });
  const submit = () => screen.getByRole("button", { name: "Submit essay" }) as HTMLButtonElement;
  const mockFetch = (res: () => Response | Promise<Response>) => vi.stubGlobal("fetch", vi.fn(async () => res()));
  const panel = (s: EssayState) => render(<EssayPanel attemptId="a1" attemptToken="t" state={s} onFinish={() => {}} />);

  it("opens on the essay stage with the plan read-only and open, and a restored draft", () => {
    const { container } = panel(state());
    expect(container.querySelector("details.es-collapse")?.hasAttribute("open")).toBe(true);
    expect(screen.getByText("Your plan")).toBeTruthy();
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(words(700));
    expect(submit().disabled).toBe(false);
  });

  it("returns the editable box with the text and a plain notice when the marker could not mark", async () => {
    mockFetch(() => new Response(JSON.stringify({ notMarked: { reason: "marker_unavailable" }, saved: false }), { status: 200 }));
    panel(state());
    fireEvent.click(submit());
    await waitFor(() => expect(screen.getByText(/We couldn.t mark your answer just now/)).toBeTruthy());
    const box = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(box.readOnly).toBe(false);
    expect(box.value).toBe(words(700));
    expect(screen.queryByText(/error/i)).toBeNull();
    expect(submit().disabled).toBe(false);
  });

  it("at the daily limit says to come back tomorrow and keeps Submit off", async () => {
    mockFetch(() => new Response(JSON.stringify({ notMarked: { reason: "daily_limit", resetsAt: "2026-11-24T00:00:00+11:00" }, saved: false }), { status: 200 }));
    panel(state());
    fireEvent.click(submit());
    await waitFor(() => expect(screen.getByText(/Come back tomorrow/)).toBeTruthy());
    expect(submit().disabled).toBe(true);
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(words(700));
  });

  it("starts with Submit off after a reload at the limit, from the server's cap", () => {
    panel(state({ cap: { resetsAt: "2026-11-24T00:00:00+11:00" } }));
    expect(submit().disabled).toBe(true);
    expect(screen.getByText(/Come back tomorrow/)).toBeTruthy();
  });

  it("locks the box and shows timed status steps in a live region while marking", async () => {
    let resolve!: (r: Response) => void;
    mockFetch(() => new Promise<Response>((r) => (resolve = r)));
    const { container } = panel(state());
    fireEvent.click(submit());
    await waitFor(() => expect((screen.getByRole("textbox") as HTMLTextAreaElement).readOnly).toBe(true));
    expect(container.querySelector('.rw-status[aria-live="polite"]')?.textContent).toContain("Sending your essay");
    expect(submit().disabled).toBe(true);
    resolve(new Response(JSON.stringify({ notMarked: { reason: "marker_unavailable" } }), { status: 200 }));
    await waitFor(() => expect((screen.getByRole("textbox") as HTMLTextAreaElement).readOnly).toBe(false));
  });

  it("returns the box with the usual error when the request never reached the server", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("offline");
    }));
    panel(state());
    fireEvent.click(submit());
    expect((await screen.findByRole("alert")).textContent).toMatch(/Could not reach the server/);
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(words(700));
  });

  it("shows the result when marking succeeds, and the stored result on a double submit", async () => {
    mockFetch(() => new Response(JSON.stringify({ result: resultView() }), { status: 200 }));
    panel(state());
    fireEvent.click(submit());
    expect(await screen.findByText("14")).toBeTruthy();
    cleanup();
    mockFetch(() => new Response(JSON.stringify({ error: "already_answered", result: resultView({ finalMark: 15 }) }), { status: 409 }));
    panel(state());
    fireEvent.click(submit());
    expect(await screen.findByText("15")).toBeTruthy();
  });

  it("says another marking is running instead of an error on marking_in_progress", async () => {
    mockFetch(() => new Response(JSON.stringify({ error: "marking_in_progress" }), { status: 409 }));
    panel(state());
    fireEvent.click(submit());
    expect((await screen.findByRole("alert")).textContent).toMatch(/already being marked/);
  });
});

function resultView(over: Partial<EssayResultView> = {}): EssayResultView {
  return {
    questionId: essay.id,
    essay,
    finalMark: 14,
    band: 2,
    capped: false,
    criteria: {
      understanding: { verdict: "strong", reason: "R-understanding" },
      theory: { verdict: "sound", reason: "R-theory" },
      assessment: { verdict: "developing", reason: "R-assessment" },
      data: { verdict: "weak", reason: "R-data" },
      structure: { verdict: "sound", reason: "R-structure" },
    },
    bandReason: "Band reason sentence.",
    lift: ["Lift one", "Lift two"],
    flags: [{ quote: "GDP was $90 trillion", why: "This figure looks wrong; check it against a source." }],
    gaps: [{ conceptId: "u.c-china-wto", term: "China", detail: "WTO named but no effect shown" }],
    essayText: "My essay text.",
    plan: filled(),
    words: 700,
    modelEssay: "The model essay text.",
    ...over,
  };
}

describe("the result", () => {
  it("shows the mark and band, five verdicts in words, two lift points, flags, gaps and the plan beside the essay", () => {
    const { container } = render(<EssayResult result={resultView()} onBack={() => {}} />);
    expect(screen.getByText("14")).toBeTruthy();
    expect(screen.getByText(/Band 2 \(13–16\)/)).toBeTruthy();
    for (const w of ["Strong", "Sound", "Developing", "Weak"]) expect(screen.getAllByText(new RegExp(w)).length).toBeGreaterThan(0);
    for (const r of ["R-understanding", "R-theory", "R-assessment", "R-data", "R-structure"]) expect(screen.getByText(r)).toBeTruthy();
    expect(screen.getByText("Lift one")).toBeTruthy();
    expect(screen.getByText("Lift two")).toBeTruthy();
    expect(screen.getByText("GDP was $90 trillion")).toBeTruthy();
    expect(screen.getByText(/WTO named but no effect shown/)).toBeTruthy();
    expect(container.querySelector(".es-sidebyside .es-sbs-essay")).toBeTruthy();
    expect(container.querySelector(".es-sidebyside .es-sbs-plan")).toBeTruthy();
    expect(screen.getByText("My essay text.")).toBeTruthy();
  });

  it("collapses the model essay and shows it only when it is in the result", () => {
    const { container, unmount } = render(<EssayResult result={resultView()} />);
    const details = container.querySelector("details.es-collapse")!;
    expect(details.hasAttribute("open")).toBe(false);
    expect(details.textContent).toContain("The model essay text.");
    unmount();
    const none = render(<EssayResult result={resultView({ modelEssay: undefined })} />);
    expect(none.container.textContent).not.toContain("model essay");
  });

  it("says in words when the one-economy cap applied", () => {
    render(<EssayResult result={resultView({ finalMark: 12, capped: true })} />);
    expect(screen.getByText(/Capped at 12/)).toBeTruthy();
  });

  it("takes focus on the summary and never shows whether the plan was reviewed", () => {
    const { container } = render(<EssayResult result={resultView()} />);
    expect(document.activeElement).toBe(container.querySelector(".es-summary"));
    expect(container.textContent).not.toMatch(/feedback on your plan/i);
  });

  it("has no verdict that relies on colour alone: each carries its word", () => {
    const { container } = render(<EssayResult result={resultView()} />);
    const badges = [...container.querySelectorAll(".es-verdict")].map((b) => b.textContent);
    expect(badges).toHaveLength(5);
    for (const b of badges) expect(b).toMatch(/Strong|Sound|Developing|Weak/);
  });
});
