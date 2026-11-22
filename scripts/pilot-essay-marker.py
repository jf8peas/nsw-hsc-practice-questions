#!/usr/bin/env python3
"""
Pilot the AI marker for the essay-writing unit (to become spec 010) before the spec is written.

Sends every labelled essay in resources/topic011/pilot-essays.json through the DRAFT marking prompt in
lib/essay/rubric.json, several times each, using the same OpenRouter setup as the app
(OPENROUTER_API_KEY, temperature 0, JSON reply). Then reports, per essay:

  - mark      : the final mark of every run, the median, and whether it falls in the labelled range
  - band      : whether the majority band is one of the labelled bands
  - spread    : highest minus lowest mark across runs (consistency)
  - cap       : for two-economy questions, whether a one-economy answer was capped at 12
  - data flags: whether every deliberately wrong figure was flagged, and any flags on figures that are fine
  - gaps      : whether at least one expected knowledge gap was listed, and any ids not on the concept list

Usage (from the repo root, in Git Bash):
  python scripts/pilot-essay-marker.py --check                 # offline: word counts, labels, prompts render
  python scripts/pilot-essay-marker.py --show-prompt q1-mid    # offline: print one prompt
  python scripts/pilot-essay-marker.py                         # full run, 3 runs per essay
  python scripts/pilot-essay-marker.py --runs 5 --only q5
  python scripts/pilot-essay-marker.py --model deepseek/deepseek-chat
  python scripts/pilot-essay-marker.py --set holdout           # the frozen holdout (resources/topic011/pilot-holdout.json)
  python scripts/pilot-essay-marker.py --write-golden          # offline: rewrite tests/fixtures/essay-golden-prompt.txt

Model: --model, else ESSAY_GRADING_MODEL, else deepseek/deepseek-v4.1-flash. Standard library only.
The key is read from the environment, then .env.local, then .env, and is never printed.
Results go to resources/topic011/runs/<timestamp>/ (report.md + raw.jsonl).
"""

from __future__ import annotations

import argparse
import concurrent.futures as cf
import datetime as dt
import json
import os
import re
import statistics
import sys
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DATA = REPO / "resources" / "topic011" / "pilot-essays.json"
RUNS_DIR = REPO / "resources" / "topic011" / "runs"
RUBRIC_PATH = REPO / "lib" / "essay" / "rubric.json"
CONCEPTS_PATH = REPO / "lib" / "essay" / "concepts.json"
HOLDOUT = REPO / "resources" / "topic011" / "pilot-holdout.json"
GOLDEN_PATH = REPO / "tests" / "fixtures" / "essay-golden-prompt.txt"
RUBRIC = json.loads(RUBRIC_PATH.read_text(encoding="utf-8"))
PROMPT_VERSION = RUBRIC["promptVersion"]

ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "deepseek/deepseek-v4.1-flash"
TIMEOUT_S = 180
MAX_TOKENS = 8000  # keep in step with lib/essay/marker.server.ts; 3000 cut off 3 of 21 replies in the first run (the model reasons first)
FIRST_CALL_P95_BAR_S = 40
CRITERIA = list(RUBRIC["criteria"].keys())
VERDICTS = set(RUBRIC["verdicts"])
CONCEPTS = json.loads(CONCEPTS_PATH.read_text(encoding="utf-8"))
BANDS = {b["band"]: b for b in RUBRIC["bands"]}
LO_WORDS, HI_WORDS = RUBRIC["wordRange"]
ONE_ECONOMY_CAP = BANDS[3]["max"]  # a two-economy question answered for one economy cannot go above band 3

VERB_MEANINGS = RUBRIC["verbMeanings"]


# ---- helpers -----------------------------------------------------------------------------------


def count_words(text: str) -> int:
    """Same rule as lib/wordcount.ts (spec 005 FR-043): whitespace-separated tokens."""
    t = text.strip()
    return len(t.split()) if t else 0


def load_env_value(name: str) -> str | None:
    v = os.environ.get(name, "").strip()
    if v:
        return v
    for fname in (".env.local", ".env"):
        p = REPO / fname
        if not p.exists():
            continue
        for line in p.read_text(encoding="utf-8").splitlines():
            m = re.match(rf"\s*{name}\s*=\s*(.*)$", line)
            if m and m.group(1).strip().strip('"').strip("'"):
                return m.group(1).strip().strip('"').strip("'")
    return None


