import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { PARTS } from "@/lib/paragraph/parts";
import { buildParagraphMessages, rubric, type MarkerInput } from "@/lib/paragraph/marker.server";

const fixtures = path.resolve(__dirname, "../fixtures");
const fx = JSON.parse(fs.readFileSync(path.join(fixtures, "paragraph-prompt-input.json"), "utf8"));

const ORDER = ["topic", "mechanism", "evidence", "evaluation", "link"] as const;

function inputFromFixture(): MarkerInput {
  const idx = ORDER.indexOf(fx.part);
  return {
    part: fx.part,
    question: fx.essay.question,
    verb: fx.essay.directiveVerb,
    economy: fx.essay.economy,
    economyType: fx.essay.type,
    strategy: fx.essay.strategy,
    brief: fx.essay.brief,
    earlierModels: ORDER.slice(0, idx).map((p) => fx.essay.models[p]),
    model: fx.essay.models[fx.part],
    markingNotes: fx.essay.markingNotes[fx.part],
    answer: fx.answer,
  };
}

describe("the prompt the app sends", () => {
  it("equals the golden file the Python pilot script also checks (no drift between app and script)", () => {
    const [system, user] = buildParagraphMessages(inputFromFixture());
    const rendered = `${system.content}\n\n=====\n\n${user.content}\n`;
    const golden = fs.readFileSync(path.join(fixtures, "paragraph-prompt.golden.txt"), "utf8");
    expect(rendered).toBe(golden);
  });

  it("does not re-expand braces inside a student's text", () => {
    const [, user] = buildParagraphMessages(inputFromFixture());
    expect(String(user.content)).toContain("the {answer} gains");
  });

  it("shows only the parts BEFORE the one being written, by name", () => {
    const [, user] = buildParagraphMessages(inputFromFixture());
    const text = String(user.content);
    expect(text).toContain("The paragraph so far (model text shown to the student):");
    expect(text).toContain("Topic Sentence: While opening up");
    expect(text).toContain("Evidence & Application: Exports doubled");
    expect(text).not.toContain("Therefore opening up"); // the Link model is a LATER part
  });

  it("the public parts.ts names and limits equal the rubric's", () => {
    for (const key of ORDER) {
      expect(PARTS[key].name).toBe(rubric.parts[key].name);
      expect(PARTS[key].limit).toBe(rubric.parts[key].limit);
    }
  });
});
