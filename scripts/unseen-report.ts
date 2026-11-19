// The review report for the unseen-text bank (spec 008, research R2).
//
//   npm run unseen-report
//
// Reads resources/english-unseen/inventory/*.json and the unit's questions and keys, writes
// resources/english-unseen/review/report.md, and exits 1 when MEDIAN_WORDS disagrees with the
// counted papers. Offline teacher tool: reads answer-key origins only, never sends anything out.

import fs from "node:fs";
import path from "node:path";

import { keys } from "../content/units/y12-english-advanced-unseen-texts/keys";
import { questions } from "../content/units/y12-english-advanced-unseen-texts/questions";
import { texts } from "../content/units/y12-english-advanced-unseen-texts/texts";
import type { UnseenQuestion } from "../lib/types";
import { PROMPT_VERSION } from "../lib/unseen/marker.server";
import { buildReport, type InventoryFile } from "./unseen-report-lib";

const UNIT = "y12-english-advanced-unseen-texts";
const ROOT = path.resolve(process.cwd(), "resources", "english-unseen");

const dirBytes = (dir: string): number =>
  fs.existsSync(dir) ? fs.readdirSync(dir).reduce((n, f) => n + fs.statSync(path.join(dir, f)).size, 0) : 0;

function main(): number {
  const invDir = path.join(ROOT, "inventory");
  const inventories = fs.existsSync(invDir)
    ? fs.readdirSync(invDir).filter((n) => n.endsWith(".json")).map((n) => JSON.parse(fs.readFileSync(path.join(invDir, n), "utf8")) as InventoryFile)
    : [];
  const rows = (questions as UnseenQuestion[]).map((q) => {
    const k = keys[q.id];
    return {
      id: q.id,
      paperShort: q.paper.short,
      paperYear: q.paper.year,
      qNo: q.paper.qNo,
      maxMarks: q.maxMarks,
      form: texts.find((t) => t.id === q.textId)?.form ?? "unknown",
      suggestedWords: q.suggestedWords,
      suggestedFrom: q.suggestedFrom,
      modelOrigin: k.modelOrigin,
      criteriaOrigin: k.criteriaOrigin,
      reviewedOn: k.reviewedOn,
    };
  });
  const { markdown, problems } = buildReport({
    inventories,
    questions: rows,
    imagesBytes: dirBytes(path.resolve(process.cwd(), "content", "units", UNIT, "images")),
    promptVersion: PROMPT_VERSION,
    today: new Date().toISOString().slice(0, 10),
  });
  const out = path.join(ROOT, "review", "report.md");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, markdown, "utf8");
  console.log(`wrote ${out}`);
  for (const p of problems) console.error(`✗ ${p}`);
  return problems.length ? 1 : 0;
}

process.exit(main());
