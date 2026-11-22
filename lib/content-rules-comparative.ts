// Comparative-text rules (spec 009 FR-028 to FR-031, research R12). A plain module like lib/content-rules.ts:
// no `server-only`, no I/O. scripts/validate-content.ts feeds it the loaded units and answer sets.

import { createHash } from "node:crypto";

import { MAX_IMAGE_BYTES, PROMPT_LEAK_RUN, isPastIsoDate, renderStimulus, sharedRun } from "@/lib/content-rules";
import type { AnswerSet, ComparativeQuestion, Unit, UnseenText } from "@/lib/types";
import { MEDIAN_WORDS } from "@/lib/unseen/limits";
import { COMPARATIVE_SKILL_IDS, comparativeSkillConceptId } from "@/lib/unseen/skills";
import { sourceOf } from "@/lib/unseen/source";
import { countWords } from "@/lib/wordcount";

/**
 * The unit declares the nine skills as concepts (spec 008's seven under ITS ids, which must exist in the unit it
 * shares progress with, and its own two), every question's texts resolve, a fixed pair names exactly two texts
 * and a choice question's fixed and chosen texts are consistent, the pairing is a subset of the shown texts,
 * marks are 3 to 8, the key is complete and a student could submit the model answer, drafted material is
 * reviewed, every visual text the question shows (picked or not) has an image, a neutral alt and a passed,
 * current description check, and no key text, pairing label included, appears in a public string.
 * `verbs` is the comparative prompt's directive verbs; `partners` are the registered units (to find the home of a
 * shared concept id); `imageSizeOf` reads the shared store's images.
 */
