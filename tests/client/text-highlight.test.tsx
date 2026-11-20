// @vitest-environment jsdom
//
// Text highlighting in the text panel (spec 008 FR-006a): the toggle, word-snapped selections that merge,
// removal of one connected highlight, the off state, what can never be highlighted, in-memory use when storage
// is unavailable, live sync to another view (BroadcastChannel, then the storage event), per-attempt sets, the
// image text, and no dangerouslySetInnerHTML.

import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TextPanel, type HighlightConfig } from "@/components/unseen/Text";
import type { UnseenText } from "@/lib/types";
import { KEY_PREFIX, sweepFinalHighlights, storageKey, markFinal } from "@/lib/unseen/highlight-store";

const prose: UnseenText = {
  id: "t-prose",
  form: "prose-fiction",
  heading: "Text 2 – Prose",
  title: "The Tide",
  author: "A. Writer",
  sourceLine: "Source line here.",
  body: { kind: "prose", paragraphs: ["The quick brown fox jumps over the lazy dog.", "Second paragraph has more words in it."] },
  footnotes: [{ mark: "", text: "tide: the rise and fall of the sea" }],
  hscChecked: "2026-11-19",
};
const poem: UnseenText = {
  ...prose,
  id: "t-poem",
  form: "poem",
  heading: "Text 1 – Poem",
  body: { kind: "poem", stanzas: [["Shall I compare thee", "to a summer's day"], ["Thou art more lovely"]] },
  footnotes: undefined,
};
const image: UnseenText = { ...prose, id: "t-image", form: "visual", heading: "Text 3 – Image", body: { kind: "image", image: "t-image", alt: "A picture" }, footnotes: undefined };

const CFG: HighlightConfig = { userId: "u1", attemptId: "attempt-A" };
const HREF = "/unit/u/text/t?attempt=attempt-A";

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const mountPanel = (text = prose, highlight: HighlightConfig | null = CFG) => render(<TextPanel text={text} openHref={HREF} highlight={highlight} />);
const toggle = () => screen.getByRole("button", { name: "Highlight" });
const marks = (c: ParentNode = document) => Array.from(c.querySelectorAll("mark.un-hl")) as HTMLElement[];
const markText = () => marks().map((m) => m.textContent);

/** The Nth block element (data-hl-block) of the panel. */
const block = (n: number) => document.querySelector(`[data-hl-block="${n}"]`) as HTMLElement;

/** Selects characters [from, to) of a block's text, as a user drag would, then ends the selection with a pointer-up. */
function select(el: HTMLElement, from: number, to: number, end: "pointerup" | "keyup" | "touchend" = "pointerup", fireOn: Element = el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let pos = 0;
  let startNode: Text | null = null;
  let endNode: Text | null = null;
  let startOff = 0;
  let endOff = 0;
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const len = n.data.length;
    if (!startNode && from <= pos + len) {
      startNode = n;
      startOff = from - pos;
    }
    if (to <= pos + len) {
      endNode = n;
      endOff = to - pos;
      break;
    }
    pos += len;
  }
  const range = document.createRange();
  range.setStart(startNode!, startOff);
  range.setEnd(endNode!, endOff);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
  act(() => {
    fireEvent(fireOn, new Event(end, { bubbles: true }));
  });
}
/** Selects from inside one block to inside another (a drag across blocks). */
function selectAcross(a: HTMLElement, aOff: number, b: HTMLElement, bOff: number) {
  const range = document.createRange();
  range.setStart(a.firstChild as Text, aOff);
  range.setEnd(b.firstChild as Text, bOff);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
  act(() => {
    fireEvent(b, new Event("pointerup", { bubbles: true }));
  });
}
const on = () => fireEvent.click(toggle());

