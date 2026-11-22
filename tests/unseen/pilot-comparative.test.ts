// The comparative prompt the app sends equals the one the pilot script sends (spec 009 research R6/R7, task T018),
// the prompt file cannot change without a new promptVersion and a regenerated golden file, and the pilot's
// Python parser agrees with the TypeScript parser on nine verdicts. The pilot is `--unit comparative`.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/openrouter.server", () => ({ chatCompletion: vi.fn() }));

import { COMPARATIVE_MAX_TOKENS, comparativeRubric } from "@/lib/comparative/rubric";
import { buildUnseenMessages, parseUnseenReply, type MarkerText, type UnseenMarkerInput } from "@/lib/unseen/marker.server";
import { COMPARATIVE_SKILL_IDS } from "@/lib/unseen/skills";

const FIXTURES = path.resolve(__dirname, "../fixtures");
const REPO = path.resolve(__dirname, "../..");

interface FText { id: string; heading: string; textForm: string; visual: boolean; text: string }
interface FCase { id: string; answer: string; pick?: string[] }
interface FQuestion {
  marks: number; question: string; directive: string; choice: { fixed: string[]; from: string[]; pick: number } | null;
  texts: FText[]; criteria: string; notes: string; suggestedWords: number; anchors: string[]; cases: FCase[];
}

function fixtureInput(): UnseenMarkerInput {
  const q = (JSON.parse(fs.readFileSync(path.join(FIXTURES, "comparative-prompt-input.json"), "utf8")) as { question: FQuestion }).question;
  const student = q.cases.find((c) => c.id.endsWith("-student"))!;
  const anchor = q.cases.find((c) => c.id === q.anchors[0])!;
  const want = new Set(q.choice ? [...q.choice.fixed, ...(student.pick ?? [])] : q.texts.map((t) => t.id));
  const texts: MarkerText[] = q.texts.filter((t) => want.has(t.id)).map((t) => ({ heading: t.heading, textForm: t.textForm, visual: t.visual, text: t.text }));
  return {
    maxMarks: q.marks, questionHeading: "", question: q.question, verb: q.directive, textForm: "", visual: false, text: "",
    texts, criteria: q.criteria, notes: q.notes, suggestedWords: q.suggestedWords, modelAnswer: anchor.answer, stimulus: "",
    answer: student.answer,
  };
}

function rubricHash(): string {
  const verbs = Object.entries(comparativeRubric.directiveVerbs)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  return createHash("sha256").update([comparativeRubric.systemPrompt, comparativeRubric.userTemplate, verbs].join("\n---\n"), "utf8").digest("hex");
}

describe("the comparative prompt the app sends", () => {
  it("equals the golden file the pilot script also renders", () => {
    const [system, user] = buildUnseenMessages(fixtureInput(), comparativeRubric);
    const rendered = `===== SYSTEM =====\n${system.content}\n===== USER =====\n${user.content}\n`;
    const golden = fs.readFileSync(path.join(FIXTURES, "comparative-prompt.golden.txt"), "utf8").replace(/\r\n/g, "\n");
    expect(rendered).toBe(golden);
  });

  it("holds only the picked texts: the unpicked allowed text's words are not in the golden prompt", () => {
    const golden = fs.readFileSync(path.join(FIXTURES, "comparative-prompt.golden.txt"), "utf8");
    expect(golden).toContain("empty chair beside a window");
    expect(golden).not.toContain("each one a small refusal");
  });
});

describe("the comparative prompt file and its version", () => {
  it("has not changed without a new promptVersion and a regenerated golden file", () => {
    const recorded = fs.readFileSync(path.join(FIXTURES, "comparative-rubric.hash"), "utf8").trim();
    const [version, sha] = recorded.split(" ");
    if (version === comparativeRubric.promptVersion && sha !== rubricHash()) {
      throw new Error("lib/comparative/rubric.json changed but promptVersion did not: bump promptVersion, then run `python scripts/pilot-unseen-marker.py --unit comparative --write-golden`");
    }
    expect(recorded).toBe(`${comparativeRubric.promptVersion} ${rubricHash()}`);
  });

  it("names its own version and the nine skills, NESA's compare and the evaluative reading", () => {
    expect(comparativeRubric.promptVersion).toMatch(/^comparative-pilot-\d+/);
    for (const id of COMPARATIVE_SKILL_IDS) expect(comparativeRubric.systemPrompt).toContain(id);
    expect(comparativeRubric.directiveVerbs.compare).toContain("Show how things are similar or different");
    expect(comparativeRubric.directiveVerbs["most effectively"]).toContain("evaluate");
    expect(comparativeRubric.systemPrompt).toMatch(/example of the standard, not of the texts to use/);
    expect(comparativeRubric.systemPrompt).toMatch(/Never mark an answer down because it writes about different texts/);
  });
});

