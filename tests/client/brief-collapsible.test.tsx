// @vitest-environment jsdom
//
// The brief on the writing screen is collapsible (spec 007 FR-006 review edit): open on Part 1,
// closed on Parts 2 to 5, free to toggle, never saved. The marking, correction and discussion
// screens keep the brief inside the closed "brief and model" row. Display only: the payload
// still carries the brief for every part.

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UNITS } from "@/content";
import { Quiz } from "@/components/Quiz";
import type { AttemptPayload } from "@/lib/drafts";
import { paragraphDiscussion, paragraphQuestionView } from "@/lib/grading.server";
import type { CriterionView, ParagraphState } from "@/lib/paragraph/types";
import type { ParagraphQuestion } from "@/lib/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/navigation", () => ({ reloadPage: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const UNIT = "y12-economics-paragraph-writing";
const qid = (part: number) => `${UNIT}.e01p${part}`;
const questionOf = (part: number) => UNITS.find((u) => u.id === UNIT)!.questions.find((q) => q.id === qid(part)) as ParagraphQuestion;
const crit = (met: string): CriterionView[] => (["a", "b", "c", "d"] as const).map((key) => ({ key, met: met.includes(key), reason: "Because." }));

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const mount = (part: number, state?: ParagraphState) =>
  render(
    <Quiz
      uid="u"
      attemptId="44444444-3a39-4a3e-8d5b-0b2f6f3c9d11"
      unitId={UNIT}
      initial={
        {
          attemptToken: "T",
          unitId: UNIT,
          passMark: 60,
          questions: [questionOf(part)],
          answered: {},
          paragraphState: state ?? { stage: "write", view: paragraphQuestionView(qid(part))! },
        } as AttemptPayload
      }
    />,
  );
const details = () => document.querySelector("details.pg-brief-details") as HTMLDetailsElement;
const summary = () => details().querySelector("summary") as HTMLElement;
const HELP = "The content in plain English — you do the writing";

/** jsdom fires `toggle` asynchronously after a summary click. */
async function toggle() {
  await act(async () => {
    fireEvent.click(summary());
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe("starting state follows the part", () => {
  it("Part 1 starts open and shows the plain-English line", () => {
    mount(1);
    expect(details().open).toBe(true);
    expect(summary().textContent).toContain("The brief");
    expect(summary().textContent).toContain(HELP);
    expect(summary().textContent).not.toContain("Use in this part: ");
  });

  it.each([2, 3, 4, 5])("Part %i starts closed and lists the fields it uses", (part) => {
    mount(part);
    expect(details().open).toBe(false);
    const view = paragraphQuestionView(qid(part))!;
    const labels: Record<string, string> = { economy: "Economy", argument: "Argument", counterpoint: "Counterpoint", chainSteps: "Chain steps", facts: "Facts", limitation: "Limitation" };
    const order = ["economy", "argument", "counterpoint", "chainSteps", "facts", "limitation"];
    const expected = order.filter((f) => view.uses.includes(f as never)).map((f) => labels[f]).join(" · ");
    expect(summary().textContent).toContain(`Use in this part: ${expected}`);
    expect(summary().textContent).not.toContain(HELP);
  });

  it("shows Part 3 as Chain steps · Facts", () => {
    mount(3);
    expect(screen.getByText("Use in this part: Chain steps · Facts")).toBeTruthy();
  });

  it("keeps the whole table in the page, every field, with the used ones marked, even when closed", () => {
    mount(3);
    expect(document.querySelectorAll(".pg-brief-row").length).toBe(6);
    expect(document.querySelectorAll(".pg-use-pill").length).toBe(paragraphQuestionView(qid(3))!.uses.length);
  });
});

describe("opening and closing", () => {
  it("toggles by click and swaps the right-hand text", async () => {
    mount(2);
    await toggle();
    expect(details().open).toBe(true);
    expect(summary().textContent).toContain(HELP);
    await toggle();
    expect(details().open).toBe(false);
    expect(summary().textContent).toContain("Use in this part: ");
  });

  it("closes Part 1 and reopens it", async () => {
    mount(1);
    await toggle();
    expect(details().open).toBe(false);
    expect(summary().textContent).toContain("Use in this part: ");
    await toggle();
    expect(details().open).toBe(true);
  });

  it("is a native, keyboard-operable summary: first child of details, focusable, no tabindex override", () => {
    mount(2);
    expect(details().firstElementChild).toBe(summary());
    expect(summary().tagName).toBe("SUMMARY");
    expect(summary().getAttribute("tabindex")).toBeNull();
    summary().focus();
    expect(document.activeElement).toBe(summary());
    // Enter and Space on a focused <summary> are the browser's own click: nothing to re-implement
    expect(summary().querySelector("h3")?.textContent).toBe("The brief");
    expect(summary().querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("an open brief keeps its state through an unrelated re-render (typing in the answer box)", async () => {
    mount(2);
    await toggle();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "some words here" } });
    expect(details().open).toBe(true);
  });
});

describe("reload and resume", () => {
  it("a toggled brief starts in the default state again on a fresh mount, and nothing is stored", async () => {
    const first = mount(2);
    await toggle();
    expect(details().open).toBe(true);
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.getItem("brief")).toBeNull();
    first.unmount();
    mount(2, { stage: "write", view: paragraphQuestionView(qid(2))!, draft1: "A saved draft" });
    expect(details().open).toBe(false);
    cleanup();
    mount(1);
    await toggle();
    cleanup();
    mount(1);
    expect(details().open).toBe(true);
  });
});

describe("the other screens are unchanged", () => {
  const phase1 = { text: "My first try", mark: 2, criteria: crit("ad"), feedback: "Make them argue.", wordCount: 3 };

  it("the correction screen has no collapsible brief, only the closed brief-and-model row", () => {
    mount(3, { stage: "correct", view: paragraphQuestionView(qid(3))!, phase1 });
    expect(details()).toBeNull();
    const row = document.querySelector("details.pg-collapse") as HTMLDetailsElement;
    expect(row.open).toBe(false);
    expect(row.querySelector("summary")?.textContent).toBe("The brief and the model paragraph so far");
    expect(row.querySelectorAll(".pg-brief-row").length).toBe(6);
    expect(row.textContent).toContain(HELP);
  });

  it("the discussion screen has no collapsible brief", () => {
    mount(3, {
      stage: "discussion",
      view: paragraphQuestionView(qid(3))!,
      ending: "full_marks",
      recordedMark: 4,
      mode: "marker",
      phase1: { ...phase1, mark: 4, criteria: crit("abcd") },
      discussion: paragraphDiscussion(qid(3))!,
    });
    expect(details()).toBeNull();
  });
});

describe("what reaches the browser is unchanged", () => {
  it.each([1, 2, 3, 4, 5])("Part %i's question view still carries the full brief and its used fields", (part) => {
    const view = paragraphQuestionView(qid(part))!;
    expect(Object.keys(view.brief).sort()).toEqual(["argument", "chainSteps", "counterpoint", "economy", "facts", "limitation"]);
    expect(view.uses.length).toBeGreaterThan(0);
  });
});