describe("the highlight toggle", () => {
  it("is a pressed-state button named Highlight with the tooltip, shows a status line when on, and is 44 px with a focus ring in CSS", () => {
    mountPanel();
    expect(toggle().getAttribute("aria-pressed")).toBe("false");
    expect(toggle().getAttribute("title")).toBe("Highlight text: select words to highlight; click a highlight to remove it");
    expect(screen.queryByText("Highlighting on")).toBeNull();
    on();
    expect(toggle().getAttribute("aria-pressed")).toBe("true");
    expect(toggle().classList.contains("on")).toBe(true);
    expect(screen.getByText("Highlighting on").getAttribute("role")).toBe("status");
    on();
    expect(toggle().getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByText("Highlighting on")).toBeNull();
    const css = fs.readFileSync(path.resolve(__dirname, "../../app/globals.css"), "utf8");
    expect(css).toMatch(/\.un-hl-toggle \{[^}]*width: 44px; height: 44px/);
    expect(css).toMatch(/\.un-hl-toggle:focus-visible \{[^}]*outline/);
  });

  it("sits beside the open-in-a-new-tab icon in the heading row", () => {
    mountPanel();
    const tools = toggle().closest(".un-text-tools")!;
    expect(tools.querySelector("a.un-open")).toBeTruthy();
    expect(tools.closest(".un-text-top")).toBeTruthy();
  });

  it("is absent for an image-only text (the open link stays) and does not appear without a highlight configuration or note", () => {
    mountPanel(image);
    expect(screen.queryByRole("button", { name: "Highlight" })).toBeNull();
    expect(screen.getByRole("link", { name: /Open Text 3 – Image in a new tab/ })).toBeTruthy();
    cleanup();
    render(<TextPanel text={prose} openHref={HREF} />);
    expect(screen.queryByRole("button", { name: "Highlight" })).toBeNull();
  });

  it("is a disabled toggle with a one-line note when the tab has no valid attempt", () => {
    render(<TextPanel text={prose} highlight={null} highlightNote="Highlighting is off here: open this text from its quiz." />);
    expect((toggle() as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Highlighting is off here/)).toBeTruthy();
  });

  it("does not take focus from the answer box on mouse-down (so typing is undisturbed)", () => {
    render(
      <>
        <TextPanel text={prose} highlight={CFG} />
        <textarea aria-label="answer" />
      </>,
    );
    const box = screen.getByLabelText("answer") as HTMLTextAreaElement;
    box.focus();
    const notPrevented = fireEvent.mouseDown(toggle());
    expect(notPrevented).toBe(false); // default prevented: the button never takes focus
    fireEvent.click(toggle());
    expect(document.activeElement).toBe(box);
    fireEvent.change(box, { target: { value: "still typing" } });
    expect(box.value).toBe("still typing");
    expect(marks()).toHaveLength(0);
  });
});

