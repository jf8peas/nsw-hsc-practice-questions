// @vitest-environment jsdom
//
// Highlighting in the comparative unit's tabs (spec 009 FR-007, task T037): each text has its own highlighter and its
// own highlights, kept per user, attempt AND text, so the two texts of one question never share them; a text
// highlighted in a spec 008 attempt starts clean in a comparative attempt; the tabbed-out page for the same
// attempt and text sees them; switching tabs keeps every text's highlights (panels stay mounted); an image-only
// text has no highlighter.

import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { TextPanel } from "@/components/unseen/Text";
import { TextTabs } from "@/components/unseen/TextTabs";
import type { UnseenText } from "@/lib/types";
import { KEY_PREFIX, storageKey } from "@/lib/unseen/highlight-store";

const prose: UnseenText = {
  id: "c-t1", form: "prose-fiction", heading: "Text 1 – Prose", title: "The Tide", author: "A. Writer", sourceLine: "Source.",
  body: { kind: "prose", paragraphs: ["The quick brown fox jumps over the lazy dog."] }, hscChecked: "2026-11-19",
};
const poem: UnseenText = {
  ...prose, id: "c-t2", form: "poem", heading: "Text 2 – Poem", title: "Harbour",
  body: { kind: "poem", stanzas: [["The tide walks out", "and takes the light"]] },
};
const image: UnseenText = { ...prose, id: "c-t3", form: "visual", heading: "Text 3 – Image", body: { kind: "image", image: "c-t3", alt: "A picture" } };

const UID = "u-1";
const NEW = "attempt-new";
const OLD = "attempt-old"; // a spec 008 attempt the same student made on the same text earlier

beforeEach(() => window.localStorage.clear());
afterEach(() => cleanup());

const mountTabs = (texts = [prose, poem, image], attemptId = NEW) =>
  render(<TextTabs texts={texts} unitId="y12-english-advanced-comparative-texts" attemptId={attemptId} uid={UID} final={false} />);
const tabs = () => screen.getAllByRole("tab");
const visiblePanel = () => screen.getByRole("tabpanel");
const marks = (c: ParentNode) => Array.from(c.querySelectorAll("mark.un-hl")).map((m) => m.textContent);

function selectIn(el: HTMLElement, from: number, to: number) {
  const node = el.firstChild as Text;
  const range = document.createRange();
  range.setStart(node, from);
  range.setEnd(node, to);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
  act(() => {
    fireEvent(el, new Event("pointerup", { bubbles: true }));
  });
}
const block0 = (panel: HTMLElement) => panel.querySelector('[data-hl-block="0"]') as HTMLElement;
const toggleIn = (panel: HTMLElement) => within(panel).getByRole("button", { name: "Highlight" });
const storedKeys = () => Object.keys(window.localStorage).filter((k) => k.startsWith(KEY_PREFIX));

describe("each text has its own highlights", () => {
  it("a highlight in one text is stored under that text only, and the other tab shows none", () => {
    mountTabs();
    fireEvent.click(toggleIn(visiblePanel()));
    selectIn(block0(visiblePanel()), 4, 15); // "quick brown"
    expect(marks(visiblePanel())).toEqual(["quick brown"]);
    expect(storedKeys()).toEqual([storageKey({ userId: UID, attemptId: NEW, textId: "c-t1" })]);
    fireEvent.click(tabs()[1]);
    expect(marks(visiblePanel())).toEqual([]);
    fireEvent.click(toggleIn(visiblePanel()));
    selectIn(block0(visiblePanel()), 4, 12); // "tide walks"? snapped to whole words
    expect(marks(visiblePanel()).length).toBe(1);
    expect(storedKeys().sort()).toEqual([storageKey({ userId: UID, attemptId: NEW, textId: "c-t1" }), storageKey({ userId: UID, attemptId: NEW, textId: "c-t2" })].sort());
  });

  it("switching tabs keeps every text's highlights: the panels stay mounted", () => {
    const { container } = mountTabs();
    fireEvent.click(toggleIn(visiblePanel()));
    selectIn(block0(visiblePanel()), 4, 15);
    fireEvent.click(tabs()[2]);
    fireEvent.click(tabs()[0]);
    expect(marks(visiblePanel())).toEqual(["quick brown"]);
    expect(container.querySelectorAll('[role="tabpanel"]')).toHaveLength(3);
  });

  it("an image-only text has no highlighter", () => {
    mountTabs();
    fireEvent.click(tabs()[2]);
    expect(within(visiblePanel()).queryByRole("button", { name: "Highlight" })).toBeNull();
  });
});

describe("per user, attempt and text", () => {
  it("a text highlighted in an earlier (spec 008) attempt starts clean in this comparative attempt", () => {
    window.localStorage.setItem(storageKey({ userId: UID, attemptId: OLD, textId: "c-t1" }), JSON.stringify({ items: [{ id: "x", block: 0, start: 4, end: 15 }] }));
    mountTabs([prose, poem], NEW);
    expect(marks(visiblePanel())).toEqual([]);
    // and the old attempt still has its own highlight
    cleanup();
    mountTabs([prose, poem], OLD);
    expect(marks(visiblePanel())).toEqual(["quick brown"]);
  });

  it("another student's highlights on the same attempt and text are not shown", () => {
    window.localStorage.setItem(storageKey({ userId: "someone-else", attemptId: NEW, textId: "c-t1" }), JSON.stringify({ items: [{ id: "x", block: 0, start: 4, end: 15 }] }));
    mountTabs();
    expect(marks(visiblePanel())).toEqual([]);
  });
});

describe("the tabbed-out page for the same attempt and text", () => {
  it("opens with the highlights made in the quiz, and one text's page shows only its own", () => {
    mountTabs();
    fireEvent.click(toggleIn(visiblePanel()));
    selectIn(block0(visiblePanel()), 4, 15);
    cleanup();
    // the text-only page: spec 008's TextPanel with the same scope
    const { container } = render(<TextPanel text={prose} highlight={{ userId: UID, attemptId: NEW }} />);
    expect(marks(container)).toEqual(["quick brown"]);
    cleanup();
    const other = render(<TextPanel text={poem} highlight={{ userId: UID, attemptId: NEW }} />);
    expect(marks(other.container)).toEqual([]);
  });

  it("a highlight made in the tabbed-out page reaches the quiz's panel for that text (same storage scope)", () => {
    const page = render(<TextPanel text={prose} highlight={{ userId: UID, attemptId: NEW }} />);
    fireEvent.click(within(page.container).getByRole("button", { name: "Highlight" }));
    selectIn(block0(page.container), 4, 15);
    page.unmount();
    mountTabs();
    expect(marks(visiblePanel())).toEqual(["quick brown"]);
  });
});
