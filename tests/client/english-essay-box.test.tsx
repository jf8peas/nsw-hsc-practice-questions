// @vitest-environment jsdom
//
// The English essay box (spec 011 FR-009 to FR-013): the counter wording and Submit state at 799, 800, 1,200 and 1,201 words,
// pasting and dropping switched off in every route (paste, drop, beforeinput) with autocorrect still allowed, draft saves,
// and a locked read-only box while marking. The box is the shared EssayBox with the English counter injected.

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EssayBox } from "@/components/essay/EssayBox";
import { englishEssayCounter } from "@/lib/english-essay/counter";

const words = (n: number) => Array.from({ length: n }, () => "w").join(" ");

let beacon: ReturnType<typeof vi.fn>;
beforeEach(() => {
  window.sessionStorage.clear();
  beacon = vi.fn(() => true);
  Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function box(value: string, over: Partial<React.ComponentProps<typeof EssayBox>> = {}) {
  const onChange = vi.fn();
  const onSubmit = vi.fn();
  const utils = render(
    <EssayBox
      attemptId="a1"
      attemptToken="tok"
      questionId="q1"
      value={value}
      onChange={onChange}
      onSubmit={onSubmit}
      locked={false}
      limitReached={false}
      counterOf={englishEssayCounter}
      {...over}
    />,
  );
  return { ...utils, onChange, onSubmit, textarea: screen.getByLabelText("Your essay") as HTMLTextAreaElement, submit: () => screen.getByRole("button", { name: /Submit essay/ }) as HTMLButtonElement };
}

describe("the counter and Submit at the four boundaries", () => {
  it.each([
    [799, "799 / 800–1,200 words — 1 more to go", true],
    [800, "800 / 800–1,200 words", false],
    [1200, "1,200 / 800–1,200 words", false],
    [1201, "1,201 / 1,200 — cut 1 word", true],
  ])("%i words", (n, text, disabled) => {
    const { submit } = box(words(n));
    expect(screen.getAllByText(text).length).toBeGreaterThan(0); // the visible counter and the polite live region
    expect(submit().disabled).toBe(disabled);
  });

  it("announces the counter in a polite live region after a pause", () => {
    vi.useFakeTimers();
    render(
      <EssayBox attemptId="a" attemptToken="t" questionId="q" value={words(800)} onChange={() => {}} onSubmit={() => {}} locked={false} limitReached={false} counterOf={englishEssayCounter} />,
    );
    act(() => void vi.advanceTimersByTime(2100));
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("800 / 800–1,200 words");
  });
});

describe("pasting and dropping are switched off", () => {
  it("cancels paste and shows the no-paste note, leaving the text unchanged", () => {
    const { textarea, onChange } = box("typed");
    const ev = new Event("paste", { bubbles: true, cancelable: true });
    fireEvent(textarea, ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(screen.getAllByText(/Pasting is switched off/).length).toBeGreaterThan(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("cancels drop", () => {
    const { textarea } = box("typed");
    const ev = new Event("drop", { bubbles: true, cancelable: true });
    fireEvent(textarea, ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  it.each(["insertFromPaste", "insertFromDrop", "insertFromYank", "insertFromPasteAsQuotation"])("cancels beforeinput %s", (inputType) => {
    const { textarea } = box("typed");
    const ev = new Event("beforeinput", { bubbles: true, cancelable: true }) as InputEvent;
    Object.defineProperty(ev, "inputType", { value: inputType });
    textarea.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  it("still allows autocorrect (insertReplacementText) and ordinary typing", () => {
    const { textarea } = box("typed");
    for (const inputType of ["insertReplacementText", "insertText"]) {
      const ev = new Event("beforeinput", { bubbles: true, cancelable: true }) as InputEvent;
      Object.defineProperty(ev, "inputType", { value: inputType });
      textarea.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(false);
    }
  });
});

describe("drafts, locking and the daily limit", () => {
  it("mirrors the text to this tab at once and sends the server draft on blur", () => {
    const { textarea } = box("my essay");
    expect(window.sessionStorage.getItem("draft:rewrite:a1:q1:1") ?? window.sessionStorage.length).toBeTruthy();
    fireEvent.blur(textarea);
    expect(beacon).toHaveBeenCalled();
  });

  it("is read-only and busy while marking, keeping the essay visible", () => {
    const { textarea, submit } = box(words(900), { locked: true });
    expect(textarea.readOnly).toBe(true);
    expect(textarea.getAttribute("aria-busy")).toBe("true");
    expect(textarea.value).toContain("w w w");
    expect(submit().disabled).toBe(true);
    expect(screen.getByText("Marking your essay…")).toBeTruthy();
  });

  it("keeps Submit off with an in-range essay once the daily limit is reached", () => {
    const { submit } = box(words(900), { limitReached: true });
    expect(submit().disabled).toBe(true);
    expect(screen.getByText(/Submit is off until marking is available again tomorrow/)).toBeTruthy();
  });

  it("submits an in-range essay", () => {
    const { submit, onSubmit } = box(words(900));
    fireEvent.click(submit());
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