describe("max_tokens for the comparative marker (T022)", () => {
  it("is at least 6000, above spec 008's 4000, and the pilot script uses the same number", () => {
    expect(COMPARATIVE_MAX_TOKENS).toBeGreaterThanOrEqual(6000);
    const py = fs.readFileSync(path.join(REPO, "scripts/pilot-unseen-marker.py"), "utf8");
    expect(Number(/^COMPARATIVE_MAX_TOKENS = ([0-9]+)/m.exec(py)?.[1])).toBe(COMPARATIVE_MAX_TOKENS);
  });
});

const PY = process.env.PYTHON ?? "python";
const havePython = spawnSync(PY, ["--version"]).status === 0;

describe.skipIf(!havePython)("the pilot script, --unit comparative (offline)", () => {
  it("checks its golden fixtures without any data file (the prompt it would send equals the golden file)", () => {
    const code = [
      "import importlib.util, sys",
      "sys.argv = ['pilot-unseen-marker.py', '--unit', 'comparative']",
      "spec = importlib.util.spec_from_file_location('pilot', 'scripts/pilot-unseen-marker.py')",
      "m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)",
      "assert m.COMPARATIVE and m.PROMPT_VERSION.startswith('comparative-pilot-')",
      "assert len(m.SKILLS) == 9, m.SKILLS",
      "print('\\n'.join(m.check_golden()) or 'GOLDEN OK')",
    ].join("\n");
    const out = spawnSync(PY, ["-c", code], { cwd: REPO, encoding: "utf8" });
    expect(out.stderr).toBe("");
    expect(out.stdout.trim()).toBe("GOLDEN OK");
  });

  it("parses a nine-verdict reply as the TypeScript parser does, and rejects a missing comparison verdict", () => {
    const skills = Object.fromEntries(COMPARATIVE_SKILL_IDS.map((id) => [id, { met: id !== "compares-texts", reason: `${id} reason` }]));
    const reply = JSON.stringify({ mark: 4, skills, feedback: "Good.", biggestGap: "Compare throughout." });
    const missing = JSON.stringify({ mark: 4, skills: Object.fromEntries(Object.entries(skills).filter(([k]) => k !== "treats-both-in-depth")), feedback: "Good.", biggestGap: "x" });
    const code = [
      "import importlib.util, sys, json",
      "sys.argv = ['pilot-unseen-marker.py', '--unit', 'comparative']",
      "spec = importlib.util.spec_from_file_location('pilot', 'scripts/pilot-unseen-marker.py')",
      "m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)",
      "ok, e1 = m.parse_reply(sys.stdin.readline(), 6)",
      "bad, e2 = m.parse_reply(sys.stdin.readline(), 6)",
      "print(json.dumps({'ok': ok['mark'] if ok else None, 'e1': e1, 'bad': bad, 'e2': e2}))",
    ].join("\n");
    const out = spawnSync(PY, ["-c", code], { cwd: REPO, encoding: "utf8", input: `${reply}\n${missing}\n` });
    const py = JSON.parse(out.stdout.trim());
    expect(py.ok).toBe(4);
    expect(py.bad).toBeNull();
    expect(py.e2).toMatch(/missing skill verdicts: treats-both-in-depth/);
    expect(parseUnseenReply(reply, 6, COMPARATIVE_SKILL_IDS)?.mark).toBe(4);
    expect(parseUnseenReply(missing, 6, COMPARATIVE_SKILL_IDS)).toBeNull();
  });
});
