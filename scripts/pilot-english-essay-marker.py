#!/usr/bin/env python3
"""
Pilot the AI marker for the English essay unit (Advanced Paper 1 Section II, prescribed text Away)
before the spec is written.

Two sets of labelled essays go through the DRAFT marking prompt in lib/english-essay/rubric.json,
several runs each, with the app's OpenRouter setup (OPENROUTER_API_KEY, temperature 0, JSON reply):

  nesa : 10 real student essays from NESA's HSC standards materials (2019 Q6, other prescribed texts),
         resources/english-essay/nesa/pilot-nesa-2019.json. Tests band placement on real writing.
  away : 6 Away essays written at target bands with planted faults,
         resources/english-essay/pilot-away.json. Tests question focus, knowledge errors, gaps
         and the code-side quote check against the play's text.

Per essay the report shows every run's final mark, the median, whether it is in the labelled range,
the spread, the question-focus verdict, knowledge errors, gap ids and (Away) the quote check.

Usage (repo root, Git Bash):
  python scripts/pilot-english-essay-marker.py --check               # offline: data, prompts, quote check
  python scripts/pilot-english-essay-marker.py --show-prompt away-a-strong
  python scripts/pilot-english-essay-marker.py                       # full run, 3 runs per essay
  python scripts/pilot-english-essay-marker.py --runs 5 --only away-c
  python scripts/pilot-english-essay-marker.py --set away

Model: --model, else ENGLISH_ESSAY_GRADING_MODEL, else openai/gpt-6.2-sol. Standard library only.
The key is read from the environment, then .env.local, then .env, and is never printed.
Results go to resources/english-essay/runs/<timestamp>/ (report.md + raw.jsonl).
"""

from __future__ import annotations

import argparse
import concurrent.futures as cf
import datetime as dt
import difflib
import json
import os
import re
import statistics
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
RUBRIC_PATH = REPO / "lib" / "english-essay" / "rubric.json"
CONCEPTS_SCRIPT = REPO / "scripts" / "english-essay-concepts-json.ts"
GOLDEN_PATH = REPO / "tests" / "fixtures" / "english-essay-golden-prompt.txt"
HASH_PATH = REPO / "tests" / "fixtures" / "english-essay-rubric.hash"
QUOTE_FIXTURE_PATH = REPO / "resources" / "english-essay" / "quote-parity.json"
NESA_PATH = REPO / "resources" / "english-essay" / "nesa" / "pilot-nesa-2019.json"
AWAY_PATH = REPO / "resources" / "english-essay" / "pilot-away.json"
PLAY_PATH = REPO / "resources" / "english-unseen" / "away-by-michael-gow.txt"
RUNS_DIR = REPO / "resources" / "english-essay" / "runs"

ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-6.2-sol"  # chosen 23 Nov 2026 (pilot p5); DeepSeek v4.1 Flash was 1-3 marks harsh on real scripts
TIMEOUT_S = 75
MAX_TOKENS = 8000

RUBRIC = json.loads(RUBRIC_PATH.read_text(encoding="utf-8"))


def load_concepts() -> dict:
    """The ONE concept record (content/units/y12-english-essay-writing/concepts.ts), dumped by the app's own code so the
    pilot cannot drift from the app (spec 011 T005). Needs Node: `npx tsx` is already a project dependency."""
    import shutil
    import subprocess
    npx = shutil.which("npx") or shutil.which("npx.cmd")
    if not npx:
        sys.exit("npx not found: install Node to read the concept list")
    done = subprocess.run([npx, "tsx", str(CONCEPTS_SCRIPT)], cwd=REPO, capture_output=True, text=True, encoding="utf-8")
    if done.returncode != 0:
        sys.exit(f"could not read the concept list: {done.stderr.strip()[:300]}")
    return json.loads(done.stdout)


CONCEPTS = load_concepts()
CRITERIA = list(RUBRIC["criteria"].keys())
VERDICTS = set(RUBRIC["verdicts"])
FOCUS = set(RUBRIC["questionFocusLevels"])
FOCUS_CAPS = RUBRIC["questionFocusCaps"]
BANDS = {b["band"]: b for b in RUBRIC["bands"]}
NO_NOTES = "No notes provided for this text: rely on your own knowledge of it, and do not count anything as a knowledge error unless you are certain it is wrong."


# ---- helpers -----------------------------------------------------------------------------------


