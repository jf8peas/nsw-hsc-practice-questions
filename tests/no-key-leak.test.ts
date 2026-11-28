// Principle I: the answer key never reaches the browser. Checks the attempt
// payload for every unit, the stored result shape, and the public content module.

import fs from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { UNITS } from "@/content";
import { getAnswer } from "@/content/answers";
import { results } from "@/lib/db/schema";

import { allKeys, post, setupRouteEnv, signedInStudent, type RouteEnv } from "./helpers/routes";

let env: RouteEnv | undefined;
afterEach(async () => {
  await env?.close();
  env = undefined;
});

const BANNED_KEYS = [
  "correctText",
  "correctIndex",
  "modelAnswer",
  "rubric",
  "notes",
  "answers",
  "wrongExplanations",
  // spec 007: the paragraph essay key (the brief and earlier models are released on purpose, by
  // lib/grading.server.ts, and are checked separately below)
  "markingNotes",
  "models",
  "commentary",
  "modelPart",
  "modelSoFar",
  "laterSlots",
  // spec 010: the essay key (the model essay is released only in the student's own finished result)
  "schoolCriteria",
  "essayKey",
  // spec 011: the English essay key and the marker's Away notes (the model essay is released only in the student's own result)
  "conceptTags",
  "englishEssayKey",
  "textNotes",
  // spec 008: the unseen-text key (criteria, notes, model answer, a visual's description and its check)
  "criteria",
  "visualDescription",
  "descriptionCheck",
  "descriptionHash",
  "unseenKey",
  // spec 009: the comparative key (a choice question's pairing is released with the model answer only)
  "pairing",
  "visuals",
  "comparativeKey",
  // spec 006: the display-only grading data must never appear in the attempt-start payload
  // (it is delivered only with a phase's grade, or on resume after grading)
  "creditedSpans",
  "phase1CreditedSpans",
  "phase2CreditedSpans",
  "phase2TermOutcomes",
  "languageNote",
  // spec 012: the fact IDs a question tests are never sent; a concept note is released by the unit page only (Release 2)
  "factIds",
  "conceptNote",
];

/**
 * Offline teacher tasks (spec 007 R8) that read the paragraph essay key to build test cases and to
 * re-mark. They run on a teacher's machine, never at request time and never in a bundle.
 */
const OFFLINE_KEY_READERS = new Set(["scripts/paragraph-field-cases.ts", "scripts/paragraph-remark.ts", "scripts/check-unseen-descriptions.ts", "scripts/unseen-report.ts", "scripts/unseen-field-cases.ts", "scripts/unseen-remark.ts", "scripts/comparative-field-cases.ts", "scripts/check-english-essay-models.ts", "scripts/check-case-facts.ts"]);

describe("POST /api/attempts exposes no answer key, for every unit", () => {
  for (const unit of UNITS) {
    it(unit.id, async () => {
      env = await setupRouteEnv();
      await signedInStudent(env);
      const { POST } = await import("@/app/api/attempts/route");
      // the essay unit starts one essay per attempt (spec 010)
      const essayStart =
        unit.flow === "essay"
          ? { questionId: unit.questions.find((q) => q.type === "essay" && q.live)?.id }
          : unit.flow === "englishEssay"
            ? { questionId: unit.questions.find((q) => q.type === "englishEssay" && q.live)?.id } // spec 011
            : {};
      const res = await POST(post("/api/attempts", { unitId: unit.id, ...essayStart }));
      expect(res.status).toBe(201);
      const body = await res.json();
      const text = JSON.stringify(body);

      const keys = allKeys(body);
      for (const banned of BANNED_KEYS) expect(keys.has(banned), banned).toBe(false);

      for (const q of body.questions as Array<{ id: string }>) {
        const key = getAnswer(q.id)!;
        if (key.modelAnswer && key.modelAnswer.length > 20) expect(text).not.toContain(key.modelAnswer);
        for (const point of key.rubric) if (point.length > 20) expect(text).not.toContain(point);
        if (key.notes && key.notes.length > 20) expect(text).not.toContain(key.notes);
        for (const explanation of Object.values(key.wrongExplanations ?? {})) expect(text).not.toContain(explanation);
        // spec 010: the essay key (marking notes, school criteria, model essay) never reaches the attempt-start payload
        const essayKey = key.essay;
        if (essayKey) {
          for (const secret of [essayKey.markingNotes, essayKey.schoolCriteria ?? "", essayKey.modelEssay]) {
            if (secret.length > 20) expect(text).not.toContain(secret.slice(0, 60));
          }
        }
        // spec 011: the English essay key (marking notes, model essay) never reaches the attempt-start payload
        const englishKey = key.englishEssay;
        if (englishKey) {
          for (const secret of [englishKey.markingNotes, englishKey.modelEssay]) {
            if (secret.length > 20) expect(text).not.toContain(secret.slice(0, 60));
          }
        }
        // spec 009: the comparative key's strings (criteria, notes, model answer, every visual's description)
        const cmp = key.comparative;
        if (cmp) {
          for (const secret of [cmp.criteria, cmp.notes, cmp.model, ...Object.values(cmp.visuals ?? {}).map((v) => v.description)]) {
            if (secret.length > 20) expect(text).not.toContain(secret.slice(0, 60));
          }
        }
      }
    });
  }
});

