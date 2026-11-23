import { describe, expect, it } from "vitest";

import {
  ENGLISH_SCAFFOLD_CAP,
  ENGLISH_SCAFFOLD_FIELD_MAX_CHARS,
  emptyEnglishEssayScaffold,
  sanitiseEnglishEssayScaffold,
  scaffoldCounter,
  scaffoldWords,
  validateEnglishScaffold,
} from "@/lib/english-essay/scaffold";

const w = (n: number) => Array.from({ length: n }, () => "w").join(" ");

describe("the English scaffold shape", () => {
  it("has exactly seven string fields and no conclusion", () => {
    const s = emptyEnglishEssayScaffold();
    expect(Object.keys(s).sort()).toEqual(["body", "thesis"]);
    expect(s.body).toHaveLength(3);
    for (const b of s.body) expect(Object.keys(b).sort()).toEqual(["claim", "evidence"]);
  });

  it("sanitises: drops unknown keys, caps each field, fills missing fields and rejects non-strings", () => {
    const out = sanitiseEnglishEssayScaffold({ thesis: "t", conclusion: "x", extra: 1, body: [{ claim: "c", evidence: "e", more: 2 }] });
    expect(out).toEqual({ thesis: "t", body: [{ claim: "c", evidence: "e" }, { claim: "", evidence: "" }, { claim: "", evidence: "" }] });
    const long = sanitiseEnglishEssayScaffold({ thesis: "a".repeat(ENGLISH_SCAFFOLD_FIELD_MAX_CHARS + 50) });
    expect(long!.thesis).toHaveLength(ENGLISH_SCAFFOLD_FIELD_MAX_CHARS);
    expect(sanitiseEnglishEssayScaffold({ thesis: 5 })).toBeNull();
    expect(sanitiseEnglishEssayScaffold({ thesis: "t", body: [{ claim: 3 }] })).toBeNull();
    expect(sanitiseEnglishEssayScaffold({ thesis: "t", body: "nope" })).toBeNull();
    expect(sanitiseEnglishEssayScaffold({ thesis: "t", body: [null] })).toBeNull();
    expect(sanitiseEnglishEssayScaffold(null)).toBeNull();
    expect(sanitiseEnglishEssayScaffold([])).toBeNull();
  });
});

describe("word count and validation", () => {
  const withWords = (n: number, thesis = "a thesis") => {
    const s = emptyEnglishEssayScaffold();
    s.thesis = thesis;
    s.body[0].claim = w(n - countOf(thesis));
    return s;
  };
  const countOf = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

  it("sums the shared word count over all seven fields", () => {
    const s = emptyEnglishEssayScaffold();
    s.thesis = "one two";
    s.body[0] = { claim: "three", evidence: "four five" };
    s.body[2] = { claim: "six", evidence: "" };
    expect(scaffoldWords(s)).toBe(6);
  });

  it("save accepts 0 to 150 words, including an empty thesis, and refuses 151 without storing", () => {
    expect(validateEnglishScaffold(emptyEnglishEssayScaffold(), "save")).toEqual({ ok: true, reasons: [], words: 0 });
    expect(validateEnglishScaffold(withWords(150), "save")).toMatchObject({ ok: true, words: 150 });
    expect(validateEnglishScaffold(withWords(151), "save")).toMatchObject({ ok: false, reasons: ["over_cap"], words: 151 });
    expect(ENGLISH_SCAFFOLD_CAP).toBe(150);
  });

  it("start and review also need a non-blank thesis; claims and evidence are never compulsory", () => {
    for (const mode of ["start", "review"] as const) {
      expect(validateEnglishScaffold(emptyEnglishEssayScaffold(), mode).reasons).toEqual(["no_thesis"]);
      const ws = emptyEnglishEssayScaffold();
      ws.thesis = "   \n ";
      expect(validateEnglishScaffold(ws, mode).reasons).toEqual(["no_thesis"]);
      expect(validateEnglishScaffold(withWords(150), mode)).toMatchObject({ ok: true });
      const both = withWords(151, "   ");
      expect(validateEnglishScaffold(both, mode).reasons).toEqual(["over_cap", "no_thesis"]);
    }
  });

  it("a restored over-cap draft stays invalid", () => {
    expect(validateEnglishScaffold(withWords(200), "save").ok).toBe(false);
  });
});

describe("the scaffold counter wording", () => {
  it("shows the count against 150 and the words to cut", () => {
    expect(scaffoldCounter(150)).toEqual({ over: false, text: "150 / 150 words" });
    expect(scaffoldCounter(151)).toEqual({ over: true, text: "151 / 150 words, cut 1 word" });
    expect(scaffoldCounter(160)).toEqual({ over: true, text: "160 / 150 words, cut 10 words" });
  });
});