def count_words(text: str) -> int:
    t = text.strip()
    return len(t.split()) if t else 0


def load_env_value(name: str) -> str | None:
    v = os.environ.get(name, "").strip()
    if v:
        return v
    for fname in (".env.local", ".env"):
        p = REPO / fname
        if p.exists():
            for line in p.read_text(encoding="utf-8").splitlines():
                m = re.match(rf"\s*{name}\s*=\s*(.*)$", line)
                if m and m.group(1).strip().strip('"').strip("'"):
                    return m.group(1).strip().strip('"').strip("'")
    return None


def render(template: str, values: dict) -> str:
    return re.sub(r"\{(\w+)\}", lambda m: str(values[m.group(1)]) if m.group(1) in values else m.group(0), template)


# Pilot questions that are also shipped essays: with --notes-from, the shipped marking notes replace the
# pilot's, so the gate measures the notes students will actually be marked with.
SHIPPED_ESSAY_FOR_QUESTION = {"knox-2025": "e1", "pymble-2024": "e2", "abbotsleigh-2025": "e3", "fortst-2023": "e4"}
NOTES_FROM: Path | None = None


def shipped_notes(question_id: str) -> str | None:
    if NOTES_FROM is None or question_id not in SHIPPED_ESSAY_FOR_QUESTION:
        return None
    f = NOTES_FROM / f"{SHIPPED_ESSAY_FOR_QUESTION[question_id]}.json"
    return json.loads(f.read_text(encoding="utf-8"))["markingNotes"] if f.exists() else None


def load_cases(which: str) -> list[dict]:
    """Every case as {id, set, question, textTitle, textNotes, markingNotes, essay, expected, ...}."""
    cases = []
    if which in ("all", "nesa"):
        for e in json.loads(NESA_PATH.read_text(encoding="utf-8"))["essays"]:
            concept = re.search(r"understanding of (\w+)\?", e["question"] or "")
            cases.append({
                "id": e["id"], "set": "nesa",
                "question": e["question"] or "Analyse how your prescribed text represents human experiences.",
                "textTitle": e["prescribedText"], "textNotes": NO_NOTES,
                "markingNotes": (f"The question names {concept.group(1)}. A strong answer takes a position on 'to what extent' and analyses how specific features of the text reshape the student's understanding of {concept.group(1)}." if concept else "A strong answer analyses how specific features of the text represent human experiences."),
                "essay": e["essay"], "expected": e["expectedMarkRange"], "label": f"NESA Band {e['nesaBand']}: {e['nesaAnnotation']}",
            })
    if which in ("all", "away"):
        data = json.loads(AWAY_PATH.read_text(encoding="utf-8"))
        for c in data["cases"]:
            q = data["questions"][c["question"]]
            cases.append({
                "id": c["id"], "set": "away", "question": q["question"], "questionSource": q["source"],
                "textTitle": "Away (Michael Gow), drama", "textNotes": RUBRIC["textNotes"]["away"],
                "markingNotes": shipped_notes(c["question"]) or q["markingNotes"], "notesSource": "shipped" if shipped_notes(c["question"]) else "pilot",
                "essay": c["essay"], "expected": c["expectedMarkRange"],
                "label": c["label"], "expectFocus": c.get("questionFocus"),
                "knowledgeErrorContains": c.get("knowledgeErrorContains"), "plantedQuotes": c.get("plantedQuotes"),
            })
    return cases


def build_messages(case: dict) -> list[dict]:
    values = {
        "question": case["question"], "textTitle": case["textTitle"], "textNotes": case["textNotes"],
        "bands": "\n".join(f"Band {b['band']} ({b['min']}-{b['max']}): {b['descriptor']}" for b in RUBRIC["bands"]),
        "criteria": "\n".join(f"- {k}: {v}" for k, v in RUBRIC["criteria"].items()),
        "markingNotes": case["markingNotes"],
        "concepts": "\n".join(f"- {k}: {v}" for k, v in CONCEPTS.items()),
        "words": count_words(case["essay"]), "essay": case["essay"], "maxGaps": RUBRIC["maxGaps"],
    }
    return [{"role": "system", "content": RUBRIC["system"]},
            {"role": "user", "content": render(RUBRIC["userTemplate"], values)}]


# ---- quote check (code, not the model) -----------------------------------------------------------

