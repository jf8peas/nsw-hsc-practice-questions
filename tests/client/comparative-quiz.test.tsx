// @vitest-environment jsdom
//
// The browser side of the comparative unit (spec 009 FR-002 to FR-010, tasks T026 and T027): the texts in tabs
// (exactly the question's texts, keyboard-operable, every panel mounted, the answer box never moved or cleared by
// switching), each text's own open-in-a-new-tab link, and the pick on a choice question (Submit off until it is
// complete, saved as it changes, restored on resume, read-only once the first try is submitted).

import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Quiz } from "@/components/Quiz";
import { storeTexts } from "@/content/units/y12-english-advanced-unseen-texts/store-texts";
import type { ComparativeState } from "@/lib/comparative/types";
import type { AttemptPayload } from "@/lib/drafts";
import type { ComparativeQuestion } from "@/lib/types";
import { COMPARATIVE_SKILL_IDS } from "@/lib/unseen/skills";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));
vi.mock("@/lib/navigation", () => ({ reloadPage: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const UID = "6f0b6a53-3a39-4a3e-8d5b-0b2f6f3c9d11";
const ATTEMPT = "55555555-3a39-4a3e-8d5b-0b2f6f3c9d11";
const UNIT = "y12-english-advanced-comparative-texts";

const written = storeTexts.filter((t) => t.body.kind !== "image");
const [A, B] = written;
const V = storeTexts.find((t) => t.body.kind === "image")!;

const base = {
  type: "comparative" as const, group: "comparative" as const, maxMarks: 6, verb: "compare", suggestedWords: 216, suggestedFrom: "lines" as const,
  paper: { school: "Invented", short: "Invented", year: 2026, exam: "Trial" as const, qNo: 5 as const }, outcome: "EAV-12-01" as const,
  concepts: [], source: "Invented 2026 Trial, Q5",
};
const fixedQ: ComparativeQuestion = { ...base, id: `${UNIT}.fixed`, prompt: "Compare how the two texts shape belonging.", textIds: [A.id, V.id], choice: null };
const choiceQ: ComparativeQuestion = {
  ...base, id: `${UNIT}.choice`, prompt: "Compare how the first text and ONE other text explore memory.", textIds: [A.id, B.id, V.id],
  choice: { fixed: [A.id], from: [B.id, V.id], pick: 1 },
};
const twoOfThree: ComparativeQuestion = {
  ...base, id: `${UNIT}.two`, prompt: "Compare any TWO of the texts.", textIds: [A.id, B.id, V.id], choice: { fixed: [], from: [A.id, B.id, V.id], pick: 2 },
};

const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");
const skillViews = (missed: string[] = []) => COMPARATIVE_SKILL_IDS.map((id) => ({ id, met: !missed.includes(id), reason: `reason for ${id}` }));

const stateFor = (q: ComparativeQuestion, extra: Partial<ComparativeState> = {}): ComparativeState => ({
  stage: "write", texts: q.textIds.map((id) => storeTexts.find((t) => t.id === id)!), pickLocked: false, ...extra,
});
const payloadFor = (q: ComparativeQuestion, state: ComparativeState): AttemptPayload => ({
  attemptToken: "TOKEN-9", unitId: UNIT, passMark: 60, questions: [q], answered: {}, comparativeState: state,
});

type FetchCall = { url: string; body: Record<string, unknown> };
let calls: FetchCall[];
let responder: (url: string, body: Record<string, unknown>) => Response | Promise<Response>;
const jsonRes = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  calls = [];
  push.mockReset();
  responder = () => jsonRes({});
  window.sessionStorage.clear();
  window.localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      calls.push({ url: String(url), body });
      return responder(String(url), body);
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const mount = (q: ComparativeQuestion, state: ComparativeState = stateFor(q)) =>
  render(<Quiz uid={UID} attemptId={ATTEMPT} unitId={UNIT} initial={payloadFor(q, state)} />);
const box = () => screen.getByRole("textbox") as HTMLTextAreaElement;
const type = (value: string) => fireEvent.change(box(), { target: { value } });
const submitBtn = () => screen.getByRole("button", { name: /Submit for marking/ }) as HTMLButtonElement;
const tabs = () => screen.getAllByRole("tab") as HTMLButtonElement[];
const gradeCalls = () => calls.filter((c) => c.url === "/api/grade");
const pickCalls = () => calls.filter((c) => c.url === "/api/comparative/pick");

describe("the texts in tabs (T026)", () => {
  it("a fixed pair has exactly its two texts as tabs, labelled as on the paper, in a tablist", () => {
    mount(fixedQ);
    expect(screen.getByRole("tablist")).toBeTruthy();
    expect(tabs().map((t) => t.textContent)).toEqual([A.heading, V.heading]);
    expect(tabs()[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs()[1].getAttribute("aria-selected")).toBe("false");
  });

  it("a choice question's tabs are the fixed text and every allowed text", () => {
    mount(choiceQ);
    expect(tabs().map((t) => t.textContent)).toEqual([A.heading, B.heading, V.heading]);
  });

  it("shows each text beside no other: one tabpanel at a time, but every panel stays mounted", () => {
    const { container } = mount(fixedQ);
    const panels = container.querySelectorAll('[role="tabpanel"]');
    expect(panels).toHaveLength(2);
    expect((panels[0] as HTMLElement).hidden).toBe(false);
    expect((panels[1] as HTMLElement).hidden).toBe(true);
    expect(panels[1].getAttribute("aria-labelledby")).toBe(tabs()[1].id);
    expect(tabs()[1].getAttribute("aria-controls")).toBe(panels[1].id);
    fireEvent.click(tabs()[1]);
    expect((panels[0] as HTMLElement).hidden).toBe(true);
    expect((panels[1] as HTMLElement).hidden).toBe(false);
    expect(container.querySelectorAll('[role="tabpanel"]')).toHaveLength(2); // still mounted
  });

  it("is operable by keyboard: arrows, Home and End move and select, and only the selected tab is in the tab order", () => {
    mount(choiceQ);
    const t = tabs();
    t[0].focus();
    expect(t.map((x) => x.tabIndex)).toEqual([0, -1, -1]);
    fireEvent.keyDown(t[0], { key: "ArrowRight" });
    expect(document.activeElement).toBe(t[1]);
    expect(t[1].getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(t[1], { key: "End" });
    expect(document.activeElement).toBe(t[2]);
    fireEvent.keyDown(t[2], { key: "ArrowRight" }); // wraps to the first
    expect(document.activeElement).toBe(t[0]);
    fireEvent.keyDown(t[0], { key: "ArrowLeft" }); // wraps to the last
    expect(document.activeElement).toBe(t[2]);
    fireEvent.keyDown(t[2], { key: "Home" });
    expect(document.activeElement).toBe(t[0]);
    expect(t.map((x) => x.tabIndex)).toEqual([0, -1, -1]);
  });

  it("switching tabs never moves or clears the answer box", () => {
    const { container } = mount(fixedQ);
    type(words(30));
    const el = box();
    const before = Array.from(container.querySelectorAll("*")).indexOf(el);
    fireEvent.click(tabs()[1]);
    fireEvent.click(tabs()[0]);
    expect(box()).toBe(el); // the same element, not remounted
    expect(box().value).toBe(words(30));
    expect(Array.from(container.querySelectorAll("*")).indexOf(el)).toBe(before);
    // the tabs sit above the question and the box in the document
    const tabsEl = container.querySelector(".un-tabs")!;
    expect(tabsEl.compareDocumentPosition(container.querySelector(".un-q")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(tabsEl.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("states the selected tab in words and weight as well as colour: aria-selected and the 'selected' class", () => {
    mount(fixedQ);
    expect(tabs()[0].className).toContain("selected");
    expect(tabs()[1].className).not.toContain("selected");
  });

  it("has no timer, and no side-by-side wrapper", () => {
    const { container } = mount(fixedQ);
    expect(container.querySelector('[role="timer"], time')).toBeNull();
    expect(container.querySelector(".un-layout, .un-text-col")).toBeNull();
  });
});

describe("each text opens alone (T036 in the quiz)", () => {
  it("every tab's panel has its own open-in-a-new-tab link for that text only, carrying the attempt", () => {
    const { container } = mount(choiceQ);
    const links = Array.from(container.querySelectorAll("a.un-open")) as HTMLAnchorElement[];
    expect(links.map((a) => a.getAttribute("href"))).toEqual([A.id, B.id, V.id].map((id) => `/unit/${UNIT}/text/${id}?attempt=${ATTEMPT}`));
    for (const a of links) expect(a.getAttribute("target")).toBe("_blank");
  });
});

describe("the pick (T027)", () => {
  it("shows a chip per allowed text to choose from, the fixed text as already included, and disables Submit with a note until it is complete", () => {
    mount(choiceQ);
    const group = screen.getByRole("group", { name: /Choose one text to write about/ });
    const chips = within(group).getAllByRole("button");
    expect(chips.map((c) => c.textContent)).toEqual([B.heading, V.heading]); // nothing chosen yet: just the headings
    expect(chips.every((c) => c.getAttribute("aria-pressed") === "false")).toBe(true);
    expect(screen.getByText(`Always included: ${A.heading}`)).toBeTruthy();
    type(words(60));
    expect(submitBtn().disabled).toBe(true);
    expect(screen.getByText(/Choose a text to write about, then you can submit/)).toBeTruthy();
  });

  it("typing is never blocked by the pick, and changing the pick keeps the answer text", () => {
    mount(choiceQ);
    type(words(40));
    fireEvent.click(screen.getByRole("button", { name: new RegExp("^" + B.heading) }));
    expect(box().value).toBe(words(40));
    fireEvent.click(screen.getByRole("button", { name: new RegExp("^" + V.heading) }));
    expect(box().value).toBe(words(40));
  });

  it("choosing the text enables Submit; for 'one other text' a new choice replaces the old one", () => {
    mount(choiceQ);
    type(words(60));
    const b = screen.getByRole("button", { name: new RegExp("^" + B.heading) });
    fireEvent.click(b);
    expect(b.getAttribute("aria-pressed")).toBe("true");
    expect(within(b).getByText(/Chosen/)).toBeTruthy(); // in words, not colour alone
    expect(submitBtn().disabled).toBe(false);
    const v = screen.getByRole("button", { name: new RegExp("^" + V.heading) });
    fireEvent.click(v);
    expect(v.getAttribute("aria-pressed")).toBe("true");
    expect(b.getAttribute("aria-pressed")).toBe("false");
  });

  it("'any TWO' needs two: one is incomplete, two enables Submit, a third replaces the oldest", () => {
    mount(twoOfThree);
    type(words(60));
    const chip = (t: { heading: string }) => screen.getByRole("button", { name: new RegExp("^" + t.heading.replace(/[–—]/g, ".")) });
    fireEvent.click(chip(A));
    expect(submitBtn().disabled).toBe(true);
    expect(screen.getByText(/Choose the texts to write about, then you can submit/)).toBeTruthy();
    fireEvent.click(chip(B));
    expect(submitBtn().disabled).toBe(false);
    fireEvent.click(chip(V));
    expect(chip(A).getAttribute("aria-pressed")).toBe("false");
    expect(chip(B).getAttribute("aria-pressed")).toBe("true");
    expect(chip(V).getAttribute("aria-pressed")).toBe("true");
  });

  it("saves the pick as soon as it is complete (debounced), and never an incomplete one", async () => {
    mount(twoOfThree);
    fireEvent.click(screen.getByRole("button", { name: new RegExp("^" + A.heading.replace(/[–—]/g, ".")) }));
    await act(async () => void vi.advanceTimersByTime(600));
    expect(pickCalls()).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: new RegExp("^" + B.heading.replace(/[–—]/g, ".")) }));
    await act(async () => void vi.advanceTimersByTime(600));
    expect(pickCalls()).toHaveLength(1);
    expect(pickCalls()[0].body).toEqual({ attemptId: ATTEMPT, attemptToken: "TOKEN-9", questionId: twoOfThree.id, pick: [A.id, B.id] });
  });

  it("restores a saved pick on resume, with the chips showing it and Submit ready", () => {
    mount(choiceQ, stateFor(choiceQ, { pick: [V.id] }));
    expect(screen.getByRole("button", { name: new RegExp("^" + V.heading) }).getAttribute("aria-pressed")).toBe("true");
    type(words(60));
    expect(submitBtn().disabled).toBe(false);
  });

  it("sends the pick with the first try and nothing about it for a fixed pair", async () => {
    responder = (url) => (url === "/api/grade" ? new Promise(() => {}) : jsonRes({}));
    const { unmount } = mount(choiceQ, stateFor(choiceQ, { pick: [B.id] }));
    type(words(60));
    fireEvent.click(submitBtn());
    await waitFor(() => expect(gradeCalls()).toHaveLength(1));
    expect(gradeCalls()[0].body).toMatchObject({ attemptId: ATTEMPT, questionId: choiceQ.id, phase: 1, pick: [B.id] });
    unmount();
    cleanup();
    calls = [];
    mount(fixedQ);
    type(words(60));
    fireEvent.click(submitBtn());
    await waitFor(() => expect(gradeCalls()).toHaveLength(1));
    expect("pick" in gradeCalls()[0].body).toBe(false);
  });

  it("is read-only once the first try is marked: no chips to press, the pick named in words", async () => {
    responder = (url) =>
      url === "/api/grade"
        ? jsonRes({
            result: {
              questionId: choiceQ.id, type: "comparative", maxMarks: 6, phase: 1, marksAwarded: 3, skills: skillViews(["compares-texts"]),
              feedback: "Feedback.", biggestGap: "Compare throughout.", wordCount: 60, retryOffered: true, pick: [B.id],
            },
            saved: false, phaseSaved: true, attemptCompleted: false,
          })
        : jsonRes({});
    mount(choiceQ, stateFor(choiceQ, { pick: [B.id] }));
    type(words(60));
    fireEvent.click(submitBtn());
    await waitFor(() => expect(screen.getByText("3 / 6 marks")).toBeTruthy());
    expect(screen.queryByRole("group", { name: /Choose/ })).toBeNull();
    expect(screen.getByText("You wrote about")).toBeTruthy();
    const readonly = screen.getByLabelText("The texts you wrote about");
    expect(within(readonly).getAllByRole("listitem").map((li) => li.textContent?.replace("✓ ", ""))).toEqual([A.heading, B.heading]);
    // nine verdicts, the comparison skill missed, in words
    const list = screen.getByLabelText("Skill results");
    expect(within(list).getAllByText(/^(Met|Missed)$/)).toHaveLength(9);
    expect(within(list).getAllByText("Missed")).toHaveLength(1);
  });

  it("a resumed finished question shows the pick read-only and the one-pairing line with the model answer", () => {
    const state = stateFor(choiceQ, {
      stage: "discussion", pick: [V.id], pickLocked: true, ending: "full_marks", recordedMark: 6,
      try1: { text: "first try text", mark: 6, skills: skillViews(), feedback: "Good.", biggestGap: "", goFurther: "Go further.", wordCount: 60 },
      discussion: { modelAnswer: "MODEL-ANSWER-TEXT", modelWords: 2, pairing: [A.id, B.id] },
    });
    mount(choiceQ, state);
    expect(screen.queryByRole("group", { name: /Choose/ })).toBeNull();
    expect(screen.getByText(new RegExp(`This model answer shows one possible pairing \\(${A.heading} and ${B.heading}\\)`))).toBeTruthy();
    expect(screen.getByText(/Any allowed pairing can earn full marks/)).toBeTruthy();
  });

  it("shows no pairing line on a fixed pair", () => {
    const state = stateFor(fixedQ, {
      stage: "discussion", pickLocked: true, ending: "full_marks", recordedMark: 6,
      try1: { text: "first try text", mark: 6, skills: skillViews(), feedback: "Good.", biggestGap: "", goFurther: "Go further.", wordCount: 60 },
      discussion: { modelAnswer: "MODEL-ANSWER-TEXT", modelWords: 2 },
    });
    mount(fixedQ, state);
    expect(screen.queryByText(/one possible pairing/)).toBeNull();
  });
});

describe("taking a text away with the X on its tab", () => {
  const xBtn = (t: { heading: string }) => screen.queryByRole("button", { name: `Remove ${t.heading}` });

  it("'any TWO' of three: one text can go, the other two become the pick, and then no X is left", () => {
    mount(twoOfThree);
    expect(screen.getAllByRole("button", { name: /^Remove / })).toHaveLength(3);
    fireEvent.click(xBtn(A)!);
    expect(tabs().map((t) => t.textContent)).toEqual(expect.arrayContaining([expect.stringContaining(B.heading), expect.stringContaining(V.heading)]));
    expect(tabs()).toHaveLength(2);
    expect(screen.queryAllByRole("button", { name: /^Remove / })).toHaveLength(0);
    type(words(60));
    expect(submitBtn().disabled).toBe(false); // the two left are the pick
  });

  it("can be undone with 'Show it again'", () => {
    mount(twoOfThree);
    fireEvent.click(xBtn(A)!);
    fireEvent.click(screen.getByRole("button", { name: /Show it again/ }));
    expect(tabs()).toHaveLength(3);
  });

  it("a fixed pair has no X: both texts are required", () => {
    mount(fixedQ);
    expect(screen.queryAllByRole("button", { name: /^Remove / })).toHaveLength(0);
  });
});
