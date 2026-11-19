// Writes the unseen-text unit's bank files from the content task's bank JSON (spec 008, research R2).
//
//   npm run unseen-build-bank
//
// Reads resources/english-unseen/bank/*.json (gitignored: verbatim school-paper material) and writes
// texts.ts, questions.ts, keys.ts and descriptions.ts into content/units/y12-english-advanced-unseen-texts/.
// Deterministic and idempotent: a second run changes nothing. It never writes description-checks.ts
// (scripts/check-unseen-descriptions.ts owns that) or answers.ts. Run from the repo root.

import fs from "node:fs";
import path from "node:path";

import { UNIT_ID, buildFiles, type BankFile } from "./unseen-build-bank-lib";

const BANK_DIR = path.resolve(process.cwd(), "resources", "english-unseen", "bank");
const UNIT_DIR = path.resolve(process.cwd(), "content", "units", UNIT_ID);

function main(): number {
  if (!fs.existsSync(BANK_DIR)) {
    console.error(`✗ ${BANK_DIR} does not exist. Put the bank files there first.`);
    return 2;
  }
  const names = fs.readdirSync(BANK_DIR).filter((n) => n.endsWith(".json")).sort().reverse(); // newest paper first, so the bank reads in a stable order
  if (names.length === 0) {
    console.error("✗ no bank files (*.json) found.");
    return 2;
  }
  const banks = names.map((n) => JSON.parse(fs.readFileSync(path.join(BANK_DIR, n), "utf8")) as BankFile);
  let files;
  try {
    files = buildFiles(banks);
  } catch (error) {
    console.error(`✗ ${(error as Error).message}`);
    return 1;
  }
  fs.mkdirSync(UNIT_DIR, { recursive: true });
  let changed = 0;
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(UNIT_DIR, name);
    const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
    if (current !== content) {
      fs.writeFileSync(target, content, "utf8");
      changed += 1;
      console.log(`  wrote ${name}`);
    }
  }
  const questionCount = banks.reduce((n, b) => n + b.questions.length, 0);
  console.log(`✓ ${questionCount} question(s) from ${names.length} bank file(s); ${changed} file(s) changed.`);
  return 0;
}

process.exitCode = main();
