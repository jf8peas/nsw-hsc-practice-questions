// @vitest-environment jsdom
//
// The browser side of the unseen-text unit (spec 008): the question screen (text, question, box,
// meter and length rules), the locked marking state with the text never cleared, the result and the
// retry choice, the retry with its tip cards, the discussion, the two plain "not marked" notices (no
// self-marking, no mark), the decline, and resume.

import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UNITS } from "@/content";
import { Quiz } from "@/components/Quiz";
import type { AttemptPayload } from "@/lib/drafts";
import type { UnseenQuestion } from "@/lib/types";
import { SKILL_IDS, skillById, type SkillId } from "@/lib/unseen/skills";
import type { TryView, UnseenGradeResult, UnseenState } from "@/lib/unseen/types";

const push = vi.fn();
const reload = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));
vi.mock("@/lib/navigation", () => ({ reloadPage: () => reload() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const UID = "6f0b6a53-3a39-4a3e-8d5b-0b2f6f3c9d11";
const ATTEMPT = "44444444-3a39-4a3e-8d5b-0b2f6f3c9d11";
const UNIT = "y12-english-advanced-unseen-texts";
const unit = UNITS.find((u) => u.id === UNIT)!;
const question = unit.questions.find((q) => q.type === "unseen") as UnseenQuestion;
const text = unit.texts!.find((t) => t.id === question.textId)!;
const GO_FURTHER = "GO-FURTHER-SENTENCE end on what the image suggests about families";
const MODEL = "MODEL-ANSWER-TEXT the model answer, released at the discussion only";

const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");
const skills = (missed: SkillId[] = []) => SKILL_IDS.map((id) => ({ id, met: !missed.includes(id), reason: `reason for ${id}` }));
const tryView = (mark: number, missed: SkillId[] = [], t = "first try text here"): TryView => ({
  text: t, mark, skills: skills(missed), feedback: "Feedback on the first try.", biggestGap: "Explain the effect of each technique.", goFurther: mark === 3 ? GO_FURTHER : null, wordCount: 4,
});

const payloadFor = (state: UnseenState): AttemptPayload => ({
  attemptToken: "TOKEN-1", unitId: UNIT, passMark: 60, questions: [question], answered: {}, unseenState: state,
});
const writeState = (extra: Partial<UnseenState> = {}): UnseenState => ({ stage: "write", text, ...extra });
const choiceState = (extra: Partial<UnseenState> = {}): UnseenState => ({
  stage: "choice", text, try1: tryView(1, ["technique-effect", "apt-evidence"]), retryOffered: true, ...extra,
});

type FetchCall = { url: string; body: Record<string, unknown> };
let calls: FetchCall[];
let responder: (url: string, body: Record<string, unknown>) => Response | Promise<Response>;
const jsonRes = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

beforeEach(() => {
  calls = [];
  push.mockReset();
  reload.mockReset();
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
  vi.unstubAllGlobals();
});

const mount = (state: UnseenState = writeState()) =>
  render(<Quiz uid={UID} attemptId={ATTEMPT} unitId={UNIT} initial={payloadFor(state)} />);
const box = () => screen.getByRole("textbox") as HTMLTextAreaElement;
const type = (value: string) => fireEvent.change(box(), { target: { value } });
const submitBtn = () => screen.getByRole("button", { name: /Submit for marking/ }) as HTMLButtonElement;
const gradeCalls = () => calls.filter((c) => c.url === "/api/grade");

const belowResult = (over: Partial<UnseenGradeResult> = {}): UnseenGradeResult => ({
  questionId: question.id, type: "unseen", maxMarks: 3, phase: 1, marksAwarded: 1,
  skills: skills(["technique-effect", "apt-evidence"]), feedback: "Feedback on the first try.", biggestGap: "Explain the effect of each technique.",
  wordCount: 60, retryOffered: true, ...over,
});
const fullResult = (over: Partial<UnseenGradeResult> = {}): UnseenGradeResult => ({
  ...belowResult({ marksAwarded: 3, skills: skills(), retryOffered: undefined }),
  goFurther: GO_FURTHER, recordedMark: 3, ending: "full_marks", discussion: { modelAnswer: MODEL, modelWords: 12 }, ...over,
});

describe("the question screen", () => {
  it("shows the text first, then the question with its marks and credit, then the answer box", () => {
    const { container } = mount();
    const textCol = container.querySelector(".un-text")!;
    const q = container.querySelector(".un-q")!;
    expect(textCol.compareDocumentPosition(q) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(textCol as HTMLElement).getByText(text.heading)).toBeTruthy();
    expect(screen.getByText(question.prompt)).toBeTruthy();
    expect(screen.getByText(`${question.maxMarks} marks`)).toBeTruthy();
    expect(screen.getByText(question.source!)).toBeTruthy();
    expect(box().placeholder).toBe("Write your answer here…");
    expect(screen.getByText(`0 / ${question.suggestedWords} words`)).toBeTruthy();
  });

  it("has no timer, countdown or auto-submit", () => {
    const { container } = mount();
    expect(container.querySelector('[role="timer"], time')).toBeNull();
    expect(container.textContent).not.toMatch(/countdown|time left|minutes left|reading time/i);
  });

  it("is one column: no two-column layout wrapper or sticky text column", () => {
    const { container } = mount();
    expect(container.querySelector(".un-layout, .un-text-col")).toBeNull();
    expect(container.querySelector(".un-card")!.children[0].classList.contains("un-text")).toBe(true);
  });

  it("has no View button and no text sheet; the text opens in a new tab from an icon link", () => {
    mount();
    expect(screen.queryByRole("button", { name: /^View / })).toBeNull();
    expect(document.querySelector("dialog.un-sheet")).toBeNull();
    expect(screen.getByRole("link", { name: `Open ${text.heading} in a new tab` })).toBeTruthy();
  });

  it.each([
    ["write", () => writeState()],
    ["retry choice", () => choiceState()],
    ["retry", () => ({ stage: "retry", text, try1: tryView(1, ["technique-effect"]), draft2: "my retry so far" }) as UnseenState],
    ["discussion", () => ({ stage: "discussion", text, try1: tryView(3), ending: "full_marks", recordedMark: 3, discussion: { modelAnswer: MODEL, modelWords: 12 } }) as UnseenState],
  ])("shows the open-in-a-new-tab link beside the heading at the %s stage", (_stage, state) => {
    const { container } = mount(state());
    const link = screen.getByRole("link", { name: `Open ${text.heading} in a new tab` }) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe(`/unit/${UNIT}/text/${text.id}?attempt=${ATTEMPT}`); // the attempt id keeps highlights per attempt
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(link.getAttribute("title")).toBe(`Open ${text.heading} in a new tab`);
    expect(link.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
    expect(link.closest(".un-text-top")).toBeTruthy(); // beside the heading
    expect(container.querySelectorAll(".un-open")).toHaveLength(1);
  });
});

describe("highlighting in the quiz (spec 008 FR-006a)", () => {
  it("has the Highlight toggle in the text heading at every stage, off by default", () => {
    for (const state of [writeState(), choiceState(), { stage: "discussion", text, try1: tryView(3), ending: "full_marks", recordedMark: 3, discussion: { modelAnswer: MODEL, modelWords: 12 } } as UnseenState]) {
      mount(state);
      const btn = screen.getByRole("button", { name: "Highlight" });
      expect(btn.getAttribute("aria-pressed")).toBe("false");
      expect(btn.closest(".un-text-top")).toBeTruthy();
      cleanup();
    }
  });

  it("turning highlighting on leaves focus in the answer box, and typing there works and highlights nothing", () => {
    mount();
    box().focus();
    expect(fireEvent.mouseDown(screen.getByRole("button", { name: "Highlight" }))).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Highlight" }));
    expect(document.activeElement).toBe(box());
    type("some words typed while highlighting is on");
    expect(box().value).toBe("some words typed while highlighting is on");
    expect(document.querySelectorAll("mark.un-hl")).toHaveLength(0);
  });

  it("keeps the answer box and the question outside the highlightable text", () => {
    const { container } = mount();
    const body = container.querySelector(".un-text-body")!;
    expect(body.contains(box())).toBe(false);
    expect(body.contains(container.querySelector(".un-q"))).toBe(false);
  });
});

describe("the length rules", () => {
  it("disables Submit under 20 words with the reason, and enables it at 20", () => {
    mount();
    type(words(19));
    expect(submitBtn().disabled).toBe(true);
    expect(screen.getByText("Write at least 20 words before you submit.")).toBeTruthy();
    type(words(20));
    expect(submitBtn().disabled).toBe(false);
  });

  it("warns above the suggested length without blocking, and blocks more than 20% over until the answer is cut", () => {
    mount();
    const over = question.suggestedWords + 5;
    type(words(over));
    expect(submitBtn().disabled).toBe(false);
    expect(screen.getByText("About 5 words over the suggested length. Tighten it if you can.")).toBeTruthy();
    const max = Math.floor((question.suggestedWords * 12) / 10);
    type(words(max));
    expect(submitBtn().disabled).toBe(false);
    type(words(max + 1));
    expect(submitBtn().disabled).toBe(true);
    expect(screen.getByText("1 words over the limit. Cut it to submit.")).toBeTruthy();
    type(words(max - 3));
    expect(submitBtn().disabled).toBe(false);
  });

  it("makes no request when Submit is blocked", () => {
    mount();
    type(words(5));
    fireEvent.click(submitBtn());
    expect(gradeCalls()).toHaveLength(0);
  });
});

describe("marking the first try", () => {
  it("locks the text with timed status steps, then shows the mark, feedback, biggest gap and seven verdicts", async () => {
    const d = deferred<Response>();
    responder = (url) => (url === "/api/grade" ? d.promise : jsonRes({}));
    mount();
    type(words(60));
    fireEvent.click(submitBtn());
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Reading your answer"));
    expect(document.querySelector(".rw-locked-text")!.textContent).toBe(words(60));
    expect(screen.getByText("Marking can take up to a minute.")).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(gradeCalls()[0].body).toMatchObject({ attemptId: ATTEMPT, questionId: question.id, phase: 1, answer: words(60) });
    await act(async () => d.resolve(jsonRes({ result: belowResult(), saved: false, phaseSaved: true, attemptCompleted: false })));

    await waitFor(() => expect(screen.getByText("1 / 3 marks")).toBeTruthy());
    expect(screen.getByText("Feedback on the first try.")).toBeTruthy();
    expect(screen.getByText("Explain the effect of each technique.")).toBeTruthy();
    const list = screen.getByLabelText("Skill results");
    expect(within(list).getAllByText(/^(Met|Missed)$/)).toHaveLength(7);
    expect(within(list).getAllByText("Missed")).toHaveLength(2);
    expect(within(list).getByText(skillById("technique-effect").name)).toBeTruthy();
    expect(within(list).getByText("reason for technique-effect")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Skip the retry and see the model answer/ })).toBeTruthy();
    expect(document.body.textContent).not.toContain("MODEL-ANSWER-TEXT");
  });

  it("takes focus on the result summary when it appears", async () => {
    responder = (url) => (url === "/api/grade" ? jsonRes({ result: belowResult() }) : jsonRes({}));
    mount();
    type(words(60));
    fireEvent.click(submitBtn());
    await waitFor(() => expect(screen.getByText("1 / 3 marks")).toBeTruthy());
    expect(document.activeElement).toBe(document.querySelector(".un-result-top"));
  });

  it("goes straight to the discussion on full marks: no retry choice, the model answer beside the answer", async () => {
    responder = (url) => (url === "/api/grade" ? jsonRes({ result: fullResult(), saved: true, attemptCompleted: true }) : jsonRes({}));
    mount();
    type(words(60));
    fireEvent.click(submitBtn());
    await waitFor(() => expect(screen.getByText("3 / 3 marks")).toBeTruthy());
    expect(screen.getByText("Full marks on your first try.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(screen.getByText(MODEL)).toBeTruthy();
    expect(screen.getByText(words(60))).toBeTruthy();
    expect(screen.getAllByText("First try")).toHaveLength(7);
    expect(screen.queryByRole("button", { name: "This mark seems wrong" })).toBeNull();
    expect(document.activeElement).toBe(document.querySelector(".un-summary"));
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(push).toHaveBeenCalledWith(`/unit/${UNIT}`);
  });
});

describe("a repeat quiz", () => {
  const NOTICE = "You've answered every question. Questions now repeat, starting with the ones you found hardest.";
  it("shows the repeat notice above the question, and not for a first-time question or at the discussion", () => {
    mount(writeState({ repeating: true }));
    expect(screen.getByText(NOTICE)).toBeTruthy();
    cleanup();
    mount(writeState());
    expect(screen.queryByText(NOTICE)).toBeNull();
    cleanup();
    mount({ stage: "discussion", text, try1: tryView(3), ending: "full_marks", recordedMark: 3, discussion: { modelAnswer: MODEL, modelWords: 12 }, repeating: true });
    expect(screen.queryByText(NOTICE)).toBeNull();
  });
});

describe("Make it even stronger", () => {
  it("shows after the seven skill pills and before the answer comparison of a full-mark first try, as a green panel", async () => {
    responder = (url) => (url === "/api/grade" ? jsonRes({ result: fullResult(), saved: true, attemptCompleted: true }) : jsonRes({}));
    mount();
    type(words(60));
    fireEvent.click(submitBtn());
    await waitFor(() => expect(screen.getByText("3 / 3 marks")).toBeTruthy());
    const label = screen.getByText("Make it even stronger");
    const panel = label.closest(".un-go-further") as HTMLElement;
    expect(panel.textContent).toContain(GO_FURTHER);
    expect(label.className).toContain("un-go-further-label");
    const pills = document.querySelector(".un-pills")!;
    const compare = document.querySelector(".un-compare")!;
    expect(pills.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(panel.compareDocumentPosition(compare) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText("To go further")).toBeNull();
    expect(screen.queryByText("Biggest gap")).toBeNull();
  });

  it("shows on the result card for a full-mark try, and never for a below-full one", async () => {
    responder = (url) => (url === "/api/grade" ? jsonRes({ result: belowResult({ goFurther: GO_FURTHER }) }) : jsonRes({}));
    mount();
    type(words(60));
    fireEvent.click(submitBtn());
    await waitFor(() => expect(screen.getByText("1 / 3 marks")).toBeTruthy());
    expect(screen.queryByText("Make it even stronger")).toBeNull();
    expect(document.body.textContent).not.toContain(GO_FURTHER);
    expect(screen.getByText("Biggest gap")).toBeTruthy();
  });

  it("is not shown in a retry discussion, whose recorded try is below full marks", () => {
    mount({
      stage: "discussion", text, try1: tryView(1, ["technique-effect"]), try2: { ...tryView(2), goFurther: GO_FURTHER }, ending: "retried",
      recordedMark: 2, discussion: { modelAnswer: MODEL, modelWords: 12 },
    });
    expect(screen.queryByText("Make it even stronger")).toBeNull();
  });
});

describe("a try that comes back unmarked: no mark, no self-marking, the text kept", () => {
  it("marker unavailable on the first try: the editable box returns holding the text, with a plain notice", async () => {
    responder = (url) => (url === "/api/grade" ? jsonRes({ notMarked: { reason: "marker_unavailable", phase: 1 }, saved: false }) : jsonRes({}));
    mount();
    type(words(60));
    fireEvent.click(submitBtn());
    await waitFor(() => expect(screen.getByText(/We couldn’t mark your answer just now/)).toBeTruthy());
    expect(box().value).toBe(words(60));
    expect(submitBtn().disabled).toBe(false);
    expect(document.body.textContent).not.toMatch(/tick|mark it yourself|self-mark|model answer/i);
    expect(screen.getByRole("status").textContent).toContain("try again in a moment");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("daily limit on the first try: come back tomorrow, the text stays, Submit is disabled", async () => {
    responder = (url) =>
      url === "/api/grade"
        ? jsonRes({ notMarked: { reason: "daily_limit", phase: 1, resetsAt: "2026-11-20T00:00:00+11:00" }, saved: false })
        : jsonRes({});
    mount();
    type(words(60));
    fireEvent.click(submitBtn());
    await waitFor(() => expect(screen.getByText(/You’ve reached today’s marking limit/)).toBeTruthy());
    expect(screen.getByText(/Come back tomorrow \(from midnight Sydney time, Fri 20 Nov\)/)).toBeTruthy();
    expect(box().value).toBe(words(60));
    expect(submitBtn().disabled).toBe(true);
    expect(screen.getByText("Submit is off until marking is available again tomorrow.")).toBeTruthy();
  });

  it("starts with Submit disabled when the server says the day's allowance is used up", () => {
    mount(writeState({ dailyLimit: { reached: true, resetsAt: "2026-11-20T00:00:00+11:00" }, draft1: words(60) }));
    expect(box().value).toBe(words(60));
    expect(submitBtn().disabled).toBe(true);
    expect(screen.getByText(/reached today’s marking limit/)).toBeTruthy();
  });

  it.each([
    ["a rate limit", () => jsonRes({ error: "rate_limited", retryAfter: 5 }, 429), /marking too fast/],
    ["a server error", () => jsonRes({ error: "temporarily_unavailable" }, 503), /Marking didn’t work this time/],
  ])("%s returns the box with the text and the usual error line", async (_label, make, message) => {
    responder = (url) => (url === "/api/grade" ? make() : jsonRes({}));
    mount();
    type(words(60));
    fireEvent.click(submitBtn());
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(message));
    expect(box().value).toBe(words(60));
  });

  it("a request that never reached the server returns the box with the text and the offline line", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    mount();
    type(words(60));
    fireEvent.click(submitBtn());
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/Could not reach the server/));
    expect(box().value).toBe(words(60));
  });

  it("a 409 (another tab already marked it) reloads to the stored state", async () => {
    responder = (url) => (url === "/api/grade" ? jsonRes({ error: "already_answered", result: belowResult() }, 409) : jsonRes({}));
    mount();
    type(words(60));
    fireEvent.click(submitBtn());
    await waitFor(() => expect(reload).toHaveBeenCalled());
  });
});

describe("the retry", () => {
  it("opens pre-filled with the first try, focused with the caret at the end, with one tip card per missed skill and no model text", () => {
    mount(choiceState());
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(box().value).toBe("first try text here");
    expect(document.activeElement).toBe(box());
    expect(box().selectionStart).toBe("first try text here".length);
    const tips = screen.getByRole("region", { name: "Fix these in your retry" });
    expect(within(tips).getByText(skillById("technique-effect").name)).toBeTruthy();
    expect(within(tips).getByText(skillById("technique-effect").tip)).toBeTruthy();
    expect(within(tips).getByText(skillById("apt-evidence").name)).toBeTruthy();
    expect(tips.querySelectorAll(".un-tip")).toHaveLength(2);
    expect(document.body.textContent).not.toContain("MODEL-ANSWER-TEXT");
    expect(screen.getByRole("button", { name: /Skip the retry and see the model answer/ })).toBeTruthy();
  });

  it("marks the retry as phase 2 and shows the capped discussion: pills, cap line, first try collapsed", async () => {
    responder = (url) =>
      url === "/api/grade"
        ? jsonRes({
            result: {
              ...fullResult({ phase: 2, marksAwarded: 2, recordedMark: 2, ending: "retried", skills: skills(["apt-evidence"]), wordCount: 70 }),
              try1: tryView(1, ["technique-effect", "apt-evidence"]),
            },
            saved: true,
            attemptCompleted: true,
          })
        : jsonRes({});
    mount(choiceState());
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    type(words(70));
    fireEvent.click(submitBtn());
    await waitFor(() => expect(screen.getByText("2 / 3 marks")).toBeTruthy());
    expect(gradeCalls()[0].body).toMatchObject({ phase: 2, answer: words(70) });
    expect(screen.getByText("A retry can earn at most 2 out of 3. Meet every skill on the first try next time for the full 3.")).toBeTruthy();
    expect(screen.getAllByText("First try")).toHaveLength(5);
    expect(screen.getAllByText("Fixed in retry")).toHaveLength(1);
    expect(screen.getAllByText("Missed")).toHaveLength(1);
    expect(screen.getByText(MODEL)).toBeTruthy();
    const added = screen.getByRole("region", { name: "Added to Things I need to know" });
    expect(within(added).getByText(skillById("technique-effect").name)).toBeTruthy();
    expect(within(added).getByText(skillById("apt-evidence").name)).toBeTruthy();
    expect(within(added).getAllByText("2 to go")).toHaveLength(2);
    const collapsed = document.querySelector("details.un-collapse") as HTMLDetailsElement;
    expect(collapsed.open).toBe(false);
    expect(collapsed.textContent).toContain("first try text here");
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("a retry the marker cannot mark returns the box with the retry text; the first try is not recorded", async () => {
    responder = (url) => (url === "/api/grade" ? jsonRes({ notMarked: { reason: "marker_unavailable", phase: 2 }, saved: false }) : jsonRes({}));
    mount(choiceState());
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    type(words(70));
    fireEvent.click(submitBtn());
    await waitFor(() => expect(screen.getByText(/We couldn’t mark your answer just now/)).toBeTruthy());
    expect(box().value).toBe(words(70));
    expect(screen.queryByText(/recorded/i)).toBeNull();
    expect(screen.getByRole("button", { name: /Skip the retry and see the model answer/ })).toBeTruthy();
  });

  it("at the daily limit the retry's Submit is disabled but the retry can still be skipped", async () => {
    mount({ ...choiceState(), stage: "retry", draft2: words(70), dailyLimit: { reached: true, resetsAt: "2026-11-20T00:00:00+11:00" } });
    expect(box().value).toBe(words(70));
    expect(submitBtn().disabled).toBe(true);
    expect(screen.getByText(/reached today’s marking limit/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /Skip the retry and see the model answer/ }) as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("declining the retry", () => {
  it("records the first try and shows the discussion with the model answer", async () => {
    responder = (url) =>
      url === "/api/unseen/decline"
        ? jsonRes({ result: { ...fullResult({ marksAwarded: 1, recordedMark: 1, ending: "declined", skills: skills(["technique-effect", "apt-evidence"]) }), try1: tryView(1, ["technique-effect", "apt-evidence"]) }, saved: true })
        : jsonRes({});
    mount(choiceState());
    fireEvent.click(screen.getByRole("button", { name: /Skip the retry and see the model answer/ }));
    await waitFor(() => expect(screen.getByText("1 / 3 marks")).toBeTruthy());
    expect(calls.find((c) => c.url === "/api/unseen/decline")!.body).toEqual({ attemptId: ATTEMPT, attemptToken: "TOKEN-1", questionId: question.id });
    expect(screen.getByText("You skipped the retry, so your first try is recorded: 1 / 3.")).toBeTruthy();
    expect(screen.getByText(MODEL)).toBeTruthy();
    expect(document.querySelector("details.un-collapse")).toBeNull();
  });
});

describe("resume", () => {
  it("restores a saved first draft at the write stage", () => {
    mount(writeState({ draft1: "A half-written answer" }));
    expect(box().value).toBe("A half-written answer");
  });

  it("opens at the retry choice with the first try's result and no model answer", () => {
    mount(choiceState());
    expect(screen.getByText("1 / 3 marks")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(document.body.textContent).not.toContain("MODEL-ANSWER-TEXT");
  });
});
