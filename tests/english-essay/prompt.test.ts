import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { englishConceptLines } from "@/content/units/y12-english-essay-writing/concepts";

// marker.server.ts is server-only; the prompt builder itself is pure.
vi.mock("server-only", () => ({}));

import { buildEnglishEssayMessages, render, rubric } from "@/lib/english-essay/marker.server";

const GOLDEN = readFileSync(path.resolve(__dirname, "../fixtures/english-essay-golden-prompt.txt"), "utf8");

const SYNTHETIC = {
  question: "SYNTHETIC QUESTION for the golden prompt.",
  markingNotes: "SYNTHETIC MARKING NOTES for the golden prompt.",
  essay: "SYNTHETIC ESSAY text {with} braces and one two three four five.",
};

const rendered = (essay = SYNTHETIC.essay) =>
  buildEnglishEssayMessages({ ...SYNTHETIC, essay }, rubric, englishConceptLines(), "SYNTHETIC AWAY NOTES for the golden prompt.")
    .map((m) => `[${m.role}]\n${m.content}`)
    .join("\n\n=====\n\n") + "\n";

describe("the marker prompt", () => {
  it("renders exactly the golden fixture the Python pilot writes (synthetic notes only)", () => {
    expect(rendered()).toBe(GOLDEN);
  });

  it("uses the approved prompt version and carries no protected note in the golden", () => {
    expect(rubric.promptVersion).toBe("eng-essay-pilot-5");
    expect(GOLDEN).toContain("SYNTHETIC AWAY NOTES");
    // the real Away notes live in rubric.json's textNotes: none of their text may be in the golden
    const real = rubric.textNotes.away ?? "";
    expect(real.length).toBeGreaterThan(100);
    expect(GOLDEN).not.toContain(real.slice(0, 80));
    expect(GOLDEN).not.toContain(real.slice(-80));
  });

  it("substitutes in a single pass: the student's own braces and placeholders are never re-expanded", () => {
    const tricky = "My essay quotes {question} and {markingNotes} and {essay} literally. " + "word ".repeat(20);
    const prompt = rendered(tricky);
    expect(prompt).toContain("{question} and {markingNotes} and {essay} literally");
    expect(prompt).toContain(`Student's essay (${tricky.trim().split(/\s+/).length} words):`);
    expect(render("{a} {b} {c}", { a: "{b}", b: "x" })).toBe("{b} x {c}");
  });

  it("never carries the model essay or an unknown placeholder, and lists every concept id", () => {
    const prompt = rendered();
    expect(prompt).not.toMatch(/\{(question|textTitle|textNotes|bands|criteria|markingNotes|concepts|words|essay|maxGaps)\}/);
    for (const key of Object.keys(englishConceptLines())) expect(prompt).toContain(`- ${key}:`);
  });
});
