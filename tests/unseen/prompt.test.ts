// The prompt the app sends equals the prompt the pilot script sends (spec 008, research R5): both
// render the synthetic fixture to tests/fixtures/unseen-prompt.golden.txt (the rubric file's drift guard
// is tests/unseen/rubric-drift.test.ts).

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/openrouter.server", () => ({ chatCompletion: vi.fn() }));

import { buildUnseenMessages, formForPrompt, type UnseenMarkerInput } from "@/lib/unseen/marker.server";

const FIXTURES = path.resolve(__dirname, "../fixtures");

interface FixtureCase { id: string; answer: string }
interface FixtureQuestion {
  marks: number; questionHeading: string; question: string; directive: string; textForm: string; visual: boolean;
  text: string; criteria: string; notes: string; suggestedWords: number; anchors: string[]; cases: FixtureCase[];
}

function fixtureInput(): UnseenMarkerInput {
  const q = (JSON.parse(fs.readFileSync(path.join(FIXTURES, "unseen-prompt-input.json"), "utf8")) as { question: FixtureQuestion }).question;
  const student = q.cases.find((c) => c.id.endsWith("-student"))!;
  const anchor = q.cases.find((c) => c.id === q.anchors[0])!;
  return {
    maxMarks: q.marks,
    questionHeading: q.questionHeading,
    question: q.question,
    verb: q.directive,
    textForm: formForPrompt(q.textForm),
    visual: q.visual,
    text: q.text,
    criteria: q.criteria,
    notes: q.notes,
    suggestedWords: q.suggestedWords,
    modelAnswer: anchor.answer,
    stimulus: q.text,
    answer: student.answer,
  };
}

describe("the prompt the app sends", () => {
  it("equals the golden file the pilot script also renders", () => {
    const [system, user] = buildUnseenMessages(fixtureInput());
    const rendered = `===== SYSTEM =====\n${system.content}\n===== USER =====\n${user.content}\n`;
    const golden = fs.readFileSync(path.join(FIXTURES, "unseen-prompt.golden.txt"), "utf8").replace(/\r\n/g, "\n");
    expect(rendered).toBe(golden);
  });

  it("keeps a student's own braces literal (single-pass substitution)", () => {
    const golden = fs.readFileSync(path.join(FIXTURES, "unseen-prompt.golden.txt"), "utf8");
    expect(golden).toContain("{criteria} The train is thinking");
  });
});
