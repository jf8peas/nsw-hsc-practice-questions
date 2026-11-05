// The attempt detail page for a paragraph part (spec 007 FR-036): each try's text, mark, per-criterion
// verdicts with the marker's reasons and the feedback shown, "Essay N · part" naming, and NO model
// text, brief or notes (so a later part's model can never appear here).

import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getAnswer } from "@/content/answers";
import { buildVerdicts } from "@/lib/paragraph/scoring";
import { paragraphPhases } from "@/lib/db/schema";

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

const UNIT = "y12-economics-paragraph-writing";
const QID = `${UNIT}.e01p3`;
const raw = (a: boolean, b: boolean, c: boolean, d = true) => ({
  a: { met: a, reason: "Used the figures with years." },
  b: { met: b, reason: "The figures are listed, not explained." },
  c: { met: c, reason: "No link back to the chain." },
  conventions: { reason: "Formal.", preciseLanguage: d, noPadding: d },
  feedback: "Make each figure argue.",
});

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

/** The page's own text plus the static markup of its paragraph detail elements (the shell is async). */
async function render(attemptId: string) {
  const Page = (await import("@/app/attempts/[attemptId]/page")).default;
  const tree = await Page({ params: Promise.resolve({ attemptId }) });
  const detail = findAll(tree, (el) => typeof el.type === "function" && (el.type as { name?: string }).name === "ParagraphAttemptDetailView");
  return textOf(tree) + detail.map((el) => renderToStaticMarkup(createElement(el.type as never, el.props as never))).join("");
}

async function seeded(opts: { corrected: boolean }) {
  env = await setupTestEnv();
  const me = await seedUser(env.db);
  env.signedInAs(asSessionUser(me));
  const attempt = await seedAttempt(env.db, me.id, { unitId: UNIT, questionIds: [QID], completedAt: new Date() });
  const v1 = buildVerdicts(raw(true, false, false), 50, 80);
  const v2 = buildVerdicts(raw(true, true, true), 60, 80);
  await env.db.insert(paragraphPhases).values({
    attemptId: attempt.id, userId: me.id, unitId: UNIT, questionId: QID, status: "final", mode: "marker",
    ending: opts.corrected ? "corrected" : "no_correction",
    phase1Text: "FIRST-TRY-TEXT figures listed", phase1Mark: 2, phase1Verdicts: v1, phase1Feedback: "Make each figure argue.",
    phase1PromptVersion: "round 5 (4 Nov 2026)", phase1Model: "m",
    ...(opts.corrected ? { phase2Text: "CORRECTION-TEXT explained figures", phase2Mark: 3, phase2Verdicts: v2, phase2Feedback: "Now explained.", phase2PromptVersion: "round 5 (4 Nov 2026)", phase2Model: "m" } : {}),
    recordedMark: opts.corrected ? 3 : 2,
    flaggedAt: new Date(),
  });
  await seedResult(env.db, { attemptId: attempt.id, userId: me.id }, { unitId: UNIT, questionId: QID, answer: opts.corrected ? "CORRECTION-TEXT explained figures" : "FIRST-TRY-TEXT figures listed", marksAwarded: opts.corrected ? 3 : 2, maxMarks: 4, gradedBy: "llm", feedback: "x" });
  return attempt;
}

describe("paragraph attempt detail", () => {
  it("shows both tries, the verdicts with reasons, the recorded mark and the flag, and names the part", async () => {
    const attempt = await seeded({ corrected: true });
    const html = await render(attempt.id);
    expect(html).toContain("Essay 1 · Evidence & Application");
    expect(html).toContain("First try · 2/4");
    expect(html).toContain("Correction · 3/3");
    expect(html).toContain("FIRST-TRY-TEXT figures listed");
    expect(html).toContain("CORRECTION-TEXT explained figures");
    expect(html).toContain("The figures are listed, not explained.");
    expect(html).toContain('aria-label="Not met"');
    expect(html).toContain('aria-label="Met"');
    expect(html).toContain("Recorded 3/4 · flagged for your teacher");
  });

  it("says when the correction could not be marked", async () => {
    const attempt = await seeded({ corrected: false });
    const html = await render(attempt.id);
    expect(html).toContain("The correction could not be marked, so the first-try mark stands.");
    expect(html).not.toContain("Correction · ");
  });

  it("carries no model text, brief or marking notes from any part", async () => {
    const attempt = await seeded({ corrected: true });
    const html = await render(attempt.id);
    const essay = getAnswer(QID)!.paragraph!.essay;
    const escaped = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
    for (const n of [1, 2, 3, 4, 5] as const) {
      expect(html).not.toContain(escaped(essay.models[n].slice(0, 40)));
      expect(html).not.toContain(escaped(essay.markingNotes[n].slice(0, 40)));
    }
    expect(html).not.toContain(escaped(essay.brief.argument.slice(0, 40)));
  });
});
