// The review report for the unseen-text bank (spec 008, research R2).
//
//   npm run unseen-report
//
// Reads resources/english-unseen/inventory/*.json and bank/*.json (so it covers questions pending review), writes
// resources/english-unseen/review/report.md, and exits 1 when MEDIAN_WORDS disagrees with the
// counted papers. Offline teacher tool: reads answer-key origins only, never sends anything out.

import fs from "node:fs";
import path from "node:path";

import { MEDIAN_WORDS } from "../lib/unseen/limits";
import { PROMPT_VERSION } from "../lib/unseen/marker.server";
import type { BankFile } from "./unseen-build-bank-lib";
import { buildReport, type InventoryFile, type ReportQuestion } from "./unseen-report-lib";

const UNIT = "y12-english-advanced-unseen-texts";
const ROOT = path.resolve(process.cwd(), "resources", "english-unseen");

const dirBytes = (dir: string): number =>
  fs.existsSync(dir) ? fs.readdirSync(dir).reduce((n, f) => n + fs.statSync(path.join(dir, f)).size, 0) : 0;

function main(): number {
  const invDir = path.join(ROOT, "inventory");
  const inventories = fs.existsSync(invDir)
    ? fs.readdirSync(invDir).filter((n) => n.endsWith(".json")).map((n) => JSON.parse(fs.readFileSync(path.join(invDir, n), "utf8")) as InventoryFile)
    : [];
  // the bank files are the source of truth: they include the questions still pending review, which the
  // generator keeps out of the unit (the report marks them "NOT reviewed")
  const bankDir = path.join(ROOT, "bank");
  const banks = fs.existsSync(bankDir)
    ? fs.readdirSync(bankDir).filter((n) => n.endsWith(".json")).map((n) => JSON.parse(fs.readFileSync(path.join(bankDir, n), "utf8")) as BankFile)
    : [];
  const rows: ReportQuestion[] = banks.flatMap((bank) =>
    bank.questions.map((q) => {
      const fromLines = q.answerLines !== null && q.answerLines > 0;
      return {
        id: `${UNIT}.${q.slug}`,
        paperShort: bank.paper.short,
        paperYear: bank.paper.year,
        qNo: q.qNo,
        maxMarks: q.maxMarks,
        form: bank.texts.find((t) => t.id === q.textId)?.form ?? "unknown",
        suggestedWords: fromLines ? q.answerLines! * 12 : MEDIAN_WORDS[q.maxMarks],
        suggestedFrom: fromLines ? ("lines" as const) : ("median" as const),
        modelOrigin: q.key.modelOrigin,
        criteriaOrigin: q.key.criteriaOrigin,
        reviewedOn: q.key.reviewedOn,
      };
    }),
  );
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