def essay_text(data: dict, case: dict) -> str:
    if "paragraphs" in case:
        return "\n\n".join(case["paragraphs"])
    src = next(c for c in data["cases"] if c["id"] == case["copyOf"])
    return "\n\n".join(src["paragraphs"])


def render(template: str, values: dict) -> str:
    """Single-pass {name} substitution, so an essay containing {braces} is never re-expanded."""
    return re.sub(r"\{(\w+)\}", lambda m: str(values[m.group(1)]) if m.group(1) in values else m.group(0), template)


def normalise(text: str) -> str:
    text = text.replace("\u2018", "'").replace("\u2019", "'").replace("\u201c", '"').replace("\u201d", '"')
    return re.sub(r"\s+", " ", text).strip().lower()


def quote_in_text(quote: str, text: str) -> bool:
    q = normalise(quote)
    return bool(q) and q in normalise(text)


WRONG_FIGURE_WHY = "This figure looks wrong; check it against a source."


def scrub_flag_why(quote: str, why: str) -> str:
    """A flag must not give a replacement figure: any number in the reason that is not in the quote is replaced."""
    in_quote = set(re.findall(r"\d+(?:[.,]\d+)*", quote))
    numbers = re.findall(r"\d+(?:[.,]\d+)*", why)
    if not why.strip() or any(n not in in_quote for n in numbers):
        return WRONG_FIGURE_WHY
    return why.strip()


def build_messages(question: dict, essay: str) -> list[dict]:
    values = {
        "question": question["question"],
        "verb": question["verb"],
        "verbMeaning": VERB_MEANINGS[question["verb"]],
        "economyRule": question["economyRule"],
        "bands": "\n".join(f"Band {b['band']} ({b['min']}-{b['max']}): {b['descriptor']}" for b in RUBRIC["bands"]),
        "criteria": "\n".join(f"- {k}: {v}" for k, v in RUBRIC["criteria"].items()),
        "markingNotes": question["markingNotes"],
        "schoolCriteria": question.get("schoolCriteria") or "None provided.",
        "concepts": "\n".join(f"- {k}: {v}" for k, v in CONCEPTS.items()),
        "words": count_words(essay),
        "essay": essay,
        "maxGaps": RUBRIC["maxGaps"],
    }
    return [
        {"role": "system", "content": RUBRIC["system"]},
        {"role": "user", "content": render(RUBRIC["userTemplate"], values)},
    ]


# ---- model call --------------------------------------------------------------------------------