describe("stored results have no field that could hold the answer key", () => {
  it("results columns", () => {
    const columns = Object.keys(results).filter((k) => !k.startsWith("_") && k !== "enableRLS");
    for (const banned of ["modelAnswer", "rubric", "notes", "correctText", "correctIndex"]) {
      expect(columns).not.toContain(banned);
    }
  });
});

describe("the answer-key registry stays server-only", () => {
  it("content/answers/index.ts imports server-only", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "../content/answers/index.ts"), "utf8");
    expect(src).toMatch(/^import "server-only";/m);
  });

  it("only lib/grading.server.ts imports content/answers (outside content/ itself and tests)", () => {
    const root = path.resolve(__dirname, "..");
    const offenders: string[] = [];
    const skip = new Set(["node_modules", ".next", "content", "tests", ".git", "specs", ".specify", "resources", ".cline"]);
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (skip.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name)) {
          const rel = path.relative(root, full).split(path.sep).join("/");
          if (rel === "lib/grading.server.ts") continue;
          if (OFFLINE_KEY_READERS.has(rel)) continue;
          if (/from\s+["']@\/content\/answers|from\s+["'][./]*content\/answers|content\/units\/[^"']+\/(?:answers|essays)["']/.test(fs.readFileSync(full, "utf8"))) {
            offenders.push(rel);
          }
        }
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });
});

describe("no application code reads a unit's answers except through the key (spec 002 FR-043)", () => {
  it("only lib/grading.server.ts imports content/answers or a unit's answers module", () => {
    const root = path.resolve(__dirname, "..");
    const allowed = new Set(["lib/grading.server.ts", "scripts/validate-content.ts"]); // the validator checks the key's shape
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name)) {
          const rel = path.relative(root, full).split(path.sep).join("/");
          if (allowed.has(rel) || OFFLINE_KEY_READERS.has(rel)) continue;
          const src = fs.readFileSync(full, "utf8");
          if (/from\s+["'](?:@\/|(?:\.\.?\/)+)content\/(?:answers|units\/[^"']+\/(?:answers|essays))/.test(src)) offenders.push(rel);
        }
      }
    };
    for (const dir of ["app", "components", "lib", "scripts"]) walk(path.join(root, dir));
    expect(offenders).toEqual([]);
  });
});


// ---- the paragraph unit (spec 007): a staged release, never later parts or the notes ---------------

import { paragraphDiscussion, paragraphQuestionView } from "@/lib/grading.server";
import { paragraphStateFrom } from "@/lib/paragraph/state.server";
import type { ParagraphPhaseRow, ParagraphVerdicts } from "@/lib/db/schema";
import type { ParagraphQuestion } from "@/lib/types";

import { gradeParagraph, q as pq, restoreParagraphEnv, setupParagraphEnv } from "./helpers/paragraph";
import { startAttempt as startRoute } from "./helpers/routes";
import { seedAttempt, seedResult } from "./helpers/fixtures";

const PARA = "y12-economics-paragraph-writing";
const paragraphQuestions = (UNITS.find((u) => u.id === PARA)!.questions as ParagraphQuestion[]).filter((x) => x.type === "paragraph");
const escaped = (s: string) => JSON.stringify(s).slice(1, -1);
/** A run long enough to be unmistakably the key's, short enough to survive JSON escaping. */
const run = (s: string) => escaped(s).slice(0, 60);

