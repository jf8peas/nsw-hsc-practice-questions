// @vitest-environment jsdom
//
// ClampedText (spec 003 US1 scenario 3a): on ≤600 px screens the description is clamped to
// 4 lines and the "Show more" button is shown ONLY when the text is actually cut off. The
// `fits` class (measured while clamped: scrollHeight <= clientHeight) makes the CSS show the
// full text with no button, and the measurement re-runs on resize/rotation via a ResizeObserver.

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ClampedText } from "@/components/ClampedText";

// jsdom has no layout, so the paragraph's height comes from these stubs.
let scrollHeight = 0;
let clientHeight = 0;

type Entry = { target: Element };
let observeTarget: Element | null = null;
let resizeCb: ((entries: Entry[]) => void) | null = null;

class FakeResizeObserver {
  constructor(cb: (entries: Entry[]) => void) {
    resizeCb = cb;
  }
  observe(target: Element) {
    observeTarget = target;
  }
  unobserve() {}
  disconnect() {
    resizeCb = null;
    observeTarget = null;
  }
}

beforeEach(() => {
  scrollHeight = 0;
  clientHeight = 0;
  observeTarget = null;
  resizeCb = null;
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", { configurable: true, get: () => scrollHeight });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get: () => clientHeight });
});
afterEach(() => {
  cleanup();
  delete (HTMLElement.prototype as { scrollHeight?: number }).scrollHeight;
  delete (HTMLElement.prototype as { clientHeight?: number }).clientHeight;
  vi.unstubAllGlobals();
});

/** Simulate the browser resizing the observed element (rotation / window resize). */
function resize() {
  expect(resizeCb).not.toBeNull();
  act(() => {
    resizeCb!([{ target: observeTarget as Element }]);
  });
}

describe("ClampedText", () => {
  it("marks a fitting text with the fits class so the CSS shows it in full with no button", () => {
    scrollHeight = 40;
    clientHeight = 40; // fits in the visible box
    const { container } = render(<ClampedText className="desc">A short description.</ClampedText>);
    const wrap = container.firstChild as HTMLElement;
    expect(wrap.className).toContain("fits"); // CSS then drops the clamp and hides the toggle
    expect(wrap.querySelector("p")?.textContent).toBe("A short description.");
  });

  it("keeps a cut text clamped with a working 'Show more' / 'Show less' button", () => {
    scrollHeight = 120;
    clientHeight = 40; // cut off at 4 lines
    const { container } = render(<ClampedText className="desc">{"A very long description. ".repeat(20)}</ClampedText>);
    const wrap = container.firstChild as HTMLElement;
    expect(wrap.className).not.toContain("fits");
    const button = wrap.querySelector("button") as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.textContent).toBe("Show more");

    act(() => button.click());
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.textContent).toBe("Show less");
    expect(wrap.className).toContain("open");

    act(() => button.click());
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.textContent).toBe("Show more");
    expect(wrap.className).not.toContain("open");
  });

  it("re-checks on resize/rotation: a fitting text that overflows gains the button, and back", () => {
    scrollHeight = 40;
    clientHeight = 40;
    const { container } = render(<ClampedText className="desc">{"A description. ".repeat(20)}</ClampedText>);
    expect((container.firstChild as HTMLElement).className).toContain("fits");

    // the element gets narrower on rotation: the same text no longer fits
    scrollHeight = 160;
    clientHeight = 40;
    resize();
    const wrap = container.firstChild as HTMLElement;
    expect(wrap.className).not.toContain("fits");
    expect(wrap.querySelector("button")).not.toBeNull();

    // it fits again after rotating back
    scrollHeight = 40;
    clientHeight = 40;
    resize();
    expect((container.firstChild as HTMLElement).className).toContain("fits");
  });

  it("always keeps the full text in the document, whatever the state", () => {
    const text = "The full description. ".repeat(30);
    scrollHeight = 160;
    clientHeight = 40;
    const { container } = render(<ClampedText className="desc">{text}</ClampedText>);
    expect(container.textContent).toContain(text);
    // and the server-rendered shape always carries the full paragraph
    scrollHeight = 40;
    clientHeight = 40;
    const { container: fitted } = render(<ClampedText className="desc">{text}</ClampedText>);
    expect(fitted.textContent).toContain(text);
  });
});