describe("adding highlights", () => {
  it("a selection adds a highlight snapped to whole words, as a <mark>, and clears the browser selection", () => {
    mountPanel();
    on();
    select(block(0), 6, 14); // "uick bro" in "The quick brown fox ..."
    expect(markText()).toEqual(["quick brown"]);
    expect(marks()[0].tagName).toBe("MARK");
    expect(window.getSelection()!.isCollapsed).toBe(true);
    expect(block(0).textContent).toBe("The quick brown fox jumps over the lazy dog."); // nothing lost or added
  });

  it.each(["pointerup", "keyup", "touchend"] as const)("ends on %s", (end) => {
    mountPanel();
    on();
    select(block(0), 4, 9, end);
    expect(markText()).toEqual(["quick"]);
  });

  it("settles a long-press touch selection on the debounced selectionchange", () => {
    vi.useFakeTimers();
    try {
      mountPanel();
      on();
      act(() => {
        fireEvent(block(0), new Event("pointerdown", { bubbles: true }));
      });
      // React reads pointerType from the event; a plain Event has none, so mark touch with touchstart
      act(() => {
        fireEvent.touchStart(block(0));
      });
      const range = document.createRange();
      range.setStart(block(0).firstChild as Text, 4);
      range.setEnd(block(0).firstChild as Text, 9);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(range);
      act(() => {
        document.dispatchEvent(new Event("selectionchange"));
      });
      expect(markText()).toEqual([]);
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(markText()).toEqual(["quick"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("highlights poem lines and footnotes as well as prose", () => {
    mountPanel(poem);
    on();
    select(block(1), 0, 2); // "to a summer's day"
    expect(markText()).toEqual(["to"]);
    cleanup();
    window.localStorage.clear();
    mountPanel(prose);
    on();
    const note = block(2); // the footnote is block 2 (after two paragraphs)
    expect(note.textContent).toBe("tide: the rise and fall of the sea");
    select(note, 10, 14);
    expect(markText()).toEqual(["rise"]);
  });

  it("an overlapping selection merges into one connected highlight", () => {
    mountPanel();
    on();
    select(block(0), 4, 9); // quick
    select(block(0), 6, 17); // quick brown fox -> overlaps
    expect(markText()).toEqual(["quick brown fox"]);
    expect(marks()).toHaveLength(1);
  });

  it("a selection touching an existing highlight at its edge merges with it", () => {
    mountPanel();
    on();
    select(block(0), 4, 9); // quick
    select(block(0), 9, 15); // " brown" - trims the space, so it starts at 10: separate
    expect(markText()).toEqual(["quick", "brown"]);
    select(block(0), 8, 12); // reaches into both words: joins everything
    expect(markText()).toEqual(["quick brown"]);
  });

  it("a drag across two blocks makes one highlight with a mark in each block", () => {
    mountPanel();
    on();
    selectAcross(block(0), 36, block(1), 6);
    expect(markText()).toEqual(["lazy dog.", "Second"]);
    const ids = new Set(marks().map((m) => m.dataset.hlId));
    expect(ids.size).toBe(1);
  });
});

describe("removing highlights", () => {
  it("clicking a highlight removes that whole connected highlight and leaves a separate one", () => {
    mountPanel();
    on();
    select(block(0), 4, 9); // quick
    select(block(0), 20, 25); // jumps over? -> "over"
    expect(marks()).toHaveLength(2);
    fireEvent.click(marks()[0]);
    expect(markText()).toHaveLength(1);
    expect(markText()[0]).not.toBe("quick");
  });

  it("a highlight spanning two blocks goes with one click on either part, and a separate one stays", () => {
    mountPanel();
    on();
    selectAcross(block(0), 36, block(1), 6); // across
    select(block(1), 14, 18); // separate, "more"? words: "Second paragraph has more" -> "paragraph"/"has"
    expect(marks()).toHaveLength(3);
    const part = marks().find((m) => m.textContent === "Second")!;
    fireEvent.click(part);
    expect(markText()).toHaveLength(1);
    expect(markText()[0]).not.toMatch(/lazy|Second/);
  });

  it("removal is saved, so a re-mounted panel shows what is left", () => {
    mountPanel();
    on();
    select(block(0), 4, 9);
    select(block(0), 20, 25);
    fireEvent.click(marks()[1]);
    cleanup();
    mountPanel();
    expect(markText()).toEqual(["quick"]);
  });

  it("the keyboard can remove a highlight (Enter on a focused highlight) while highlighting is on", () => {
    mountPanel();
    on();
    select(block(0), 4, 9);
    fireEvent.keyDown(marks()[0], { key: "Enter" });
    expect(marks()).toHaveLength(0);
  });
});

describe("with highlighting off", () => {
  it("selection adds nothing and clicking a highlight removes nothing, but highlights stay visible", () => {
    mountPanel();
    on();
    select(block(0), 4, 9);
    on(); // off
    expect(markText()).toEqual(["quick"]);
    select(block(0), 20, 25);
    expect(markText()).toEqual(["quick"]);
    fireEvent.click(marks()[0]);
    expect(markText()).toEqual(["quick"]);
    expect(marks()[0].tabIndex).toBe(-1);
  });
});

describe("what cannot be highlighted", () => {
  it("the heading, title, author and source line are not blocks, so selecting them adds nothing", () => {
    mountPanel();
    on();
    for (const sel of [".un-heading", ".un-title", ".un-author", ".un-source"]) {
      const el = document.querySelector(sel) as HTMLElement;
      const range = document.createRange();
      range.selectNodeContents(el);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(range);
      act(() => {
        fireEvent(el, new Event("pointerup", { bubbles: true }));
      });
    }
    expect(marks()).toHaveLength(0);
    expect(document.querySelectorAll("[data-hl-block]").length).toBe(3); // two paragraphs and one footnote only
  });

  it("a selection that runs from the source line into the text highlights only the text", () => {
    mountPanel();
    on();
    const src = document.querySelector(".un-source")!.firstChild as Text;
    const range = document.createRange();
    range.setStart(src, 2);
    range.setEnd(block(0).firstChild as Text, 9);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);
    act(() => {
      fireEvent(block(0), new Event("pointerup", { bubbles: true }));
    });
    expect(markText()).toEqual(["The quick"]);
  });

  it("the answer box is not part of the text and is never highlighted, however it is selected", () => {
    render(
      <>
        <TextPanel text={prose} highlight={CFG} />
        <textarea aria-label="answer" defaultValue="my own words here" />
      </>,
    );
    on();
    const box = screen.getByLabelText("answer") as HTMLTextAreaElement;
    box.focus();
    box.setSelectionRange(0, 6);
    act(() => {
      fireEvent(box, new Event("keyup", { bubbles: true }));
      fireEvent(box, new Event("pointerup", { bubbles: true }));
    });
    expect(marks()).toHaveLength(0);
    expect(box.value).toBe("my own words here");
  });
});

describe("storage", () => {
  it("keeps highlights in this browser under a key naming user, attempt and text, as ranges", () => {
    mountPanel();
    on();
    select(block(0), 4, 9);
    const raw = window.localStorage.getItem(storageKey({ userId: "u1", attemptId: "attempt-A", textId: "t-prose" }));
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw!);
    expect(stored.items).toEqual([expect.objectContaining({ block: 0, start: 4, end: 9 })]);
    expect(Object.keys(stored.items[0]).sort()).toEqual(["block", "end", "id", "start"]);
  });

  it("restores them when the panel is mounted again", () => {
    mountPanel();
    on();
    select(block(0), 4, 9);
    cleanup();
    mountPanel();
    expect(markText()).toEqual(["quick"]);
  });

  it("a different attempt id (a new attempt, or a repeat of the question) starts with none", () => {
    mountPanel(prose, { userId: "u1", attemptId: "attempt-A" });
    on();
    select(block(0), 4, 9);
    cleanup();
    mountPanel(prose, { userId: "u1", attemptId: "attempt-B" });
    expect(marks()).toHaveLength(0);
    cleanup();
    mountPanel(prose, { userId: "someone-else", attemptId: "attempt-A" });
    expect(marks()).toHaveLength(0);
  });

  it("still works for the page's lifetime when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    mountPanel();
    on();
    select(block(0), 4, 9);
    expect(markText()).toEqual(["quick"]);
    fireEvent.click(marks()[0]);
    expect(marks()).toHaveLength(0);
  });

  it("removes the highlights of an attempt that has been final for 30 days, and only those", () => {
    const final = { userId: "u1", attemptId: "old", textId: "t-prose" };
    const fresh = { userId: "u1", attemptId: "recent", textId: "t-prose" };
    const live = { userId: "u1", attemptId: "live", textId: "t-prose" };
    const items = JSON.stringify({ items: [{ id: "a", block: 0, start: 0, end: 3 }] });
    for (const s of [final, fresh, live]) window.localStorage.setItem(storageKey(s), items);
    const day = 86_400_000;
    const now = Date.now();
    markFinal(final, now - 31 * day);
    markFinal(fresh, now - 5 * day);
    expect(sweepFinalHighlights(now)).toBe(1);
    expect(window.localStorage.getItem(storageKey(final))).toBeNull();
    expect(window.localStorage.getItem(storageKey(fresh))).not.toBeNull();
    expect(window.localStorage.getItem(storageKey(live))).not.toBeNull(); // not final: kept
    expect(Object.keys(window.localStorage).filter((k) => k.startsWith(KEY_PREFIX))).toHaveLength(2);
  });

  it("marks an attempt final when the panel is shown for a finished question", () => {
    const scope = { userId: "u1", attemptId: "attempt-A", textId: "t-prose" };
    window.localStorage.setItem(storageKey(scope), JSON.stringify({ items: [{ id: "a", block: 0, start: 0, end: 3 }] }));
    mountPanel(prose, { ...CFG, final: true });
    expect(JSON.parse(window.localStorage.getItem(storageKey(scope))!).finalAt).toBeTypeOf("number");
  });
});

describe("sync between views", () => {
  it("a BroadcastChannel message from another view updates this one without a reload; the toggle is per view", () => {
    // an in-memory channel bus, so two mounted panels play the quiz and the text-only tab
    const channels = new Set<FakeChannel>();
    class FakeChannel {
      listeners = new Set<(e: MessageEvent) => void>();
      constructor(public name: string) {
        channels.add(this);
      }
      postMessage(data: unknown) {
        for (const c of channels) if (c !== this && c.name === this.name) c.listeners.forEach((l) => l({ data } as MessageEvent));
      }
      addEventListener(_t: string, l: (e: MessageEvent) => void) {
        this.listeners.add(l);
      }
      removeEventListener(_t: string, l: (e: MessageEvent) => void) {
        this.listeners.delete(l);
      }
      close() {
        channels.delete(this);
      }
    }
    vi.stubGlobal("BroadcastChannel", FakeChannel);
    const a = render(<TextPanel text={prose} highlight={CFG} />);
    const b = render(<TextPanel text={prose} highlight={CFG} />);
    const btnA = within(a.container).getByRole("button", { name: "Highlight" });
    fireEvent.click(btnA);
    const blockA = a.container.querySelector('[data-hl-block="0"]') as HTMLElement;
    select(blockA, 4, 9);
    expect(marks(a.container)).toHaveLength(1);
    expect(marks(b.container).map((m) => m.textContent)).toEqual(["quick"]); // appeared in the other view
    const btnB = within(b.container).getByRole("button", { name: "Highlight" });
    expect(btnB.getAttribute("aria-pressed")).toBe("false"); // toggle not synced
    // and a removal in the second view reaches the first
    fireEvent.click(btnB);
    fireEvent.click(marks(b.container)[0]);
    expect(marks(a.container)).toHaveLength(0);
  });

  it("falls back to the window storage event when there is no BroadcastChannel", () => {
    vi.stubGlobal("BroadcastChannel", undefined);
    mountPanel();
    const scope = { userId: "u1", attemptId: "attempt-A", textId: "t-prose" };
    const key = storageKey(scope);
    window.localStorage.setItem(key, JSON.stringify({ items: [{ id: "z", block: 0, start: 4, end: 9 }] }));
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key }));
    });
    expect(markText()).toEqual(["quick"]);
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "some-other-key" }));
    });
    expect(markText()).toEqual(["quick"]);
  });

  it("ignores a message about another attempt's highlights", () => {
    class Bus {
      static all: Bus[] = [];
      l = new Set<(e: MessageEvent) => void>();
      constructor() {
        Bus.all.push(this);
      }
      postMessage() {}
      addEventListener(_t: string, f: (e: MessageEvent) => void) {
        this.l.add(f);
      }
      removeEventListener(_t: string, f: (e: MessageEvent) => void) {
        this.l.delete(f);
      }
      close() {}
    }
    vi.stubGlobal("BroadcastChannel", Bus);
    mountPanel();
    const other = storageKey({ userId: "u1", attemptId: "attempt-B", textId: "t-prose" });
    act(() => {
      Bus.all.forEach((b) => b.l.forEach((f) => f({ data: { key: other, items: [{ id: "q", block: 0, start: 0, end: 3 }] } } as MessageEvent)));
    });
    expect(marks()).toHaveLength(0);
  });
});

