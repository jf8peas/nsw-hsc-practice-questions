// The attempt detail page for an unseen-text question (spec 008, research R13): the stimulus text, each
// try with its seven verdicts and reasons, the feedback and the biggest gap, the recorded mark, and
// the model answer only once the question is final. Never the criteria, notes or a description.

import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getAnswer } from "@/content/answers";
import { unseenPhases, type SkillVerdicts } from "@/lib/db/schema";
import { SKILL_IDS } from "@/lib/unseen/skills";

import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedResult, seedUser } from "../helpers/fixtures";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh: () => {}, push: vi.fn() }),
  usePathname: () => "/",
}));

let env: TestEnv;
afterEach(async () => {
  await env?.close();
});

const UNIT = "y12-english-advanced-unseen-texts";
const QID = `${UNIT}.fs25-q1`;
const verdicts = (missed: string[] = []): SkillVerdicts =>
  Object.fromEntries(SKILL_IDS.map((id) => [id, { met: !missed.includes(id), reason: missed.includes(id) ? "REASON-MISSED-7001" : "REASON-MET-7002" }])) as SkillVerdicts;

function findAll(node: ReactNode, match: (el: ReactElement) => boolean, out: ReactElement[] = []) {
  if (Array.isArray(node)) node.forEach((n) => findAll(n, match, out));
  else if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    if (match(el)) out.push(el);
    findAll(el.props.children, match, out);
  }
  return out;
}
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node as ReactElement<{ children?: ReactNode }>).props.children);
  return "";
}

/** The page's own text plus the static markup of its unseen detail elements (the shell is async). */
async function render(attemptId: string) {
  const Page = (await import("@/app/attempts/[attemptId]/page")).default;
  const tree = await Page({ params: Promise.resolve({ attemptId }) });
  const detail = findAll(tree, (el) => typeof el.type === "function" && (el.type as { name?: string }).name === "UnseenAttemptDetailView");
  return textOf(tree) + detail.map((el) => renderToStaticMarkup(createElement(el.type as never, el.props as never))).join("");
}

async function seeded(opts: { final: boolean; retried?: boolean }) {
  env = await setupTestEnv();
  const me = await seedUser(env.db);
  env.signedInAs(asSessionUser(me));
  const attempt = await seedAttempt(env.db, me.id, { unitId: UNIT, questionIds: [QID], completedAt: opts.final ? new Date() : null });
  await env.db.insert(unseenPhases).values({
    attemptId: attempt.id, userId: me.id, unitId: UNIT, questionId: QID, maxMarks: 3,
    status: opts.final ? "final" : "try1",
    ...(opts.final ? { ending: opts.retried ? "retried" : "declined", recordedMark: opts.retried ? 2 : 1 } : {}),
    try1Text: "FIRST-TRY-TEXT the poem uses repetition", try1Mark: 1, try1Verdicts: verdicts(["technique-effect"]),
    try1Feedback: "Name the effect.", try1BiggestGap: "GAP-TEXT-9930", try1PromptVersion: "unseen-pilot-4", try1Model: "m",
    ...(opts.retried
      ? { try2Text: "RETRY-TEXT the repetition shows resistance", try2Mark: 2, try2Verdicts: verdicts(), try2Feedback: "Better.", try2BiggestGap: "Add a quotation.", try2PromptVersion: "unseen-pilot-4", try2Model: "m" }
      : {}),
    flaggedAt: opts.final ? new Date() : null,
  });
  if (opts.final) {
    await seedResult(env.db, { attemptId: attempt.id, userId: me.id }, { unitId: UNIT, questionId: QID, answer: "x", marksAwarded: opts.retried ? 2 : 1, maxMarks: 3, gradedBy: "llm", feedback: "x" });
  }
  return attempt;
}

describe("unseen attempt detail", () => {
  it("shows the paper, both tries with their verdicts, reasons, feedback and gap, the recorded mark and the flag", async () => {
    const attempt = await seeded({ final: true, retried: true });
    const html = await render(attempt.id);
    expect(html).toContain("Fort St 2025 · Q1");
    expect(html).toContain("First try · 1/3");
    expect(html).toContain("Retry · 2/2");
    expect(html).toContain("FIRST-TRY-TEXT the poem uses repetition");
    expect(html).toContain("RETRY-TEXT the repetition shows resistance");
    expect(html).toContain("REASON-MISSED-7001");
    expect(html).toContain("REASON-MET-7002");
    expect(html).toContain("Biggest gap: GAP-TEXT-9930");
    expect(html).toContain("Recorded 2/3 · flagged for your teacher");
  });

  it("shows the model answer for a final question, and says when the retry was skipped", async () => {
    const attempt = await seeded({ final: true });
    const html = await render(attempt.id);
    expect(html).toContain("You skipped the retry, so your first try is recorded.");
    const model = getAnswer(QID)!.unseen!.model;
    expect(html).toContain(model.slice(0, 30).replace(/’/g, "&#x27;").replace(/'/g, "&#x27;").slice(0, 20));
  });

  it("shows NO model answer, criteria or notes for an unfinished attempt", async () => {
    const attempt = await seeded({ final: false });
    const html = await render(attempt.id);
    const key = getAnswer(QID)!.unseen!;
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
    for (const s of [key.model, key.criteria, key.notes]) expect(html).not.toContain(esc(s.slice(0, 40)));
    expect(html).not.toContain("Model answer");
    expect(html).toContain("FIRST-TRY-TEXT the poem uses repetition");
  });

  it("never carries criteria or notes, even for a final question", async () => {
    const attempt = await seeded({ final: true, retried: true });
    const html = await render(attempt.id);
    const key = getAnswer(QID)!.unseen!;
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
    expect(html).not.toContain(esc(key.criteria.slice(0, 40)));
    expect(html).not.toContain(esc(key.notes.slice(0, 40)));
  });
});