_QUOTE_RE = re.compile(
    r'"([^"\n]{3,400})"'
    r'|\u201c([^\u201d\n]{3,400})\u201d'
    # single quotes: an apostrophe between two letters (I'm, don't, Tom's) stays inside the quotation
    r"|(?<![A-Za-z0-9])['\u2018]((?:[^'\u2018\u2019\n]|(?<=[A-Za-z])['\u2019](?=[A-Za-z])){3,300}?)['\u2019](?![A-Za-z0-9])"
)


def norm_words(s: str) -> list[str]:
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"').lower()
    s = re.sub(r"[^a-z0-9' ]+", " ", s)
    return [w.strip("'") for w in s.split() if w.strip("'")]


class Play:
    def __init__(self, path: Path | None = None, text: str | None = None):
        raw = path.read_text(encoding="utf-8") if path is not None else (text or "")
        body = raw[raw.find("ACT ONE"):] if "ACT ONE" in raw else raw
        self.raw_words = body.split()
        self.words, self.index = [], []  # normalised words and the raw-word index they came from
        for i, w in enumerate(self.raw_words):
            for n in norm_words(w):
                self.words.append(n)
                self.index.append(i)
        self.joined = " " + " ".join(self.words) + " "

    def found(self, segment: list[str]) -> bool:
        return (" " + " ".join(segment) + " ") in self.joined

    def nearest(self, q: list[str]) -> tuple[float, str]:
        """Best fuzzy window of the same length (+/-2 words); returns (ratio, the play's own words)."""
        n, best, where = len(q), 0.0, (0, 0)
        target = " ".join(q)
        first = set(q[:3]) | set(q[-3:])
        for i in range(len(self.words)):
            if self.words[i] not in first and i + n - 1 < len(self.words) and self.words[min(i + n - 1, len(self.words) - 1)] not in first:
                continue
            for m in (n - 2, n - 1, n, n + 1, n + 2):
                if m < 2 or i + m > len(self.words):
                    continue
                r = difflib.SequenceMatcher(None, target, " ".join(self.words[i:i + m])).ratio()
                if r > best:
                    best, where = r, (i, i + m)
        a, b = where
        raw = " ".join(self.raw_words[self.index[a]: self.index[b - 1] + 1]) if b > a else ""
        return best, raw


MISQUOTE_RATIO = 0.75  # below this, no close match: "check this quote"
EXCLUSIONS_PATH = REPO / "lib" / "english-essay" / "quote-exclusions.json"
QUOTE_EXCLUSIONS = json.loads(EXCLUSIONS_PATH.read_text(encoding="utf-8"))["phrases"] if EXCLUSIONS_PATH.exists() else []


def other_sources(question: str) -> Play:
    """The question's own wording and common syllabus phrases: quoting these is not quoting the play."""
    return Play(text="\n".join([question, *QUOTE_EXCLUSIONS]))


def check_quotes(essay: str, play: Play, others: Play | None = None) -> list[dict]:
    """Status per quotation: ok (in the play), other-source (the question or a syllabus phrase; no flag,
    no penalty), misquote (near the play: show the play's words, no penalty), not-found (a knowledge error)."""
    out = []
    for m in _QUOTE_RE.finditer(essay):
        q = next(g for g in m.groups() if g)
        words = norm_words(q)
        if len(words) < 3:
            continue
        segments = [norm_words(s) for s in re.split(r"\.\.\.|…|/", q)]
        segments = [s for s in segments if len(s) >= 2]
        if segments and all(play.found(s) for s in segments):
            out.append({"quote": q, "status": "ok"})
            continue
        if others is not None and others.words:
            if (segments and all(others.found(s) for s in segments)) or others.nearest(words)[0] >= MISQUOTE_RATIO:
                out.append({"quote": q, "status": "other-source"})
                continue
        ratio, near = play.nearest(words)
        if ratio >= MISQUOTE_RATIO:
            out.append({"quote": q, "status": "misquote", "correct": near, "ratio": round(ratio, 2)})
        else:
            out.append({"quote": q, "status": "not-found", "ratio": round(ratio, 2)})
    return out


# ---- model call --------------------------------------------------------------------------------