describe("how it is built", () => {
  it("never uses dangerouslySetInnerHTML (a highlight is a <mark> made by splitting the string in React)", () => {
    for (const f of ["components/unseen/Text.tsx", "lib/unseen/highlights.ts", "lib/unseen/highlight-store.ts"]) {
      expect(fs.readFileSync(path.resolve(__dirname, "../..", f), "utf8"), f).not.toMatch(/dangerouslySetInnerHTML|innerHTML/);
    }
  });

  it("sends nothing to the server", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    mountPanel();
    on();
    select(block(0), 4, 9);
    fireEvent.click(marks()[0]);
    expect(fetchSpy).not.toHaveBeenCalled();
    for (const f of ["lib/unseen/highlight-store.ts", "lib/unseen/highlights.ts"]) {
      expect(fs.readFileSync(path.resolve(__dirname, "../..", f), "utf8"), f).not.toMatch(/fetch\(|sendBeacon|XMLHttpRequest/);
    }
  });

  it("uses a warm yellow token with dark ink, and highlights print", () => {
    const tokens = fs.readFileSync(path.resolve(__dirname, "../../styles/tokens.css"), "utf8");
    expect(tokens).toMatch(/--rd-highlight-bg:\s*#FFE58A/i);
    const css = fs.readFileSync(path.resolve(__dirname, "../../app/globals.css"), "utf8");
    expect(css).toMatch(/mark\.un-hl \{[^}]*var\(--rd-highlight-bg\)[^}]*var\(--rd-ink-900\)[^}]*print-color-adjust: exact/);
  });
});
