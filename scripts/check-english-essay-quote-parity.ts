// Local parity check for the English essay quote check (spec 011 T071, contracts/quote-check.md §5). Compares the TypeScript
// quote check, run on the gitignored pilot essays and the gitignored local play, with the Python pilot's expected results in
// the gitignored resources/english-essay/quote-parity.json (written by `python scripts/pilot-english-essay-marker.py
// --write-quote-fixture`), then replays the saved model replies of the approved pilot runs through the app's parser, quote
// check and final-mark function and requires the same final mark as the Python rescore.
//
//   npm run english-essay-quote-parity
//
// Release bar: every planted quotation error caught (4/4), no false flag over the accurate quotations (67), every ratio and
// correction equal, and the same final mark for every replayed reply. Prints aggregate numbers only: no quotation, essay,
// reply or play excerpt is ever printed or committed.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { parseEnglishEssayReply } from "../lib/english-essay/marker.server";
import { normWords, PlayIndex } from "../lib/english-essay/play-index";
import { buildOtherSources, checkQuotes } from "../lib/english-essay/quotes";
import { dedupeMarkerErrors, englishFinalMark, mergeKnowledgeErrors } from "../lib/english-essay/scoring";
import type { EnglishQuoteResult } from "../lib/english-essay/types";

const ROOT = process.cwd();
const RES = path.join(ROOT, "resources", "english-essay");
const PLAY = path.join(ROOT, "resources", "english-unseen", "away-by-michael-gow.txt");
const FIXTURE = path.join(RES, "quote-parity.json");
const REPLAY_RUNS = ["20261123-012122", "20261123-012146"];

interface FixtureEntry {
  id: string;
  question: string;
  plantedQuotes: { misquote?: string[]; notInText?: string[] } | null;
  results: EnglishQuoteResult[];
}
interface AwayCase {
  id: string;
  question: string;
  essay: string;
}

const read = <T>(file: string): T => JSON.parse(readFileSync(file, "utf8")) as T;
const fail = (message: string): never => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

for (const f of [FIXTURE, PLAY, path.join(RES, "pilot-away.json")]) {
  if (!existsSync(f)) fail(`${path.relative(ROOT, f)} is missing (it is gitignored: run the Python pilot's --write-quote-fixture and keep your local play)`);
}

const play = new PlayIndex(readFileSync(PLAY, "utf8"));
const fixture = read<FixtureEntry[]>(FIXTURE);
const away = read<{ cases: AwayCase[]; questions: Record<string, { question: string }> }>(path.join(RES, "pilot-away.json"));
const caseById = new Map(away.cases.map((c) => [c.id, c]));

// ---- 1. quote check parity -------------------------------------------------------------------------------------------

let compared = 0;
let mismatches = 0;
let planted = 0;
let caught = 0;
let accurate = 0;
let falseFlags = 0;
for (const entry of fixture) {
  const c = caseById.get(entry.id);
  if (!c) {
    mismatches++;
    continue;
  }
  const got = checkQuotes(c.essay, play, buildOtherSources(entry.question));
  if (got.length !== entry.results.length) mismatches++;
  entry.results.forEach((want, i) => {
    const have = got[i];
    compared++;
    if (!have || have.quote !== want.quote || have.status !== want.status || (have.correct ?? "") !== (want.correct ?? "") || (have.ratio ?? null) !== (want.ratio ?? null)) mismatches++;
  });
  const flagged = got.filter((q) => q.status === "near" || q.status === "not-found");
  const key = (s: string) => normWords(s).join(" ");
  const plantedAll = new Set([...(entry.plantedQuotes?.misquote ?? []), ...(entry.plantedQuotes?.notInText ?? [])].map(key));
  planted += plantedAll.size;
  caught += new Set(flagged.map((q) => key(q.quote)).filter((k) => plantedAll.has(k))).size;
  falseFlags += flagged.filter((q) => !plantedAll.has(key(q.quote))).length;
  accurate += got.filter((q) => q.status === "ok").length;
}