export function validateComparativeRules(
  unit: Unit,
  answers: AnswerSet,
  verbs: Record<string, string>,
  partners: readonly Unit[] = [],
  today: Date = new Date(),
  imageSizeOf: (imageName: string) => number | null = () => null,
): string[] {
  const errors: string[] = [];
  const questions = unit.questions.filter((q): q is ComparativeQuestion => q.type === "comparative");
  if (questions.length === 0) return errors;

  // the nine skills as concepts, clearing after 2; the shared seven are the partner unit's own concepts
  const concepts = new Map((unit.concepts ?? []).map((c) => [c.id, c]));
  for (const id of COMPARATIVE_SKILL_IDS) {
    const conceptId = comparativeSkillConceptId(id);
    const c = concepts.get(conceptId);
    if (!c) errors.push(`${unit.id}: missing skill concept ${conceptId}`);
    else if (c.clearAfter !== 2) errors.push(`${c.id}: clearAfter must be 2`);
    if (!conceptId.startsWith(`${unit.id}.c-`)) {
      if (!(unit.sharesProgressWith ?? []).some((p) => conceptId.startsWith(`${p}.c-`))) {
        errors.push(`${unit.id}: skill concept ${conceptId} belongs to a unit it does not share progress with`);
      }
      const home = partners.find((p) => conceptId.startsWith(`${p.id}.c-`));
      if (home && !(home.concepts ?? []).some((c2) => c2.id === conceptId)) errors.push(`${conceptId}: not a concept of ${home.id}, which it is shared with`);
    }
  }
  if (concepts.size !== COMPARATIVE_SKILL_IDS.length) errors.push(`${unit.id}: expected the 9 skills as concepts, found ${concepts.size}`);
  if (unit.draw?.kind !== "comparative-weighted") errors.push(`${unit.id}: a comparative unit must declare draw: { kind: "comparative-weighted" }`);

  const texts = new Map<string, UnseenText>();
  for (const t of unit.texts ?? []) {
    if (texts.has(t.id)) errors.push(`${unit.id}: duplicate text id ${t.id}`);
    texts.set(t.id, t);
  }
  const used = new Set(questions.flatMap((q) => q.textIds));
  for (const t of texts.values()) if (!used.has(t.id)) errors.push(`${t.id}: no question of ${unit.id} shows this text`);

  const publicStrings: Array<{ text: string; run: number }> = [
    { text: unit.description, run: 40 },
    ...(unit.guide?.items.map((i) => ({ text: i.text, run: 40 })) ?? []),
    ...(unit.concepts ?? []).map((c) => ({ text: c.description, run: 40 })),
  ];
  const validTags = new Set(COMPARATIVE_SKILL_IDS.map(comparativeSkillConceptId));

  for (const q of questions) {
    const key = answers[q.id]?.comparative;

    // 1. source
    if (!q.paper) errors.push(`${q.id}: no paper fields (school, year, exam, question number)`);
    else {
      if (![1, 2, 3, 4, 5].includes(q.paper.qNo)) errors.push(`${q.id}: paper.qNo must be 1 to 5`);
      if (q.paper.year < 2023 || q.paper.year > 2026) errors.push(`${q.id}: paper.year ${q.paper.year} is outside 2023 to 2026`);
      if (q.paper.exam !== "Trial" && q.paper.exam !== "Half-yearly") errors.push(`${q.id}: paper.exam must be Trial or Half-yearly`);
      if (q.source !== sourceOf(q.paper)) errors.push(`${q.id}: source "${q.source}" must be "${sourceOf(q.paper)}"`);
    }

    // 2. the texts and the choice
    const shown = q.textIds ?? [];
    if (new Set(shown).size !== shown.length) errors.push(`${q.id}: textIds repeats a text`);
    for (const id of shown) {
      const text = texts.get(id);
      if (!text) {
        errors.push(`${q.id}: text ${id} not found`);
        continue;
      }
      if (!isPastIsoDate(text.hscChecked, today)) errors.push(`${text.id}: hscChecked must be a past ISO date (the text was compared with the NESA HSC papers)`);
      if ((text.form === "visual") !== (text.body.kind === "image")) errors.push(`${text.id}: form "${text.form}" does not match its body kind "${text.body.kind}"`);
      if (!text.heading.trim()) errors.push(`${text.id}: the heading as on the paper is required`);
    }
    const c = q.choice;
    if (c === null) {
      if (shown.length !== 2) errors.push(`${q.id}: a fixed-pair question shows exactly 2 texts, has ${shown.length}`);
    } else {
      const order = [...c.fixed, ...c.from];
      if (c.fixed.some((f) => c.from.includes(f))) errors.push(`${q.id}: a text is both fixed and choosable`);
      if (shown.length !== order.length || shown.some((id, i) => id !== order[i])) {
        errors.push(`${q.id}: textIds must be the fixed texts then the choosable texts, in that order`);
      }
      if (!Number.isInteger(c.pick) || c.pick < 1 || c.pick > c.from.length) errors.push(`${q.id}: choice.pick must be 1 to ${c.from.length}`);
      if (c.fixed.length + c.pick < 2) errors.push(`${q.id}: the answer must be about at least 2 texts (fixed ${c.fixed.length} + pick ${c.pick})`);
    }

    // 3. skill tags
    const tags = q.concepts ?? [];
    if (tags.length < 1 || tags.length > 3) errors.push(`${q.id}: needs 1 to 3 skill tags, has ${tags.length}`);
    if (new Set(tags).size !== tags.length) errors.push(`${q.id}: repeated skill tag`);
    for (const t of tags) if (!validTags.has(t)) errors.push(`${q.id}: concepts has "${t}", which is not one of the nine skills`);

    // 4. marks, parts, verb, outcome
    if (!Number.isInteger(q.maxMarks) || q.maxMarks < 3 || q.maxMarks > 8) errors.push(`${q.id}: maxMarks must be a whole number from 3 to 8`);
    if (q.parts && q.parts.reduce((n, p) => n + p.marks, 0) !== q.maxMarks) errors.push(`${q.id}: parts marks do not add up to maxMarks ${q.maxMarks}`);
    if (!(q.verb in verbs)) errors.push(`${q.id}: verb "${q.verb}" has no definition in the comparative prompt's directiveVerbs`);
    if (!["EAV-12-01", "EAV-12-02", "EAV-12-04"].includes(q.outcome)) errors.push(`${q.id}: outcome must be EAV-12-01, EAV-12-02 or EAV-12-04`);

    // 5. suggested length (no median for a mark value until it has been counted, so nothing ships on a guess)
    if (!Number.isInteger(q.suggestedWords) || q.suggestedWords <= 0) errors.push(`${q.id}: suggestedWords must be set`);
    else if (q.suggestedFrom === "lines" && q.suggestedWords % 12 !== 0) errors.push(`${q.id}: suggestedWords ${q.suggestedWords} must be answer lines × 12`);
    else if (q.suggestedFrom === "median") {
      if (MEDIAN_WORDS[q.maxMarks] === undefined) errors.push(`${q.id}: no median is counted for ${q.maxMarks} marks yet (lib/unseen/limits.ts)`);
      else if (q.suggestedWords !== MEDIAN_WORDS[q.maxMarks]) errors.push(`${q.id}: suggestedWords ${q.suggestedWords} must be the median ${MEDIAN_WORDS[q.maxMarks]} for ${q.maxMarks} marks`);
    }

    // 6 and 7. the key
    if (!key) {
      errors.push(`${q.id}: no comparative answer key`);
      continue;
    }
    if (!key.criteria.trim()) errors.push(`${q.id}: criteria are empty`);
    else {
      const bands = new Set([...key.criteria.matchAll(/^\s*(\d+)\s*[–-]/gm)].map((m) => Number(m[1])));
      for (let m = q.maxMarks; m >= 1; m--) if (!bands.has(m)) errors.push(`${q.id}: criteria have no band line for ${m} mark${m === 1 ? "" : "s"}`);
    }
    if (!key.notes.trim()) errors.push(`${q.id}: notes are empty (use "None provided by the school.")`);
    const modelWords = countWords(key.model);
    const submittable = Math.floor((q.suggestedWords * 12) / 10);
    if (modelWords < 40) errors.push(`${q.id}: the model answer has ${modelWords} words; at least 40`);
    else if (Number.isInteger(q.suggestedWords) && modelWords > submittable) {
      errors.push(`${q.id}: the model answer has ${modelWords} words, more than a student could submit (${submittable})`);
    }
    if (key.modelOrigin === "drafted" || key.criteriaOrigin === "drafted") {
      if (!isPastIsoDate(key.reviewedOn, today)) errors.push(`${q.id}: drafted criteria or model answer need a reviewedOn date before the question ships`);
    }
    // the pairing: the texts the model answer uses, a subset of the texts shown, as many as an answer is about
    const pairing = key.pairing ?? [];
    const expected = c === null ? shown.length : c.fixed.length + c.pick;
    if (pairing.length !== expected) errors.push(`${q.id}: the pairing has ${pairing.length} text(s); an answer is about ${expected}`);
    if (!pairing.every((id) => shown.includes(id))) errors.push(`${q.id}: the pairing names a text the question does not show`);
    if (c !== null && !c.fixed.every((id) => pairing.includes(id))) errors.push(`${q.id}: the pairing must include every fixed text`);
    if (new Set(pairing).size !== pairing.length) errors.push(`${q.id}: the pairing repeats a text`);

    // 8. every visual text the question shows, picked or not
    for (const id of shown) {
      const text = texts.get(id);
      if (text?.body.kind !== "image") continue;
      const body = text.body;
      const size = imageSizeOf(body.image);
      if (size === null) errors.push(`${text.id}: no image file for "${body.image}" in the text store's images folder`);
      else if (size > MAX_IMAGE_BYTES) errors.push(`${text.id}: the image is ${Math.round(size / 1024)} KB; at most ${MAX_IMAGE_BYTES / 1024} KB`);
      if (!body.alt.trim() || body.alt.length > 250) errors.push(`${text.id}: alt must be a short neutral label (1 to 250 characters)`);
      const visual = key.visuals?.[id];
      if (!visual || !visual.description.trim()) errors.push(`${q.id}: no written description for visual text ${id}`);
      else {
        if (sharedRun(visual.description, body.alt, 40, "")) errors.push(`${text.id}: alt shares a 40-character run with the description (alt must not be the description)`);
        const check = visual.check;
        if (!check) errors.push(`${q.id}: the description check has not been run for ${id} (npm run check-unseen-descriptions)`);
        else {
          if (!check.adequate) errors.push(`${q.id}: the description check failed for ${id}: the description is not enough to mark from`);
          const hash = createHash("sha256").update(visual.description, "utf8").digest("hex");
          if (check.descriptionHash !== hash) errors.push(`${q.id}: the description of ${id} changed since its check passed; rerun npm run check-unseen-descriptions`);
        }
      }
    }

    // 9. key text must not appear in public strings (quotation of the question's own stimuli is fine); the pairing's
    // labels are included, so a heading the paper prints publicly cannot leak the school's expected pairing by length
    const stimulus = shown
      .map((id) => texts.get(id))
      .filter((t): t is UnseenText => !!t && t.body.kind !== "image")
      .map(renderStimulus)
      .join("\n");
    const pairingLabels = pairing.map((id) => texts.get(id)?.heading ?? "").filter(Boolean).join(" ");
    const keyStrings = [key.model, key.criteria, key.notes, ...Object.values(key.visuals ?? {}).map((v) => v.description), pairingLabels].filter((k) => k.trim());
    const promptStrings: Array<{ text: string; run: number }> = [
      { text: q.prompt, run: PROMPT_LEAK_RUN },
      ...(q.parts ?? []).map((p) => ({ text: p.text, run: PROMPT_LEAK_RUN })),
    ];
    const own: Array<{ text: string; run: number }> = [
      { text: q.source ?? "", run: 40 },
      ...shown.flatMap((id) => {
        const t = texts.get(id);
        return t?.body.kind === "image" ? [{ text: t.body.alt, run: 40 }] : [];
      }),
    ];
    for (const k of keyStrings) {
      // criteria restate the question's own wording, as school criteria do, so they are not compared with the prompt
      const against = k === key.criteria ? [...own, ...publicStrings] : [...promptStrings, ...own, ...publicStrings];
      for (const pub of against) {
        if (pub.text && sharedRun(k, pub.text, pub.run, stimulus)) {
          errors.push(`${q.id}: key text appears in public text "${pub.text.slice(0, 40)}…"`);
          break;
        }
      }
    }
  }
  return errors;
}