def call_model(key: str, model: str, messages: list[dict]) -> tuple[str | None, str | None, str | None]:
    body = json.dumps({"model": model, "messages": messages, "temperature": 0, "max_tokens": MAX_TOKENS,
                       "response_format": {"type": "json_object"}}).encode("utf-8")
    req = urllib.request.Request(ENDPOINT, data=body, method="POST", headers={
        "authorization": f"Bearer {key}", "content-type": "application/json",
        "HTTP-Referer": "https://nsw-hsc-practice.vercel.app", "X-Title": "NSW HSC Practice (English essay marker pilot)"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as res:
            data = json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return None, f"http {e.code}: {e.read().decode('utf-8', 'replace')[:200]}", None
    except Exception as e:
        return None, f"{type(e).__name__}: {str(e)[:200]}", None
    try:
        content = data["choices"][0]["message"]["content"]
        finish = data["choices"][0].get("finish_reason")
    except (KeyError, IndexError, TypeError):
        return None, f"no content: {json.dumps(data)[:200]}", None
    if not isinstance(content, str) or not content.strip():
        return None, f"empty content: {json.dumps(data)[:200]}", finish
    if finish == "length":
        return None, "cut off at max_tokens (finish_reason length)", finish
    return content, None, finish


def parse_reply(content: str) -> tuple[dict | None, str | None]:
    s, e = content.find("{"), content.rfind("}")
    if s == -1 or e <= s:
        return None, "no JSON object"
    try:
        obj = json.loads(content[s:e + 1])
    except json.JSONDecodeError:
        return None, "bad JSON"
    crit = obj.get("criteria") or {}
    verdicts = {}
    for c in CRITERIA:
        v = crit.get(c)
        verdict = v.get("verdict") if isinstance(v, dict) else None
        if verdict not in VERDICTS:
            return None, f"criterion {c}: verdict {verdict!r}"
        verdicts[c] = {"verdict": verdict, "reason": v.get("reason", "")}
    band, mark, focus = obj.get("band"), obj.get("mark"), obj.get("questionFocus")
    if not isinstance(band, int) or band not in BANDS:
        return None, f"band {band!r}"
    if not isinstance(mark, int) or not 0 <= mark <= 20:
        return None, f"mark {mark!r}"
    if focus not in FOCUS:
        return None, f"questionFocus {focus!r}"
    gaps, errs, used = obj.get("gaps") or [], obj.get("knowledgeErrors") or [], obj.get("conceptsUsedWell") or []
    if not all(isinstance(x, list) for x in (gaps, errs, used)):
        return None, "gaps, knowledgeErrors or conceptsUsedWell not a list"
    lift = obj.get("liftYourMark")
    return {"criteria": verdicts, "band": band, "mark": mark, "focus": focus,
            "focusReason": obj.get("questionFocusReason", ""),
            "knowledgeErrors": [x for x in errs if isinstance(x, dict)],
            "gaps": [g for g in gaps if isinstance(g, dict)], "usedWell": [u for u in used if isinstance(u, str)],
            "lift": [lift] if isinstance(lift, str) else (lift if isinstance(lift, list) else []),
            "bandReason": obj.get("bandReason", "")}, None


KNOWLEDGE_ERROR_STEP = RUBRIC["knowledgeErrorPenalty"]["perError"]
KNOWLEDGE_ERROR_MAX = RUBRIC["knowledgeErrorPenalty"]["max"]
KNOWLEDGE_ERROR_CAP = RUBRIC["knowledgeErrorPenalty"]["capAtTwo"]


INVENTED_QUOTE_IS_ERROR = RUBRIC.get("inventedQuoteIsKnowledgeError", False)


def final_mark(parsed: dict, has_notes: bool = True, invented_quotes: int = 0) -> int:
    """What the app would record: mark clamped into its band, minus the knowledge-error penalty, then the caps.
    The penalty applies only when the marker had notes on the text to check against (always, in the app:
    Away has notes). For the NESA calibration essays on other texts its error lists are guesses."""
    b = BANDS[parsed["band"]]
    mark = min(max(parsed["mark"], b["min"]), b["max"])
    n_err = (len(parsed["knowledgeErrors"]) + (invented_quotes if INVENTED_QUOTE_IS_ERROR else 0)) if has_notes else 0
    mark -= min(n_err * KNOWLEDGE_ERROR_STEP, KNOWLEDGE_ERROR_MAX)
    if n_err >= 2:
        mark = min(mark, KNOWLEDGE_ERROR_CAP)
    cap = FOCUS_CAPS.get(parsed["focus"])
    if cap:
        mark = min(mark, cap)
    return max(mark, 1)


def mark_once(key: str, model: str, case: dict, run: int) -> dict:
    t0 = time.time()
    rec = {"id": case["id"], "run": run}
    for attempt in (1, 2):  # a malformed reply is retried once, as in the app
        content, err, finish = call_model(key, model, build_messages(case))
        rec["finish"] = finish
        if err:
            rec.update(error=err, attempt=attempt)
            continue
        parsed, problem = parse_reply(content)
        if problem:
            rec.update(error=f"malformed: {problem}", attempt=attempt, rawReply=content[:2000])
            continue
        rec.pop("error", None)
        rec.update(parsed=parsed, final=final_mark(parsed, case["textNotes"] != NO_NOTES, case.get("inventedQuotes", 0)), attempt=attempt)
        break
    rec["seconds"] = round(time.time() - t0, 1)
    return rec


# ---- report ------------------------------------------------------------------------------------


def summarise(cases: list[dict], records: list[dict], play: Play) -> tuple[str, dict]:
    by_id: dict[str, list[dict]] = {}
    for r in records:
        by_id.setdefault(r["id"], []).append(r)
    lines, tally = [], {"cases": 0, "inRange": 0, "within2": 0, "generous": 0, "maxSpread": 0, "errors": 0,
                        "focusOk": 0, "focusChecks": 0, "kErrOk": 0, "kErrChecks": 0,
                        "badGapIds": 0, "awayIdsOnNesa": 0, "quoteCaught": 0, "quotePlanted": 0, "quoteFalse": 0}
    for c in cases:
        recs = sorted(by_id.get(c["id"], []), key=lambda r: r["run"])
        good = [r for r in recs if "parsed" in r]
        tally["errors"] += len(recs) - len(good)
        lo, hi = c["expected"]
        lines.append(f"\n### {c['id']} ({c['set']}) expected {lo}-{hi}\n")
        lines.append(f"_{c['label']}_\n")
        if not good:
            lines.append("- no usable reply\n")
            continue
        tally["cases"] += 1
        finals = [r["final"] for r in good]
        med = statistics.median(finals)
        spread = max(finals) - min(finals)
        tally["inRange"] += lo <= med <= hi
        tally["within2"] += all(lo - 2 <= f <= hi + 1 for f in finals)
        tally["generous"] += med > hi
        tally["maxSpread"] = max(tally["maxSpread"], spread)
        lines.append(f"- marks {finals} (raw {[r['parsed']['mark'] for r in good]}), median {med}, "
                     f"{'IN' if lo <= med <= hi else 'OUT OF'} range, spread {spread}\n")
        lines.append(f"- focus {[r['parsed']['focus'] for r in good]}; criteria " + "; ".join(
            f"{k} " + "/".join({"strong": "St", "sound": "So", "developing": "D", "weak": "W"}[r['parsed']['criteria'][k]['verdict']] for r in good) for k in CRITERIA) + "\n")
        if c.get("expectFocus"):
            tally["focusChecks"] += 1
            ok = all(r["parsed"]["focus"] in c["expectFocus"] for r in good)
            tally["focusOk"] += ok
            lines.append(f"- focus check (expect {c['expectFocus']}): {'PASS' if ok else 'FAIL'}\n")
        errs = [e for r in good for e in r["parsed"]["knowledgeErrors"]]
        if errs:
            lines.append("- knowledge errors: " + " | ".join(f"\"{e.get('quote','')[:60]}\": {e.get('why','')[:80]}" for e in errs[:4]) + "\n")
        if c.get("knowledgeErrorContains"):
            tally["kErrChecks"] += 1
            ok = all(any(all(s.lower() in (e.get("quote", "") + " " + e.get("why", "")).lower() for s in c["knowledgeErrorContains"])
                         for e in r["parsed"]["knowledgeErrors"]) for r in good)
            tally["kErrOk"] += ok
            lines.append(f"- knowledge-error check (mentions {c['knowledgeErrorContains']}): {'PASS' if ok else 'FAIL'}\n")
        gap_ids = [g.get("concept") for r in good for g in r["parsed"]["gaps"]]
        bad = [g for g in gap_ids if g not in CONCEPTS]
        tally["badGapIds"] += len(bad)
        if c["set"] == "nesa":
            tally["awayIdsOnNesa"] += sum(1 for g in gap_ids if str(g).startswith("away-"))
        lines.append(f"- gaps (run 1): {[g.get('concept') for g in good[0]['parsed']['gaps']]}" + (f"; NOT ON LIST: {bad}" if bad else "") + "\n")
        lines.append(f"- lift (run 1): {good[0]['parsed']['lift']}\n")
        if c["set"] == "away":
            qc = check_quotes(c["essay"], play, other_sources(c["question"]))
            flagged = [q for q in qc if q["status"] in ("misquote", "not-found")]
            planted = c.get("plantedQuotes") or {}
            planted_all = {" ".join(norm_words(p)) for k in ("misquote", "notInText") for p in planted.get(k, [])}
            caught = {" ".join(norm_words(q["quote"])) for q in flagged} & planted_all
            false = [q for q in flagged if " ".join(norm_words(q["quote"])) not in planted_all]
            tally["quotePlanted"] += len(planted_all)
            tally["quoteCaught"] += len(caught)
            tally["quoteFalse"] += len(false)
            lines.append(f"- quote check: {len(qc)} quotes, {len(flagged)} flagged, planted caught {len(caught)}/{len(planted_all)}, false flags {len(false)}\n")
            for q in flagged:
                lines.append(f"  - {q['status']}: \"{q['quote']}\"" + (f" -> \"{q['correct']}\" ({q['ratio']})" if q['status'] == 'misquote' else f" (best {q['ratio']})") + "\n")
    return "".join(lines), tally


# ---- release fixtures (spec 011 T040, T070) -------------------------------------------------------------

GOLDEN_CASE = {
    "question": "SYNTHETIC QUESTION for the golden prompt.", "textTitle": "Away (Michael Gow), drama",
    "textNotes": "SYNTHETIC AWAY NOTES for the golden prompt.", "markingNotes": "SYNTHETIC MARKING NOTES for the golden prompt.",
    "essay": "SYNTHETIC ESSAY text {with} braces and one two three four five.",
}


def golden_text() -> str:
    """The marker prompt rendered with synthetic notes only: no protected note, play line or pilot essay is in it."""
    return "\n\n=====\n\n".join(f"[{m['role']}]\n{m['content']}" for m in build_messages(GOLDEN_CASE)) + "\n"


def rubric_hash() -> str:
    """SHA-256 of the canonical rubric plus the one concept record: any prompt or concept edit changes it."""
    import hashlib
    canon = json.dumps({"rubric": RUBRIC, "concepts": CONCEPTS}, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canon.encode("utf-8")).hexdigest()


def hash_text() -> str:
    return json.dumps({"promptVersion": RUBRIC["promptVersion"], "sha256": rubric_hash()}, indent=2) + "\n"


def quote_fixture(play: Play) -> list[dict]:
    """Expected quote-check results for every Away pilot essay, in the app's status names (misquote is `near`)."""
    out = []
    for c in load_cases("away"):
        results = []
        for q in check_quotes(c["essay"], play, other_sources(c["question"])):
            r = {"quote": q["quote"], "status": "near" if q["status"] == "misquote" else q["status"]}
            if "correct" in q:
                r["correct"] = q["correct"]
            if "ratio" in q:
                r["ratio"] = q["ratio"]
            results.append(r)
        out.append({"id": c["id"], "question": c["question"], "plantedQuotes": c.get("plantedQuotes"), "results": results})
    return out


def gate(t: dict) -> list[str]:
    fails = []
    if t["cases"] and t["inRange"] < max(1, round(0.8 * t["cases"])):
        fails.append(f"median in range {t['inRange']}/{t['cases']} (need 80%)")
    if t["generous"]:
        fails.append(f"{t['generous']} essays with a median ABOVE their range (the marker must not be generous)")
    if t["within2"] < t["cases"]:
        fails.append(f"every run within [low-2, high+1]: {t['within2']}/{t['cases']}")
    if t["maxSpread"] > 4:
        fails.append(f"max spread {t['maxSpread']} (need <= 4)")
    if t["focusOk"] < t["focusChecks"]:
        fails.append(f"question-focus checks {t['focusOk']}/{t['focusChecks']}")
    if t["kErrOk"] < t["kErrChecks"]:
        fails.append(f"knowledge-error checks {t['kErrOk']}/{t['kErrChecks']}")
    if t["badGapIds"] or t["awayIdsOnNesa"]:
        fails.append(f"gap ids off list {t['badGapIds']}, Away ids on NESA essays {t['awayIdsOnNesa']}")
    if t["quoteCaught"] < t["quotePlanted"] or t["quoteFalse"]:
        fails.append(f"quote check caught {t['quoteCaught']}/{t['quotePlanted']}, false flags {t['quoteFalse']}")
    if t["errors"]:
        fails.append(f"{t['errors']} runs with no usable reply after a retry")
    return fails


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--only", default="", help="run cases whose id starts with one of these comma-separated prefixes")
    ap.add_argument("--set", default="all", choices=["all", "nesa", "away"])
    ap.add_argument("--model", default="")
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--show-prompt", default="")
    ap.add_argument("--notes-from", default="", help="folder of shipped content (eN.json); its markingNotes replace the pilot notes for questions 1-4")
    ap.add_argument("--write-golden", action="store_true", help="write tests/fixtures/english-essay-golden-prompt.txt and english-essay-rubric.hash (synthetic notes only)")
    ap.add_argument("--write-quote-fixture", action="store_true", help="write the gitignored resources/english-essay/quote-parity.json from the local play and pilot essays")
    ap.add_argument("--rescore", default="", help="recompute final marks from a run folder's raw.jsonl with the current caps and penalties")
    a = ap.parse_args()
    global NOTES_FROM
    NOTES_FROM = Path(a.notes_from) if a.notes_from else None

    prefixes = [x for x in a.only.split(",") if x] or [""]
    cases = [c for c in load_cases(a.set) if any(c["id"].startswith(x) for x in prefixes)]
    play = Play(PLAY_PATH)
    for c in cases:
        if c["set"] == "away":
            c["inventedQuotes"] = sum(1 for q in check_quotes(c["essay"], play, other_sources(c["question"])) if q["status"] == "not-found")
    if a.rescore:
        src = Path(a.rescore)
        recs = [json.loads(l) for l in (src / "raw.jsonl").open(encoding="utf-8")]
        byid = {c["id"]: c for c in load_cases("all")}
        for c in byid.values():
            if c["set"] == "away":
                c["inventedQuotes"] = sum(1 for q in check_quotes(c["essay"], play, other_sources(c["question"])) if q["status"] == "not-found")
        for r in recs:
            if "parsed" in r:
                c = byid[r["id"]]
                r["final"] = final_mark(r["parsed"], c["textNotes"] != NO_NOTES, c.get("inventedQuotes", 0))
        # replay fixture for the TypeScript port: same replies, same expected final marks (gitignored run folder)
        with (src / "rescored.jsonl").open("w", encoding="utf-8") as fx:
            for r in recs:
                if "parsed" in r:
                    fx.write(json.dumps({"id": r["id"], "run": r["run"], "final": r["final"],
                                         "inventedQuotes": byid[r["id"]].get("inventedQuotes", 0)}) + "\n")
        ids = {r["id"] for r in recs}
        cs = [byid[i] for i in byid if i in ids]
        body, tally = summarise(cs, recs, play)
        fails = gate(tally)
        print(f"Rescored {src.name} with current code: in range {tally['inRange']}/{tally['cases']}, above range {tally['generous']}, "
              f"focus {tally['focusOk']}/{tally['focusChecks']}, gate {'PASSED' if not fails else 'FAILED: ' + '; '.join(fails)}")
        print(body)
        return 0
    if a.write_golden:
        GOLDEN_PATH.parent.mkdir(parents=True, exist_ok=True)
        GOLDEN_PATH.write_text(golden_text(), encoding="utf-8", newline="\n")
        HASH_PATH.write_text(hash_text(), encoding="utf-8", newline="\n")
        print(f"wrote {GOLDEN_PATH.relative_to(REPO)} and {HASH_PATH.relative_to(REPO)} for prompt {RUBRIC['promptVersion']}")
        return 0
    if a.write_quote_fixture:
        QUOTE_FIXTURE_PATH.parent.mkdir(parents=True, exist_ok=True)
        fx = quote_fixture(play)
        QUOTE_FIXTURE_PATH.write_text(json.dumps(fx, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        total = sum(len(f["results"]) for f in fx)
        print(f"wrote {QUOTE_FIXTURE_PATH.relative_to(REPO)}: {len(fx)} essays, {total} quotations (gitignored; never commit it)")
        return 0
    if a.show_prompt:
        c = next(c for c in load_cases("all") if c["id"] == a.show_prompt)
        for m in build_messages(c):
            print(f"--- {m['role']} ---\n{m['content']}\n")
        return 0
    if a.check:
        for c in cases:
            build_messages(c)
            line = f"{c['id']:28} {count_words(c['essay']):5} words  expected {c['expected']}" + (f"  notes {c['notesSource']}" if c["set"] == "away" else "")
            if c["set"] == "away":
                qc = check_quotes(c["essay"], play, other_sources(c["question"]))
                line += f"  quotes {len(qc)}, flagged {[q['quote'][:40] for q in qc if q['status'] in ('misquote', 'not-found')]}"
            print(line)
        problems = []
        if not GOLDEN_PATH.exists() or GOLDEN_PATH.read_text(encoding="utf-8") != golden_text():
            problems.append("golden prompt fixture is missing or out of date (run --write-golden)")
        if not HASH_PATH.exists() or HASH_PATH.read_text(encoding="utf-8") != hash_text():
            problems.append("rubric hash fixture is missing or out of date: a prompt or concept edit needs a new promptVersion, then --write-golden and the full marker gate")
        if not QUOTE_FIXTURE_PATH.exists():
            problems.append("quote parity fixture is missing (run --write-quote-fixture)")
        elif json.loads(QUOTE_FIXTURE_PATH.read_text(encoding="utf-8")) != quote_fixture(play):
            problems.append("quote parity fixture differs from the current quote check (run --write-quote-fixture)")
        for p in problems:
            print(f"DRIFT: {p}")
        print(f"prompt {RUBRIC['promptVersion']}, {len(CONCEPTS)} concepts, {len(cases)} cases: {'OK' if not problems else 'FAILED'}")
        return 0 if not problems else 1

    key = load_env_value("OPENROUTER_API_KEY")
    if not key:
        print("OPENROUTER_API_KEY not found (environment, .env.local or .env)", file=sys.stderr)
        return 2
    model = a.model or load_env_value("ENGLISH_ESSAY_GRADING_MODEL") or DEFAULT_MODEL
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    out = RUNS_DIR / stamp
    out.mkdir(parents=True, exist_ok=True)
    jobs = [(c, r) for c in cases for r in range(1, a.runs + 1)]
    print(f"{len(jobs)} calls, model {model}, prompt {RUBRIC['promptVersion']} -> {out.relative_to(REPO)}", flush=True)
    records = []
    with cf.ThreadPoolExecutor(max_workers=a.workers) as ex, (out / "raw.jsonl").open("w", encoding="utf-8") as raw:
        futs = {ex.submit(mark_once, key, model, c, r): (c, r) for c, r in jobs}
        for f in cf.as_completed(futs):
            rec = f.result()
            records.append(rec)
            raw.write(json.dumps(rec, ensure_ascii=False) + "\n")
            raw.flush()
            print(f"  {rec['id']} run {rec['run']}: {rec.get('final', rec.get('error'))} ({rec['seconds']}s)", flush=True)
    body, tally = summarise(cases, records, play)
    fails = gate(tally)
    secs = sorted(r["seconds"] for r in records)
    head = (f"# English essay marker pilot {stamp}\n\nModel `{model}`, prompt `{RUBRIC['promptVersion']}`, {a.runs} runs per essay, set {a.set}"
            f"{', only ' + a.only if a.only else ''}{', notes from ' + a.notes_from if a.notes_from else ''}.\n\n"
            f"- Median in range: {tally['inRange']}/{tally['cases']}; every run within [low-2, high+1]: {tally['within2']}/{tally['cases']}; medians above range {tally['generous']}; max spread {tally['maxSpread']}\n"
            f"- Question focus checks {tally['focusOk']}/{tally['focusChecks']}; knowledge-error checks {tally['kErrOk']}/{tally['kErrChecks']}\n"
            f"- Gap ids off list {tally['badGapIds']}; Away ids on NESA essays {tally['awayIdsOnNesa']}\n"
            f"- Quote check: planted caught {tally['quoteCaught']}/{tally['quotePlanted']}, false flags {tally['quoteFalse']}\n"
            f"- Cut-off replies (finish_reason length): {sum(1 for r in records if r.get('finish') == 'length')}\n"
            f"- Unusable runs {tally['errors']}; seconds per call median {statistics.median(secs) if secs else '-'}, max {max(secs) if secs else '-'}\n"
            f"- Gate: {'PASSED' if not fails else 'FAILED: ' + '; '.join(fails)}\n")
    (out / "report.md").write_text(head + body, encoding="utf-8")
    print("\n" + head + body)
    return 0 if not fails else 1


if __name__ == "__main__":
    sys.exit(main())