// ---- 2. replay the approved runs through the app's own code ------------------------------------------------------------

interface RawRecord {
  id: string;
  run: number;
  parsed?: {
    criteria: unknown;
    band: number;
    mark: number;
    focus: "fully" | "partly" | "barely";
    focusReason: string;
    knowledgeErrors: unknown[];
    gaps: unknown[];
    usedWell: string[];
    lift: string[] | string;
    bandReason: string;
  };
}
const nesa = existsSync(path.join(RES, "nesa", "pilot-nesa-2019.json"))
  ? read<{ essays: Array<{ id: string; essay: string }> }>(path.join(RES, "nesa", "pilot-nesa-2019.json")).essays
  : [];
const nesaIds = new Set(nesa.map((e) => e.id));

let replayed = 0;
let replayMismatch = 0;
let replayUnparsed = 0;
for (const run of REPLAY_RUNS) {
  const dir = path.join(RES, "runs", run);
  if (!existsSync(path.join(dir, "raw.jsonl")) || !existsSync(path.join(dir, "rescored.jsonl"))) {
    fail(`run folder ${run} is missing raw.jsonl or rescored.jsonl`);
  }
  const raws = readFileSync(path.join(dir, "raw.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as RawRecord);
  const wanted = readFileSync(path.join(dir, "rescored.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { id: string; run: number; final: number });
  for (const w of wanted) {
    const rec = raws.find((r) => r.id === w.id && r.run === w.run && r.parsed);
    if (!rec?.parsed) {
      replayUnparsed++;
      continue;
    }
    const p = rec.parsed;
    const reply = parseEnglishEssayReply(
      JSON.stringify({
        criteria: p.criteria,
        questionFocus: p.focus,
        questionFocusReason: p.focusReason || "n/a",
        knowledgeErrors: p.knowledgeErrors,
        band: p.band,
        mark: p.mark,
        bandReason: p.bandReason || "n/a",
        liftYourMark: p.lift,
        gaps: p.gaps,
        conceptsUsedWell: p.usedWell,
      }),
    );
    if (!reply) {
      replayUnparsed++;
      continue;
    }
    replayed++;
    const awayCase = caseById.get(w.id);
    let errorCount = 0;
    if (awayCase && !nesaIds.has(w.id)) {
      const quotes = checkQuotes(awayCase.essay, play, buildOtherSources(away.questions[awayCase.question]?.question ?? ""));
      errorCount = mergeKnowledgeErrors(dedupeMarkerErrors(reply.knowledgeErrors, awayCase.essay), quotes).length;
    }
    const final = englishFinalMark({ rawMark: reply.mark, band: reply.band, errorCount, focus: reply.questionFocus });
    if (final.finalMark !== w.final) replayMismatch++;
  }
}

// ---- report ---------------------------------------------------------------------------------------------------------------

const problems: string[] = [];
if (mismatches > 0) problems.push(`${mismatches} quote-check results differ from the Python fixture`);
if (caught < planted) problems.push(`planted errors caught ${caught}/${planted} (need all)`);
if (falseFlags > 0) problems.push(`${falseFlags} false flags over ${accurate} accurate quotations (need 0)`);
if (replayUnparsed > 0) problems.push(`${replayUnparsed} saved replies could not be replayed`);
if (replayMismatch > 0) problems.push(`${replayMismatch} replayed replies gave a different final mark from the Python rescore`);

console.log(`Quote check: ${compared} results compared, ${mismatches} differences; planted errors caught ${caught}/${planted}; false flags ${falseFlags} over ${accurate} accurate quotations.`);
console.log(`Replay: ${replayed} saved replies through the app's parser, quote check and final-mark function; ${replayMismatch} final-mark differences, ${replayUnparsed} not replayable.`);
if (problems.length > 0) {
  console.error(`✗ Parity FAILED:\n  - ${problems.join("\n  - ")}`);
  process.exit(1);
}
console.log("✓ Parity OK");