describe("paragraph unit: the question view and the discussion, for every shipped part", () => {
  for (const question of paragraphQuestions) {
    const key = getAnswer(question.id)!.paragraph!;
    const { essay, part } = key;
    it(`${question.id}: view has the earlier models and nothing else from the key; discussion has models up to this part and labels only`, () => {
      const view = JSON.stringify(paragraphQuestionView(question.id));
      for (let n = 1; n <= 5; n++) {
        const model = essay.models[n as 1];
        if (n < part) expect(view, `earlier model ${n}`).toContain(run(model));
        else expect(view, `model ${n} (current or later)`).not.toContain(run(model));
        expect(view, `notes ${n}`).not.toContain(run(essay.markingNotes[n as 1]));
        expect(view, `commentary ${n}`).not.toContain(run(essay.commentary[n as 1]));
      }

      const disc = paragraphDiscussion(question.id)!;
      const discText = JSON.stringify(disc);
      for (let n = 1; n <= 5; n++) {
        const model = essay.models[n as 1];
        if (n <= part) expect(discText, `model ${n}`).toContain(run(model));
        else expect(discText, `later model ${n}`).not.toContain(run(model));
        expect(discText, `notes ${n}`).not.toContain(run(essay.markingNotes[n as 1]));
        if (n !== part) expect(discText, `commentary ${n}`).not.toContain(run(essay.commentary[n as 1]));
      }
      expect(disc.modelSoFar).toHaveLength(part);
      expect(disc.laterSlots).toHaveLength(5 - part);
      for (const slot of disc.laterSlots) {
        expect(Object.keys(slot).sort()).toEqual(["label", "part", "when"]);
        expect(slot.label.length).toBeLessThan(30);
      }
    });
  }
});

describe("paragraph unit: the resume state at every stage", () => {
  const verdicts: ParagraphVerdicts = {
    a: { met: true, reason: "r" }, b: { met: false, reason: "r" }, c: { met: true, reason: "r" },
    d: { met: true, reason: "r", subs: { preciseLanguage: true, noPadding: true, withinLimit: true } },
  };
  const base = { phase1Text: "my text", phase1Mark: 3, phase1Verdicts: verdicts, phase1Feedback: "f", flaggedAt: null, mode: "marker", recordedMark: null, phase2Text: null, phase2Mark: null, phase2Verdicts: null, phase2Feedback: null, ending: null };
  for (const question of paragraphQuestions) {
    const { essay, part } = getAnswer(question.id)!.paragraph!;
    it(`${question.id}: write and correct stages hold no current/later model, notes or commentary; discussion holds models up to this part`, () => {
      const write = JSON.stringify(paragraphStateFrom(question.id, null, { phase1Draft: "draft", phase2Draft: "" }));
      const correct = JSON.stringify(paragraphStateFrom(question.id, { ...base, status: "phase1", questionId: question.id } as unknown as ParagraphPhaseRow, null));
      for (const stage of [write, correct]) {
        for (let n = part; n <= 5; n++) expect(stage).not.toContain(run(essay.models[n as 1]));
        for (let n = 1; n <= 5; n++) {
          expect(stage).not.toContain(run(essay.markingNotes[n as 1]));
          expect(stage).not.toContain(run(essay.commentary[n as 1]));
        }
        for (let n = 1; n < part; n++) expect(stage).toContain(run(essay.models[n as 1]));
      }
      const final = JSON.stringify(
        paragraphStateFrom(question.id, { ...base, status: "final", ending: "corrected", recordedMark: 3, questionId: question.id } as unknown as ParagraphPhaseRow, null),
      );
      for (let n = 1; n <= part; n++) expect(final).toContain(run(essay.models[n as 1]));
      for (let n = part + 1; n <= 5; n++) expect(final).not.toContain(run(essay.models[n as 1]));
      for (let n = 1; n <= 5; n++) expect(final).not.toContain(run(essay.markingNotes[n as 1]));
    });
  }
});

