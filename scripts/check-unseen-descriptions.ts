// Pre-release check that each visual text's description is enough to mark from (spec 008 FR-017).
//
//   npm run check-unseen-descriptions            (needs OPENROUTER_API_KEY; real marker calls)
//   npm run check-unseen-descriptions -- --only fs23-t1,ab24-t5   (only these text ids: the others keep their stored check)
//
// Spec 009: a visual text that only a comparative question shows is checked too, by marking that question's model answer
// with the comparative prompt over the texts of its pairing (the description is per text and shared by both units).
//
// For each visual text, marks the question's model answer and the stored pilot answers three times
// each, takes the majority descriptionAdequate and writes description-checks.ts. A failure is
// written, not hidden. Offline teacher tool: it reads answer-key material and sends it to the model
// provider, exactly as the marker does, and never runs in the app.

import fs from "node:fs";
import path from "node:path";

import { descriptions } from "../content/units/y12-english-advanced-unseen-texts/descriptions";
import { keys } from "../content/units/y12-english-advanced-unseen-texts/keys";
import { questions } from "../content/units/y12-english-advanced-unseen-texts/questions";
import { texts } from "../content/units/y12-english-advanced-unseen-texts/texts";
import { keys as comparativeKeys } from "../content/units/y12-english-advanced-comparative-texts/keys";
import { questions as comparativeQuestions } from "../content/units/y12-english-advanced-comparative-texts/questions";
import { storeTexts } from "../content/units/y12-english-advanced-unseen-texts/store-texts";
import { comparativeRubric } from "../lib/comparative/rubric";
import { getEnglishAdvModel } from "../lib/config.server";
import type { ComparativeQuestion, DescriptionCheck, UnseenQuestion } from "../lib/types";
import { COMPARATIVE_SKILL_IDS } from "../lib/unseen/skills";
import { comparativeMarkerInputFor } from "./comparative-field-cases";
import { PROMPT_VERSION, formForPrompt, markWithModel } from "../lib/unseen/marker.server";
import { checkDescription, renderChecksFile } from "./check-unseen-descriptions-lib";

const UNIT = "y12-english-advanced-unseen-texts";
const FILE = path.resolve(process.cwd(), "content", "units", UNIT, "description-checks.ts");
const PILOT = path.resolve(process.cwd(), "resources", "english-unseen", "pilot-questions.json");

function pilotAnswers(slug: string): string[] {
  if (!fs.existsSync(PILOT)) return [];
  const d = JSON.parse(fs.readFileSync(PILOT, "utf8")) as { questions: Array<{ id: string; cases: Array<{ answer: string }> }> };
  return d.questions.find((q) => q.id === slug)?.cases.map((c) => c.answer) ?? [];
}

async function main(): Promise<number> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("✗ OPENROUTER_API_KEY is not set.");
    return 2;
  }
  const existing: Record<string, DescriptionCheck> = {};
  try {
    Object.assign(existing, (await import("../content/units/y12-english-advanced-unseen-texts/description-checks")).descriptionChecks);
  } catch {
    /* none yet */
  }
  const result = { ...existing };
  let failed = 0;
  const onlyArg = process.argv.indexOf("--only");
  const only = onlyArg >= 0 ? new Set((process.argv[onlyArg + 1] ?? "").split(",").filter(Boolean)) : null;
  const wanted = (id: string) => !only || only.has(id);
  for (const text of texts.filter((t) => t.body.kind === "image" && wanted(t.id))) {
    const q = (questions as UnseenQuestion[]).find((x) => x.textId === text.id);
    const description = descriptions[text.id];
    if (!q || !description) {
      console.error(`✗ ${text.id}: no question or no description`);
      failed += 1;
      continue;
    }
    const key = keys[q.id];
    const slug = q.id.split(".").pop() ?? q.id;
    const samples = [key.model, ...pilotAnswers(slug)];
    const check = await checkDescription({
      description,
      samples,
      model: getEnglishAdvModel(),
      promptVersion: PROMPT_VERSION,
      mark: async (answer) => {
        const out = await markWithModel({
          maxMarks: q.maxMarks,
          questionHeading: text.heading,
          question: [q.prompt, ...(q.parts ?? []).map((p) => `(${p.label}) ${p.text}`)].join("\n"),
          verb: q.verb,
          textForm: formForPrompt(text.form),
          visual: true,
          text: description,
          criteria: key.criteria,
          notes: key.notes,
          suggestedWords: q.suggestedWords,
          // not circular: the answer under test is the model answer, so the marker is given no example
          modelAnswer: "",
          stimulus: "",
          answer,
        });
        return out ? out.reply.descriptionAdequate : null;
      },
    });
    result[text.id] = check;
    console.log(`${check.adequate ? "✓" : "✗"} ${text.id}: ${check.adequate ? "adequate" : "NOT adequate"} (${samples.length} samples × 3)`);
    if (!check.adequate) failed += 1;
  }
  // visual texts that only a comparative question shows (spec 009): checked with the comparative prompt
  const done = new Set(texts.map((t) => t.id));
  for (const q of (comparativeQuestions as ComparativeQuestion[]).filter((x) => x.type === "comparative")) {
    const key = comparativeKeys[q.id];
    for (const id of q.textIds) {
      const text = storeTexts.find((t) => t.id === id);
      if (!text || text.body.kind !== "image" || done.has(id) || !wanted(id)) continue;
      done.add(id);
      const description = descriptions[id];
      if (!key || !description) {
        console.error(`✗ ${id}: no description (or no key for ${q.id})`);
        failed += 1;
        continue;
      }
      // the model answer is marked over a pairing that includes this visual: the question's own when it is in it,
      // otherwise the fixed texts and this visual (a choice question) or both texts (a fixed pair)
      const own = key.pairing.includes(id) ? key.pairing : null;
      const pick = q.choice ? (own ? own.filter((p) => q.choice!.from.includes(p)) : [id]) : undefined;
      const check = await checkDescription({
        description,
        samples: [key.model],
        model: getEnglishAdvModel(),
        promptVersion: comparativeRubric.promptVersion,
        mark: async (answer) => {
          const input = comparativeMarkerInputFor(q.id, answer, pick);
          const out = await markWithModel({ ...input, modelAnswer: "" }, { rubric: comparativeRubric, skillIds: COMPARATIVE_SKILL_IDS });
          return out ? out.reply.descriptionAdequate : null;
        },
      });
      result[id] = check;
      console.log(`${check.adequate ? "✓" : "✗"} ${id}: ${check.adequate ? "adequate" : "NOT adequate"} (comparative, 1 sample × 3)`);
      if (!check.adequate) failed += 1;
    }
  }
  fs.writeFileSync(FILE, renderChecksFile(result), "utf8");
  return failed ? 1 : 0;
}

main().then((c) => process.exit(c));
