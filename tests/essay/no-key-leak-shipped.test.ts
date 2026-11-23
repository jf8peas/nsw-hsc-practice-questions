// Principle I over EVERY shipped essay (spec 010 SC-006): no 40-character run of the marking notes, the school's
// criteria or the model essay appears in the public registry or in the built client output (.next/static). The
// per-request checks (every response before the student's own finished result) are in tests/api/essay-flow.test.ts.
// While no essay is live there is no key and these checks pass vacuously; they guard the first release.

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { getAnswer } from "@/content/answers";
import { UNITS } from "@/content";
import { questions } from "@/content/units/y12-economics-essay-writing/questions";

const RUN = 40;
const squash = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

function firstLeak(secret: string, haystack: string, allowed: string): string | null {
  const k = squash(secret);
  const h = squash(haystack);
  for (let i = 0; i + RUN <= k.length; i += 5) {
    const w = k.slice(i, i + RUN);
    if (h.includes(w) && !allowed.includes(w)) return w;
  }
  return null;
}

const shipped = (questions as Array<{ id: string; prompt: string }>).flatMap((q) => {
  const key = getAnswer(q.id)?.essay;
  return key ? [{ id: q.id, prompt: squash(q.prompt), key }] : [];
});

describe("the public registry", () => {
  it("holds no run of any essay's marking notes, school criteria or model essay", () => {
    const serialised = JSON.stringify(UNITS.find((u) => u.id === "y12-economics-essay-writing") ?? {}) + JSON.stringify(questions);
    for (const e of shipped) {
      for (const [label, secret] of [["notes", e.key.markingNotes], ["school criteria", e.key.schoolCriteria ?? ""], ["model essay", e.key.modelEssay]] as const) {
        if (secret.trim()) expect(firstLeak(secret, serialised, e.prompt), `${e.id} ${label}`).toBeNull();
      }
    }
  });
});

function* files(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* files(full);
    else if (/\.(js|css|html|json|txt)$/.test(entry.name)) yield full;
  }
}

describe("the built client output", () => {
  const out = path.resolve(__dirname, "../../.next/static");
  it.skipIf(!fs.existsSync(out) || shipped.length === 0)("holds no run of any essay's key", () => {
    const text = [...files(out)].map((f) => fs.readFileSync(f, "utf8")).join("\n");
    for (const e of shipped) {
      for (const [label, secret] of [["notes", e.key.markingNotes], ["school criteria", e.key.schoolCriteria ?? ""], ["model essay", e.key.modelEssay]] as const) {
        if (secret.trim()) expect(firstLeak(secret, text, e.prompt), `${e.id} ${label}`).toBeNull();
      }
    }
  });
});

// ---- the English essay unit (spec 011): the same two guards over its marking notes and model essays, and a guard that
// the server-only play text and the marker's Away notes never reach the public registry or the client output. While no
// English essay is live there is no key and the key checks pass vacuously; they guard the first release. ------------------

import rubric from "@/lib/english-essay/rubric.json";
import { questions as englishQuestions } from "@/content/units/y12-english-essay-writing/questions";

const englishShipped = (englishQuestions as Array<{ id: string; prompt: string }>).flatMap((q) => {
  const key = getAnswer(q.id)?.englishEssay;
  return key ? [{ id: q.id, prompt: squash(q.prompt), key }] : [];
});
const AWAY_NOTES = (rubric as { textNotes: { away: string } }).textNotes.away;
const PLAY = path.resolve(__dirname, "../../resources/english-unseen/away-by-michael-gow.txt");

describe("the English essay public registry", () => {
  it("holds no run of any essay's marking notes or model essay, nor of the Away notes", () => {
    const serialised = JSON.stringify(UNITS.find((u) => u.id === "y12-english-essay-writing") ?? {}) + JSON.stringify(englishQuestions);
    for (const e of englishShipped) {
      for (const [label, secret] of [["notes", e.key.markingNotes], ["model essay", e.key.modelEssay]] as const) {
        if (secret.trim()) expect(firstLeak(secret, serialised, e.prompt), `${e.id} ${label}`).toBeNull();
      }
    }
    expect(firstLeak(AWAY_NOTES, serialised, ""), "Away notes").toBeNull();
  });
});

describe("the English essay built client output", () => {
  const out = path.resolve(__dirname, "../../.next/static");
  it.skipIf(!fs.existsSync(out))("holds no run of any essay's key, the Away notes or the play text", () => {
    const text = [...files(out)].map((f) => fs.readFileSync(f, "utf8")).join("\n");
    for (const e of englishShipped) {
      for (const [label, secret] of [["notes", e.key.markingNotes], ["model essay", e.key.modelEssay]] as const) {
        if (secret.trim()) expect(firstLeak(secret, text, e.prompt), `${e.id} ${label}`).toBeNull();
      }
    }
    expect(firstLeak(AWAY_NOTES, text, ""), "Away notes").toBeNull();
    // the play itself: sample a few windows of the local copy (it is never committed, so skip when it is absent)
    if (fs.existsSync(PLAY)) {
      const play = fs.readFileSync(PLAY, "utf8");
      const body = play.slice(play.indexOf("ACT ONE"));
      for (const start of [2000, 20000, 60000, 100000]) {
        const sample = body.slice(start, start + 200);
        if (sample.length >= 100) expect(firstLeak(sample, text, ""), `play window ${start}`).toBeNull();
      }
    }
  });
});