describe("paragraph unit: through the routes (start at part 3, then grade under 4)", () => {
  it("the start response has models 1 and 2 only, and a grade under 4 releases no model text", async () => {
    const penv = await setupParagraphEnv();
    try {
      const { signedInStudent } = await import("./helpers/routes");
      const user = await signedInStudent(penv);
      const earlier = await seedAttempt(penv.db, user.id, { unitId: PARA, questionIds: [pq(1, 1)] });
      await seedResult(penv.db, { attemptId: earlier.id, userId: user.id }, { unitId: PARA, questionId: pq(1, 1), marksAwarded: 1, maxMarks: 4, gradedBy: "llm" });
      const earlier2 = await seedAttempt(penv.db, user.id, { unitId: PARA, questionIds: [pq(1, 2)] });
      await seedResult(penv.db, { attemptId: earlier2.id, userId: user.id }, { unitId: PARA, questionId: pq(1, 2), marksAwarded: 0, maxMarks: 4, gradedBy: "llm" });

      const started = await startRoute(PARA);
      expect(started.questions[0].id).toBe(pq(1, 3));
      const essay = getAnswer(pq(1, 3))!.paragraph!.essay;
      const startText = JSON.stringify(started);
      expect(startText).toContain(run(essay.models[1])); // whatever the student scored on it
      expect(startText).toContain(run(essay.models[2]));
      for (const n of [3, 4, 5]) expect(startText).not.toContain(run(essay.models[n as 1]));
      for (const n of [1, 2, 3, 4, 5]) expect(startText).not.toContain(run(essay.markingNotes[n as 1]));
      expect(allKeys(started).has("discussion")).toBe(false);

      const graded = await gradeParagraph(started, pq(1, 3), "Some evidence. [met:ad]");
      const gradedText = JSON.stringify(graded.body);
      for (const n of [3, 4, 5]) expect(gradedText).not.toContain(run(essay.models[n as 1]));
      for (const n of [1, 2, 3, 4, 5]) expect(gradedText).not.toContain(run(essay.markingNotes[n as 1]));
      expect(graded.body.result.discussion).toBeUndefined();
    } finally {
      restoreParagraphEnv();
      await penv.close();
    }
  });
});

describe("the unseen text's own page (spec 008 FR-006) reads no key module", () => {
  it("imports only public content (the unit's texts through getUnit), the session and the attempt lookup", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "../app/unit/[unitId]/text/[textId]/page.tsx"), "utf8");
    const imports = [...src.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
    for (const spec of imports) {
      expect(spec, spec).not.toMatch(/content\/answers|\/answers$|\/keys$|\/descriptions$|description-checks|grading\.server|marker\.server|images\.server/);
    }
    const code = src.replace(/\/\/.*$/gm, ""); // comments may name the key; code may not
    expect(code).not.toMatch(/keys|descriptions|criteria|modelAnswer/);
  });
});


// ---- the case-study facts unit (spec 012 FR-029) ----------------------------------------------

describe("case-study facts unit: no fact ID and no key text before an answer", () => {
  const CASE = "y12-economics-case-study-facts";
  const caseUnit = UNITS.find((u) => u.id === CASE)!;
  const FACT_ID = /[CN]\d{2}/;

  it("the public unit and a start response hold no fact ID and none of the 48 keys' text", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    // the attempt token and id are random strings, not content
    const { attemptToken: _token, attemptId: _id, ...started } = await startRoute(CASE);
    expect(started.questions).toHaveLength(5);
    const texts = [JSON.stringify(caseUnit), JSON.stringify(started)];
    expect(caseUnit.questions).toHaveLength(48);
    for (const text of texts) {
      expect(text).not.toMatch(FACT_ID);
      for (const q of caseUnit.questions) {
        const key = getAnswer(q.id)!;
        const secrets = [key.modelAnswer ?? "", ...key.rubric, key.notes ?? "", ...Object.values(key.wrongExplanations ?? {})];
        for (const secret of secrets) if (secret.length > 20) expect(text, q.id).not.toContain(run(secret));
      }
    }
  });

  it("grading a multiple-choice and a short answer returns no fact IDs and no concept note", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startRoute(CASE);
    const { POST } = await import("@/app/api/grade/route");
    for (const type of ["mc", "short"] as const) {
      const question = started.questions.find((x) => x.type === type)!;
      const res = await POST(
        post("/api/grade", {
          attemptId: started.attemptId,
          attemptToken: started.attemptToken,
          questionId: question.id,
          answer: type === "mc" ? "0" : "An answer.",
        }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      const keys = allKeys(body);
      expect(keys.has("factIds")).toBe(false);
      expect(keys.has("conceptNote")).toBe(false);
      expect(JSON.stringify(body)).not.toMatch(FACT_ID);
    }
  });
});
