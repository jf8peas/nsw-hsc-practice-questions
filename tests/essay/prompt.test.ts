import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildEssayMessages, economyRule, type EssayMarkerInput } from "@/lib/essay/marker.server";

const FIXTURE: EssayMarkerInput = {
  question: "Fixture question: evaluate the strategies used by an emerging and a developing economy.",
  verb: "evaluate",
  economy: "both",
  markingNotes: "FIXTURE MARKING NOTES",
  schoolCriteria: "FIXTURE SCHOOL CRITERIA",
  essay: "one two three",
};

describe("the prompt the app sends", () => {
  it("equals the golden file the Python pilot script also checks (no drift between app and script)", () => {
    const [system, user] = buildEssayMessages(FIXTURE);
    const rendered = `${system.content}\n\n=====\n\n${user.content}\n`;
    const golden = fs.readFileSync(path.resolve(__dirname, "../fixtures/essay-golden-prompt.txt"), "utf8");
    expect(rendered).toBe(golden);
  });

  it("says none provided when there are no school criteria", () => {
    const [, user] = buildEssayMessages({ ...FIXTURE, schoolCriteria: null });
    expect(user.content).toContain("None provided.");
    expect(user.content).not.toContain("FIXTURE SCHOOL CRITERIA");
  });

  it("does not re-expand braces inside a student's essay", () => {
    const [, user] = buildEssayMessages({ ...FIXTURE, essay: "my {question} and {markingNotes}" });
    expect(user.content).toContain("my {question} and {markingNotes}");
  });

  it("states the economy rule for each tag", () => {
    expect(economyRule("china")).toContain("China");
    expect(economyRule("nepal")).toContain("Nepal");
    expect(economyRule("both")).toContain("both must be treated");
  });

  it("gives the marker the concept list and the verb's meaning", () => {
    const [, user] = buildEssayMessages(FIXTURE);
    expect(user.content).toContain("- china-wto:");
    expect(user.content).toContain("make a judgement based on criteria");
  });
});
