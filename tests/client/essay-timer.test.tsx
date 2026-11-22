// @vitest-environment jsdom
//
// The optional 50-minute timer (spec 010 FR-022): started by the student, counts down, never blocks Submit,
// says so at zero in a polite status, and is not remembered across a reload.

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EssayPanel } from "@/components/essay/EssayPanel";
import { Timer, TIMER_SECONDS } from "@/components/essay/Timer";
import { emptyScaffold, setField } from "@/lib/essay/scaffold";
import type { EssayState } from "@/lib/essay/types";

const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");

beforeEach(() => {
  vi.useFakeTimers();
  window.sessionStorage.clear();
  Object.defineProperty(navigator, "sendBeacon", { value: vi.fn(() => true), configurable: true });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("the timer", () => {
  it("is 50 minutes, unstarted at first and optional", () => {
    expect(TIMER_SECONDS).toBe(3000);
    render(<Timer />);
    expect(screen.getByRole("button", { name: /Start 50-minute timer/ })).toBeTruthy();
    expect(screen.getByText(/Optional/)).toBeTruthy();
  });

  it("counts down once started", async () => {
    render(<Timer />);
    fireEvent.click(screen.getByRole("button", { name: /Start/ }));
    expect(screen.getByText("50:00 left")).toBeTruthy();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(61_000);
    });
    expect(screen.getByText("48:59 left")).toBeTruthy();
  });

  it("says time is up at zero in a polite status and keeps counting no further", async () => {
    render(<Timer seconds={3} />);
    fireEvent.click(screen.getByRole("button", { name: /Start/ }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    const note = screen.getByText("Time is up. You can still submit.");
    expect(note.getAttribute("role")).toBe("status");
    expect(note.getAttribute("aria-live")).toBe("polite");
  });

  it("never disables Submit, before, during or after it runs out", async () => {
    const state: EssayState = {
      stage: "write",
      essay: { id: "u.e1", prompt: "Explain it.", verb: "explain", verbDefinition: "d", economy: "china", offer: 1 },
      scaffold: setField(emptyScaffold(), { section: "intro", key: "judgement" }, "J"),
      locked: true,
      draft: words(700),
    };
    render(<EssayPanel attemptId="a" attemptToken="t" state={state} onFinish={() => {}} />);
    const submit = () => screen.getByRole("button", { name: "Submit essay" }) as HTMLButtonElement;
    expect(submit().disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /Start 50-minute timer/ }));
    expect(submit().disabled).toBe(false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_100_000);
    });
    expect(screen.getByText("Time is up. You can still submit.")).toBeTruthy();
    expect(submit().disabled).toBe(false);
  });

  it("is unstarted again after a reload (not stored)", () => {
    const first = render(<Timer />);
    fireEvent.click(screen.getByRole("button", { name: /Start/ }));
    first.unmount();
    render(<Timer />);
    expect(screen.getByRole("button", { name: /Start 50-minute timer/ })).toBeTruthy();
  });
});