def call_model(key: str, model: str, messages: list[dict]) -> tuple[str | None, str | None, str | None]:
    """(content, error, finish_reason)."""
    body = json.dumps(
        {
            "model": model,
            "messages": messages,
            "temperature": 0,
            "max_tokens": MAX_TOKENS,
            "response_format": {"type": "json_object"},
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        ENDPOINT,
        data=body,
        headers={
            "authorization": f"Bearer {key}",
            "content-type": "application/json",
            "HTTP-Referer": "https://nsw-hsc-practice.vercel.app",
            "X-Title": "NSW HSC Practice (essay marker pilot)",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as res:
            data = json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return None, f"http {e.code}: {e.read().decode('utf-8', 'replace')[:200]}", None
    except Exception as e:  # network, timeout, bad JSON
        return None, f"{type(e).__name__}: {str(e)[:200]}", None
    try:
        return data["choices"][0]["message"]["content"], None, data["choices"][0].get("finish_reason")
    except (KeyError, IndexError, TypeError):
        return None, f"no content: {json.dumps(data)[:200]}", None


def parse_reply(content: str) -> tuple[dict | None, str | None]:
    """First {...} block, as the app does. Returns (parsed, problem)."""
    s, e = content.find("{"), content.rfind("}")
    if s == -1 or e <= s:
        return None, "no JSON object"
    try:
        obj = json.loads(content[s : e + 1])
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
    band, mark = obj.get("band"), obj.get("mark")
    if not isinstance(band, int) or band not in BANDS:
        return None, f"band {band!r}"
    if not isinstance(mark, int) or not 0 <= mark <= 20:
        return None, f"mark {mark!r}"
    covers = obj.get("coversRequiredEconomies")
    if not isinstance(covers, bool):
        return None, f"coversRequiredEconomies {covers!r}"
    gaps = obj.get("gaps") or []
    flags = obj.get("dataFlags") or []
    if not isinstance(gaps, list) or not isinstance(flags, list):
        return None, "gaps or dataFlags not a list"
    used_present = "conceptsUsedWell" in obj
    used = obj.get("conceptsUsedWell") or []
    if not isinstance(used, list):
        return None, "conceptsUsedWell not a list"
    return {
        "criteria": verdicts,
        "band": band,
        "mark": mark,
        "markInBand": BANDS[band]["min"] <= mark <= BANDS[band]["max"],
        "covers": covers,
        "flags": [f for f in flags if isinstance(f, dict)],
        "gaps": [g for g in gaps if isinstance(g, dict)],
        "usedPresent": used_present,
        "usedWell": [u for u in used if isinstance(u, str)],
        "lift": ([obj["liftYourMark"]] if isinstance(obj.get("liftYourMark"), str) and obj["liftYourMark"].strip() else (obj.get("liftYourMark") if isinstance(obj.get("liftYourMark"), list) else [])),
        "bandReason": obj.get("bandReason", ""),
    }, None


def final_mark(question: dict, parsed: dict) -> int:
    """What the app would record: the marker's mark, clamped into its band, capped for one-economy answers."""
    b = BANDS[parsed["band"]]
    mark = min(max(parsed["mark"], b["min"]), b["max"])
    if question["needsBoth"] and not parsed["covers"]:
        mark = min(mark, ONE_ECONOMY_CAP)
    return mark


# ---- checks ------------------------------------------------------------------------------------


def check_data(data: dict) -> list[str]:
    problems = []
    qids = {q["id"] for q in data["questions"]}
    for q in data["questions"]:
        if q["verb"] not in VERB_MEANINGS:
            problems.append(f"{q['id']}: unknown verb {q['verb']}")
    seen = set()
    for c in data["cases"]:
        cid = c["id"]
        if cid in seen:
            problems.append(f"duplicate case {cid}")
        seen.add(cid)
        if c["question"] not in qids:
            problems.append(f"{cid}: unknown question {c['question']}")
        n = count_words(essay_text(data, c))
        if not LO_WORDS <= n <= HI_WORDS:
            problems.append(f"{cid}: {n} words, outside {LO_WORDS}-{HI_WORDS}")
        lo, hi = c["expectedMark"]
        if not 1 <= lo <= hi <= 20:
            problems.append(f"{cid}: bad expectedMark {c['expectedMark']}")
        for g in c.get("expectedGaps", []):
            if g not in CONCEPTS:
                problems.append(f"{cid}: expected gap {g} is not in the concept list")
        text = essay_text(data, c)
        for f in c.get("mustFlag", []):
            if f not in text:
                problems.append(f"{cid}: mustFlag {f!r} does not appear in the essay")
    return problems


# ---- run ---------------------------------------------------------------------------------------


def clean_flags(parsed: dict, essay: str) -> dict:
    """What the app keeps: a flag needs a quote that is really in the essay, and gives no replacement figure."""
    kept = []
    for f in parsed["flags"][:5]:
        q = f.get("quote") or ""
        if quote_in_text(q, essay):
            kept.append({"quote": q, "why": scrub_flag_why(q, f.get("why") or "")})
    parsed["flags"] = kept
    return parsed


def mark_once(key, model, data, question, case, run):
    essay = essay_text(data, case)
    messages = build_messages(question, essay)
    t0 = time.time()
    attempts = []
    parsed = problem = err = finish = None
    for _ in range(2):  # one retry on any failure (a failed call, a cut-off, an unparseable reply), as the app does
        content, err, finish = call_model(key, model, messages)
        parsed = problem = None
        if content and finish == "length":
            problem = "cut off at max_tokens (finish_reason length)"
        elif content:
            parsed, problem = parse_reply(content)
        attempts.append({"finish": finish, "cut": finish == "length"})
        if parsed:
            break
    rec = {
        "case": case["id"],
        "run": run,
        "model": model,
        "seconds": round(time.time() - t0, 2),
        "finishReasons": [a["finish"] for a in attempts],
        "cutOff": any(a["cut"] for a in attempts),
        "error": None if parsed else (err or problem or "unparseable reply"),
        "reply": (content or "")[:6000],
    }
    if parsed:
        rec.update(clean_flags(parsed, essay))
        rec["final"] = final_mark(question, parsed)
    return rec


def flag_hits(case: dict, recs: list[dict]) -> tuple[str, list[str]]:
    """(caught summary, stray flags). A mustFlag counts as caught when a majority of runs flag a quote containing it."""
    must = case.get("mustFlag", [])
    caught = []
    for m in must:
        runs_hit = sum(any(m in (f.get("quote") or "") for f in r["flags"]) for r in recs)
        caught.append(runs_hit * 2 > len(recs))
    stray = []
    for r in recs:
        for f in r["flags"]:
            q = f.get("quote") or ""
            if not any(m in q for m in must):
                stray.append(f"run {r['run']}: \"{q[:80]}\" ({(f.get('why') or '')[:100]})")
    summary = f"{sum(caught)}/{len(must)}" if must else "-"
    return summary, stray


def summarise(data: dict, records: list[dict], model: str, runs: int) -> str:
    cases = {c["id"]: c for c in data["cases"]}
    questions = {q["id"]: q for q in data["questions"]}
    by_case = defaultdict(list)
    for r in records:
        if not r.get("error"):
            by_case[r["case"]].append(r)
    errors = [r for r in records if r.get("error")]

    lines = [
        f"# Essay marker pilot: {dt.datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "",
        f"Prompt `{PROMPT_VERSION}`. Model `{model}`, {runs} run(s) per essay, {len(by_case)} essays marked, {len(errors)} failed calls.",
        "",
        "## Marks against the labels",
        "",
        "| Essay | Label | Final marks (runs) | Median | In range | Marker's band (majority, before cap) | Bands ok | Spread | Covers both | Flags caught | Gap hit |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    in_range = band_ok = 0
    details = []
    for cid in [c["id"] for c in data["cases"]]:
        recs = sorted(by_case.get(cid, []), key=lambda r: r["run"])
        if not recs:
            lines.append(f"| {cid} | - | no successful run | | | | | | | | |")
            continue
        case = cases[cid]
        q = questions[case["question"]]
        finals = [r["final"] for r in recs]
        med = statistics.median(finals)
        lo, hi = case["expectedMark"]
        ok = lo <= med <= hi
        in_range += ok
        band = Counter(r["band"] for r in recs).most_common(1)[0][0]
        bok = band in case["expectedBands"]
        band_ok += bok
        covers = ", ".join("yes" if r["covers"] else "no" for r in recs) if q["needsBoth"] else "-"
        flags_s, stray = flag_hits(case, recs)
        exp_gaps = set(case.get("expectedGaps", []))
        gap_ids = [{g.get("concept") for g in r["gaps"]} for r in recs]
        gap_hit = f"{sum(bool(exp_gaps & g) for g in gap_ids)}/{len(recs)}" if exp_gaps else "-"
        lines.append(
            f"| {cid} | {lo}-{hi} (band {'/'.join(map(str, case['expectedBands']))}) | {', '.join(map(str, finals))} | {med:g} | "
            f"{'yes' if ok else 'NO'} | {band} | {'yes' if bok else 'NO'} | {max(finals) - min(finals)} | {covers} | {flags_s} | {gap_hit} |"
        )

        r1 = recs[0]
        invalid = sorted({g.get("concept") for r in recs for g in r["gaps"]} - set(CONCEPTS))
        outside = [r["run"] for r in recs if not r["markInBand"]]
        d = [f"### {cid}", "", f"Raw marks: {', '.join(str(r['mark']) for r in recs)} (bands {', '.join(str(r['band']) for r in recs)})."]
        if outside:
            d.append(f"Mark outside its own band on run(s) {outside} (clamped).")
        if invalid:
            d.append(f"Gap ids not on the concept list: {', '.join(map(str, invalid))}.")
        d += ["", "| Criterion | Run 1 verdict | Reason (run 1) | All runs |", "| --- | --- | --- | --- |"]
        for c in CRITERIA:
            allv = " ".join(r["criteria"][c]["verdict"] for r in recs)
            reason = r1["criteria"][c]["reason"].replace("|", "/").replace("\n", " ")
            d.append(f"| {c} | {r1['criteria'][c]['verdict']} | {reason} | {allv} |")
        d += ["", f"**Band reason (run 1):** {r1['bandReason']}", "", "**Lift your mark (run 1):**"]
        d += [f"- {x}" for x in r1["lift"]] or ["- (none)"]
        d += ["", "**Gaps (run 1):**"]
        d += [f"- `{g.get('concept')}`: {g.get('detail', '')}" for g in r1["gaps"]] or ["- (none)"]
        if stray:
            d += ["", "**Data flags on figures that were not planted errors (check whether each is fair):**"] + [f"- {s}" for s in stray]
        details += d + [""]

    n = len(by_case)
    secs = sorted(r["seconds"] for r in records)
    p95 = secs[min(len(secs) - 1, int(0.95 * len(secs)))] if secs else 0
    med_s = statistics.median(secs) if secs else 0
    cut = sum(1 for r in records if r.get("cutOff"))
    all_ok = [r for recs in by_case.values() for r in recs]
    gaps_all = [g.get("concept") for r in all_ok for g in r["gaps"]]
    off_list = [g for g in gaps_all if g not in CONCEPTS]
    off_pct = (100.0 * len(off_list) / len(gaps_all)) if gaps_all else 0.0
    used_missing = sum(1 for r in all_ok if not r.get("usedPresent"))
    used_overlap = sum(1 for r in all_ok if set(r.get("usedWell", [])) & {g.get("concept") for g in r["gaps"]})
    used_off = [u for r in all_ok for u in r.get("usedWell", []) if u not in CONCEPTS]
    cap_rows = []
    for cid, recs in by_case.items():
        q = questions[cases[cid]["question"]]
        if q["needsBoth"] and any(not r["covers"] for r in recs):
            cap_rows.append((cid, all(r["final"] <= ONE_ECONOMY_CAP for r in recs if not r["covers"])))
    flag_rows = []
    for cid in by_case:
        case = cases[cid]
        if case.get("mustFlag"):
            got, _stray = flag_hits(case, by_case[cid])
            flag_rows.append((cid, got))
    total_calls = len(records)
    unparsed = len(errors)
    gate = [
        ("(a) median in labelled range for at least 6 of 7 essays", in_range >= min(6, n) if n >= 7 else in_range == n, f"{in_range} of {n}"),
        ("(a) majority band within one band of the label for every essay", band_ok == n, f"{band_ok} of {n} in the labelled bands"),
        ("(b) one-economy answer capped at 12 in every run", all(ok for _c, ok in cap_rows) if cap_rows else True, f"{len(cap_rows)} essay(s) tested" if cap_rows else "no one-economy essay in this set"),
        ("(c) every planted wrong figure flagged in a majority of runs", all(g.split("/")[0] == g.split("/")[1] for _c, g in flag_rows) if flag_rows else True, ", ".join(f"{c}: {g}" for c, g in flag_rows) or "none planted"),
        ("(d) off-list gap ids at most 5% of gaps", off_pct <= 5.0, f"{len(off_list)} of {len(gaps_all)} ({off_pct:.1f}%)"),
        ("(e) at most 1 failed or unparseable call in 21 and none cut off", unparsed <= max(1, round(total_calls / 21)) and cut == 0, f"{unparsed} failed of {total_calls}; {cut} cut off"),
        ("(f) p95 seconds per call at most 40", p95 <= FIRST_CALL_P95_BAR_S, f"median {med_s:.1f}s, p95 {p95:.1f}s, max {secs[-1] if secs else 0:.1f}s"),
        ("(g) conceptsUsedWell on every reply, disjoint from gaps, on the list", used_missing == 0 and used_overlap == 0 and not used_off, f"{used_missing} missing, {used_overlap} overlapping, {len(used_off)} off-list"),
    ]
    lines += [
        "",
        f"Median mark in the labelled range: **{in_range} of {n}**. Majority band in the labelled bands: **{band_ok} of {n}**.",
        "",
        "## Gate (specs/010-economics-essay-writing/research.md R8)",
        "",
        "| Bar | Result | Detail |",
        "| --- | --- | --- |",
    ] + [f"| {name} | {'PASS' if ok else 'FAIL'} | {detail} |" for name, ok, detail in gate] + [
        "",
        f"Overall: **{'PASS' if all(ok for _n, ok, _d in gate) else 'FAIL'}** on prompt `{PROMPT_VERSION}` with `{model}`.",
        "",
        "## Per essay",
        "",
    ] + details
    if errors:
        lines += ["## Failed calls", ""] + [f"- {r['case']} run {r['run']}: {r['error']}" for r in errors]
    return "\n".join(lines) + "\n"


def golden_prompt() -> str:
    """The prompt for one fixed fixture question and essay: tests/essay/prompt.test.ts renders the same inputs with the app's builder."""
    question = {
        "question": "Fixture question: evaluate the strategies used by an emerging and a developing economy.",
        "verb": "evaluate",
        "economyRule": "one emerging AND one developing economy (here China and Nepal); both must be treated",
        "markingNotes": "FIXTURE MARKING NOTES",
        "schoolCriteria": "FIXTURE SCHOOL CRITERIA",
    }
    msgs = build_messages(question, "one two three")
    return msgs[0]["content"] + "\n\n=====\n\n" + msgs[1]["content"] + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--data", type=Path, default=None, help="pilot data file (default: the set's file)")
    ap.add_argument("--set", dest="which", choices=["tuning", "holdout"], default="tuning", help="tuning (pilot-essays.json) or the frozen holdout (pilot-holdout.json, never tune to it)")
    ap.add_argument("--write-golden", action="store_true", help="offline: write tests/fixtures/essay-golden-prompt.txt from rubric.json")
    ap.add_argument("--runs", type=int, default=3, help="runs per essay (default 3)")
    ap.add_argument("--model", default=None, help="model slug (default: ESSAY_GRADING_MODEL, else deepseek/deepseek-v4.1-flash)")
    ap.add_argument("--workers", type=int, default=4, help="parallel calls (default 4)")
    ap.add_argument("--only", default=None, help="only cases whose id starts with this, e.g. q5")
    ap.add_argument("--check", action="store_true", help="offline: validate the data and render every prompt, then exit")
    ap.add_argument("--show-prompt", metavar="CASE_ID", help="offline: print the prompt for one case")
    args = ap.parse_args()

    if args.write_golden:
        GOLDEN_PATH.parent.mkdir(parents=True, exist_ok=True)
        GOLDEN_PATH.write_bytes(golden_prompt().encode("utf-8"))  # bytes: no CRLF translation on Windows
        print(f"Wrote {GOLDEN_PATH.relative_to(REPO)} for prompt {PROMPT_VERSION}.")
        return 0

    data_path = args.data or (HOLDOUT if args.which == "holdout" else DATA)
    data = json.loads(data_path.read_text(encoding="utf-8"))
    questions = {q["id"]: q for q in data["questions"]}
    problems = check_data(data)

    if args.show_prompt:
        case = next((c for c in data["cases"] if c["id"] == args.show_prompt), None)
        if not case:
            print(f"No case {args.show_prompt}", file=sys.stderr)
            return 1
        msgs = build_messages(questions[case["question"]], essay_text(data, case))
        print(msgs[0]["content"] + "\n\n=====\n\n" + msgs[1]["content"])
        return 0

    if args.check:
        if not GOLDEN_PATH.exists():
            print(f"Missing {GOLDEN_PATH.relative_to(REPO)}: run --write-golden.", file=sys.stderr)
            return 1
        if GOLDEN_PATH.read_bytes().decode("utf-8") != golden_prompt():
            print(f"{GOLDEN_PATH.relative_to(REPO)} does not match rubric.json ({PROMPT_VERSION}): run --write-golden.", file=sys.stderr)
            return 1
        for c in data["cases"]:
            build_messages(questions[c["question"]], essay_text(data, c))
            print(f"{c['id']}: {count_words(essay_text(data, c))} words, label {c['expectedMark'][0]}-{c['expectedMark'][1]}")
        if problems:
            print("\nProblems:\n" + "\n".join(f"- {p}" for p in problems))
            return 1
        print(f"\nOK: {len(data['cases'])} essays, prompt {PROMPT_VERSION}.")
        return 0

    if problems:
        print("Fix the data first:\n" + "\n".join(f"- {p}" for p in problems), file=sys.stderr)
        return 1
    key = load_env_value("OPENROUTER_API_KEY")
    if not key:
        print("OPENROUTER_API_KEY is not set (environment, .env.local or .env).", file=sys.stderr)
        return 1
    model = args.model or load_env_value("ESSAY_GRADING_MODEL") or DEFAULT_MODEL

    cases = [c for c in data["cases"] if not args.only or c["id"].startswith(args.only)]
    jobs = [(questions[c["question"]], c, r) for c in cases for r in range(1, args.runs + 1)]
    out_dir = RUNS_DIR / dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"Marking {len(cases)} essays x {args.runs} runs with {model} (prompt {PROMPT_VERSION})...")
    records = []
    with cf.ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool, open(out_dir / "raw.jsonl", "w", encoding="utf-8") as raw:
        futures = [pool.submit(mark_once, key, model, data, q, c, r) for q, c, r in jobs]
        for f in cf.as_completed(futures):
            rec = f.result()
            records.append(rec)
            raw.write(json.dumps(rec, ensure_ascii=False) + "\n")
            print("x" if rec.get("error") else ".", end="", flush=True)
    print()
    report = summarise(data, records, model, args.runs)
    (out_dir / "report.md").write_text(report, encoding="utf-8")
    print(report)
    print(f"Saved: {out_dir.relative_to(REPO)}/report.md and raw.jsonl")
    return 0


if __name__ == "__main__":
    sys.exit(main())
