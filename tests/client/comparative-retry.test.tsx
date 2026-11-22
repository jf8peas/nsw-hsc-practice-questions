// @vitest-environment jsdom
//
// The comparative unit's result, retry and discussion in the browser (spec 009 FR-018, FR-035, task T041): a tip card
// per skill missed on the first try (the comparison skills included), the pick read-only on the retry and never sent
// with it, the retry starting from the first try, the decline, the result summary taking focus, the live status naming
// nine skills, and the discussion's one-pairing line for a choice question only.

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Quiz } from "@/components/Quiz";
import { storeTexts } from "@/content/units/y12-english-advanced-unseen-texts/store-texts";
import type { ComparativeState } from "@/lib/comparative/types";
import type { AttemptPayload } from "@/lib/drafts";
import type { ComparativeQuestion } from "@/lib/types";
import { COMPARATIVE_SKILL_IDS, comparativeSkillById } from "@/lib/unseen/skills";

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
const ATTEMPT = "66666666-3a39-4a3e-8d5b-0b2f6f3c9d11";
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

const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");
const skillViews = (missed: string[] = []) => COMPARATIVE_SKILL_IDS.map((id) => ({ id, met: !missed.includes(id), reason: `reason for ${id}` }));
const MODEL = "MODEL-ANSWER-TEXT shown at the discussion only";
const tryView = (mark: number, missed: string[] = [], text = "my first try text") => ({
  text, mark, skills: skillViews(missed), feedback: "Feedback on the first try.", biggestGap: "Compare throughout.", goFurther: mark === 6 ? "Go further." : null, wordCount: 4,
});

const stateFor = (q: ComparativeQuestion, extra: Partial<ComparativeState> = {}): ComparativeState => ({
  stage: "choice", texts: q.textIds.map((id) => storeTexts.find((t) => t.id === id)!), pickLocked: true, try1: tryView(3, ["compares-texts"]), retryOffered: true, ...extra,
});
const payloadFor = (q: ComparativeQuestion, state: ComparativeState): AttemptPayload => ({
  attemptToken: "TOKEN-7", unitId: UNIT, passMark: 60, questions: [q], answered: {}, comparativeState: state,
});

type FetchCall = { url: string; body: Record<string, unknown> };
let calls: FetchCall[];
let responder: (url: string, body: Record<string, unknown>) => Response | Promise<Response>;
const jsonRes = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
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
  vi.unstubAllGlobals();
});

const mount = (q: ComparativeQuestion, state: ComparativeState) => render(<Quiz uid={UID} attemptId={ATTEMPT} unitId={UNIT} initial={payloadFor(q, state)} />);
const box = () => screen.getByRole("textbox") as HTMLTextAreaElement;
const gradeCalls = () => calls.filter((c) => c.url === "/api/grade");

describe("the result and the retry choice", () => {
  it("shows the mark, nine verdicts in words, the pick read-only, and the retry choice", () => {
    mount(choiceQ, stateFor(choiceQ, { pick: [B.id] }));
    expect(screen.getByText("3 / 6 marks")).toBeTruthy();
    const list = screen.getByLabelText("Skill results");
    expect(within(list).getAllByText(/^(Met|Missed)$/)).toHaveLength(9);
    expect(within(list).getByText(comparativeSkillById("compares-texts").name)).toBeTruthy();
    expect(within(list).getByText(comparativeSkillById("treats-both-in-depth").name)).toBeTruthy();
    expect(screen.queryByRole("group", { name: /Choose/ })).toBeNull();
    expect(screen.getByText("You wrote about")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("takes focus on the result summary", () => {
    mount(fixedQ, stateFor(fixedQ));
    expect(document.activeElement).toBe(document.querySelector(".un-result-top"));
  });
});

describe("the retry", () => {
  it("opens with a tip card for each skill missed on the first try, comparison skills included, from the same wording as 'Things I need to know'", () => {
    mount(fixedQ, stateFor(fixedQ, { try1: tryView(2, ["compares-texts", "treats-both-in-depth", "apt-evidence"]) }));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    const tips = document.querySelector(".un-tips") as HTMLElement;
    for (const id of ["compares-texts", "treats-both-in-depth", "apt-evidence"] as const) {
      expect(within(tips).getByText(comparativeSkillById(id).name)).toBeTruthy();
      expect(within(tips).getByText(comparativeSkillById(id).tip)).toBeTruthy();
    }
    expect(within(tips).queryByText(comparativeSkillById("succinct").name)).toBeNull();
  });

  it("starts from the first try's text, keeps the pick read-only and sends no pick with the retry", async () => {
    mount(choiceQ, stateFor(choiceQ, { pick: [B.id], try1: tryView(3, ["compares-texts"], words(40)) }));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(box().value).toBe(words(40));
    expect(screen.queryByRole("group", { name: /Choose/ })).toBeNull();
    expect(screen.getByText("You wrote about")).toBeTruthy();
    fireEvent.change(box(), { target: { value: words(60) } });
    responder = (url) => (url === "/api/grade" ? new Promise(() => {}) : jsonRes({}));
    fireEvent.click(screen.getByRole("button", { name: /Submit for marking/ }));
    await waitFor(() => expect(gradeCalls()).toHaveLength(1));
    expect(gradeCalls()[0].body).toMatchObject({ phase: 2, questionId: choiceQ.id });
    expect("pick" in gradeCalls()[0].body).toBe(false);
  });

  it("announces marking in a live status that names the nine skills, and locks the answer", async () => {
    mount(fixedQ, stateFor(fixedQ, { stage: "retry", draft2: words(60) }));
    responder = (url) => (url === "/api/grade" ? new Promise(() => {}) : jsonRes({}));
    fireEvent.click(screen.getByRole("button", { name: /Submit for marking/ }));
    await waitFor(() => expect(screen.getByRole("status")).toBeTruthy());
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(document.body.textContent).toMatch(/nine skills/);
  });
});

describe("declining", () => {
  it("posts only the attempt, the question and the token, and shows the discussion with the pairing line on a choice question", async () => {
    responder = (url) =>
      url === "/api/unseen/decline"
        ? jsonRes({
            result: {
              questionId: choiceQ.id, type: "comparative", maxMarks: 6, phase: 1, marksAwarded: 3, recordedMark: 3, ending: "declined", skills: skillViews(["compares-texts"]),
              feedback: "Feedback.", biggestGap: "Compare throughout.", wordCount: 4, try1: tryView(3, ["compares-texts"]), pick: [B.id],
              discussion: { modelAnswer: MODEL, modelWords: 7, pairing: [A.id, B.id] },
            },
            saved: true, attemptCompleted: true,
          })
        : jsonRes({});
    mount(choiceQ, stateFor(choiceQ, { pick: [B.id] }));
    fireEvent.click(screen.getByRole("button", { name: /Skip the retry and see the model answer/ }));
    await waitFor(() => expect(screen.getByText(MODEL, { exact: false })).toBeTruthy());
    const decline = calls.find((c) => c.url === "/api/unseen/decline")!;
    expect(Object.keys(decline.body).sort()).toEqual(["attemptId", "attemptToken", "questionId"]);
    expect(screen.getByText(new RegExp(`This model answer shows one possible pairing \\(${A.heading} and ${B.heading}\\)`))).toBeTruthy();
    expect(screen.getByText(/Any allowed pairing can earn full marks/)).toBeTruthy();
    expect(screen.getByText("You skipped the retry, so your first try is recorded: 3 / 6.")).toBeTruthy();
  });
});
