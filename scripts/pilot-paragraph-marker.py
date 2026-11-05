#!/usr/bin/env python3
"""
Pilot the AI marker for spec 007 (Economics Paragraph Writing) before the spec is written.

Sends every labelled test answer in resources/topic010/pilot-essays.json through a DRAFT
marking prompt, several times each, using the same OpenRouter setup as the app
(lib/openrouter.server.ts: OPENROUTER_API_KEY, GRADING_MODEL, temperature 0, JSON reply).
Then reports, per part and per criterion:

  - agreement  : did the marker give the mark the label expects?
  - catch rate : of the criteria a weak answer was written to fail, how many were docked?
  - false docks: of the criteria that should be met, how many were docked anyway?
  - consistency: did repeated runs on the same answer give the same verdict?

Usage (from the repo root, in Git Bash):
  python scripts/pilot-paragraph-marker.py --check          # offline: word limits and labels only
  python scripts/pilot-paragraph-marker.py --show-prompt vn-evaluation-a
  python scripts/pilot-paragraph-marker.py                  # full run, 3 runs per answer
  python scripts/pilot-paragraph-marker.py --runs 5 --only bd-evaluation
  python scripts/pilot-paragraph-marker.py --model deepseek/deepseek-v4.1-flash

Standard library only. The key is read from the environment, then .env.local, then .env.
Results go to resources/topic010/runs/<timestamp>/ (report.md + raw.jsonl). Every case in the file is marked by
default and tuning, holdout and field answers are reported separately; the frozen holdout set (India) is
NEVER used to tune the prompt (spec 007 FR-030). The rubric and prompt are lib/paragraph/rubric.json. No answer text
is sent anywhere except OpenRouter, and the key is never printed.
"""

from __future__ import annotations

import argparse
import concurrent.futures as cf
import datetime as dt
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DATA = REPO / "resources" / "topic010" / "pilot-essays.json"
RUNS_DIR = REPO / "resources" / "topic010" / "runs"

ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "deepseek/deepseek-chat"  # same default as lib/openrouter.server.ts
TIMEOUT_S = 60
MAX_TOKENS = 1200
# The rubric (criteria text, conventions, system prompt, user template) and PROMPT_VERSION live in
# ONE file that the app also reads: lib/paragraph/rubric.json. Edit it there and bump
# "promptVersion" on every change to the prompt text, the criteria or the conventions (spec 007).
RUBRIC_PATH = REPO / "lib" / "paragraph" / "rubric.json"
RUBRIC = json.loads(RUBRIC_PATH.read_text(encoding="utf-8"))
PROMPT_VERSION = RUBRIC["promptVersion"]

PART_ORDER = ["topic", "mechanism", "evidence", "evaluation", "link"]
CRITERIA = ["a", "b", "c", "d"]

# Word limits: decision 5. Criteria: "Marking criteria" section. (d) Conventions is shared.
PARTS = RUBRIC["parts"]
CONVENTIONS = RUBRIC["conventions"]

# ---- helpers -----------------------------------------------------------------------------


def count_words(text: str) -> int:
    """Same rule as lib/wordcount.ts (spec 005 FR-043): whitespace-separated tokens."""
    t = text.strip()
    return len(t.split()) if t else 0


def load_key() -> str | None:
    key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if key:
        return key
    for name in (".env.local", ".env"):
        p = REPO / name
        if not p.exists():
            continue
        for line in p.read_text(encoding="utf-8").splitlines():
            m = re.match(r"\s*OPENROUTER_API_KEY\s*=\s*(.*)$", line)
            if m:
                v = m.group(1).strip().strip('"').strip("'")
                if v:
                    return v
    return None


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


SETS = ("tuning", "holdout", "field")


def case_set(essay: dict, case: dict) -> str:
    """Which set a case belongs to: its own `set`, else its essay's, else tuning (spec 007 FR-030)."""
    return case.get("set") or essay.get("set", "tuning")


def total_agreement(data: dict, records: list[dict]) -> tuple[int, int]:
    """(answers whose majority total mark equals the labelled total, answers marked)."""
    cases = {c["id"]: c for e in data["essays"] for c in e["cases"]}
    by_case = defaultdict(list)
    for r in records:
        if r.get("verdict"):
            by_case[r["case"]].append(r)
    exact = 0
    for cid, recs in by_case.items():
        exp = expected(cases[cid])
        exp_total = sum(1 for c in CRITERIA if exp[c])
        got = Counter(sum(r["verdict"][c] for c in CRITERIA) for r in recs).most_common(1)[0][0]
        exact += exp_total == got
    return exact, len(by_case)


def expected(case: dict) -> dict[str, bool]:
    """Expected verdict per criterion: True = met. Strong answers meet all four."""
    fails = set(case.get("fails", []))
    return {c: c not in fails for c in CRITERIA}


# ---- the draft marking prompt --------------------------------------------------------------


def render(template: str, values: dict) -> str:
    """Single-pass {name} substitution, so a student's text containing {braces} is never re-expanded."""
    return re.sub(r"\{(\w+)\}", lambda m: str(values[m.group(1)]) if m.group(1) in values else m.group(0), template)


def build_messages(essay: dict, part: str, answer: str) -> list[dict]:
    spec = PARTS[part]
    idx = PART_ORDER.index(part)
    so_far = [f"{PARTS[p]['name']}: {essay['models'][p]}" for p in PART_ORDER[:idx]]
    brief = essay["brief"]
    values = {
        "question": essay["question"],
        "verb": essay["directiveVerb"],
        "economy": essay["economy"],
        "economyType": essay["type"],
        "strategy": essay["strategy"],
        "argument": brief["argument"],
        "counterpoint": brief["counterpoint"],
        "chainSteps": " -> ".join(brief["chainSteps"]),
        "facts": " ".join(brief["facts"]),
        "limitation": " ".join(brief["limitation"]),
        "soFar": (RUBRIC["soFarHeader"] + "\n".join(so_far) + "\n\n") if so_far else "",
        "partName": spec["name"],
        "job": spec["job"],
        "limit": spec["limit"],
        "criteria": "\n".join(f"({k}) {v}" for k, v in spec["criteria"].items()),
        "conventions": "\n".join(f"- {k}: {v}" for k, v in CONVENTIONS.items()),
        "model": essay["models"][part],
        "markingNotes": essay["markingNotes"][part],
        "answer": answer,
    }
    return [
        {"role": "system", "content": RUBRIC["system"]},
        {"role": "user", "content": render(RUBRIC["userTemplate"], values)},
    ]


GOLDEN_INPUT = REPO / "tests" / "fixtures" / "paragraph-prompt-input.json"
GOLDEN_OUTPUT = REPO / "tests" / "fixtures" / "paragraph-prompt.golden.txt"
HASH_OUTPUT = REPO / "tests" / "fixtures" / "rubric.hash"


def golden_text() -> str:
    """The rendered prompt for the fixture, in the same layout tests/paragraph/prompt.test.ts uses."""
    fx = json.loads(GOLDEN_INPUT.read_text(encoding="utf-8"))
    msgs = build_messages(fx["essay"], fx["part"], fx["answer"])
    return msgs[0]["content"] + "\n\n=====\n\n" + msgs[1]["content"] + "\n"


# ---- model call -----------------------------------------------------------------------------


def call_model(key: str, model: str, messages: list[dict], base_url: str | None) -> tuple[str | None, str | None]:
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
        base_url or ENDPOINT,
        data=body,
        headers={
            "authorization": f"Bearer {key}",
            "content-type": "application/json",
            "HTTP-Referer": "https://nsw-hsc-practice.vercel.app",
            "X-Title": "NSW HSC Practice (marker pilot)",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as res:
            data = json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return None, f"http {e.code}: {e.read().decode('utf-8', 'replace')[:200]}"
    except Exception as e:  # network, timeout, bad JSON
        return None, f"{type(e).__name__}: {str(e)[:200]}"
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        return None, f"no content: {json.dumps(data)[:200]}"
    return content, None


def parse_reply(content: str) -> dict | None:
    """First {...} block, as the app does. Returns verdicts per criterion or None."""
    s, e = content.find("{"), content.rfind("}")
    if s == -1 or e <= s:
        return None
    try:
        obj = json.loads(content[s : e + 1])
    except json.JSONDecodeError:
        return None
    crit = obj.get("criteria") or {}
    conv = obj.get("conventions") or {}

    def flag(v):
        """True/False, or None when the reply did not give a clear boolean."""
        if isinstance(v, dict):
            v = v.get("met")
        if v is True or v == "true":
            return True
        if v is False or v == "false":
            return False
        return None

    out = {c: flag(crit.get(c)) for c in ("a", "b", "c")}
    subs = {k: flag(conv.get(k)) for k in CONVENTIONS}
    if None in out.values() or None in subs.values():
        return None  # a missing or unclear verdict is a failed reply, never a silent "docked"
    out["d_subs"] = subs
    out["d_llm"] = all(subs.values())
    out["reasons"] = {c: (crit.get(c) or {}).get("reason", "") if isinstance(crit.get(c), dict) else "" for c in ("a", "b", "c")}
    out["reasons"]["d"] = conv.get("reason", "")
    out["feedback"] = obj.get("feedback", "")
    return out


# ---- checks -----------------------------------------------------------------------------------


def check_data(data: dict) -> list[str]:
    problems = []
    seen = set()
    for essay in data["essays"]:
        for part in PART_ORDER:
            text = essay["models"].get(part, "")
            n = count_words(text)
            if not text:
                problems.append(f"{essay['id']}: missing model {part}")
            elif n > PARTS[part]["limit"]:
                problems.append(f"{essay['id']}: model {part} is {n} words (limit {PARTS[part]['limit']})")
            if part not in essay.get("markingNotes", {}):
                problems.append(f"{essay['id']}: missing marking note for {part}")
        parts_cases = defaultdict(set)
        for case in essay["cases"]:
            cid = case["id"]
            if cid in seen:
                problems.append(f"duplicate case id {cid}")
            seen.add(cid)
            if case.get("needsLabel"):
                problems.append(f"{cid}: needsLabel is set; label it (edit `fails`) and clear needsLabel before it counts as a test case")
            if case["part"] not in PARTS:
                problems.append(f"{cid}: unknown part {case['part']}")
                continue
            for c in case.get("fails", []) + case.get("ambiguous", []):
                if c not in CRITERIA:
                    problems.append(f"{cid}: unknown criterion {c}")
            if set(case.get("fails", [])) & set(case.get("ambiguous", [])):
                problems.append(f"{cid}: a criterion is both in fails and ambiguous")
            n = count_words(case["text"])
            if n > PARTS[case["part"]]["limit"]:
                problems.append(f"{cid}: {n} words (limit {PARTS[case['part']]['limit']}); over-limit loses (d) in code, so the LLM test is muddied")
            parts_cases[case["part"]].add("strong" if not case.get("fails") else ",".join(case["fails"]))
        for part in PART_ORDER:
            have = parts_cases.get(part, set())
            if "strong" not in have:
                problems.append(f"{essay['id']}: no strong answer for {part}")
            for c in CRITERIA:
                if not any(c in h.split(",") for h in have if h != "strong"):
                    problems.append(f"{essay['id']}: no weak answer failing ({c}) for {part}")
    return problems


def word_table(data: dict) -> str:
    rows = ["| Case | Part | Words | Limit |", "| --- | --- | --- | --- |"]
    for essay in data["essays"]:
        for part in PART_ORDER:
            rows.append(f"| {essay['id']} model | {part} | {count_words(essay['models'][part])} | {PARTS[part]['limit']} |")
        for case in essay["cases"]:
            rows.append(f"| {case['id']} | {case['part']} | {count_words(case['text'])} | {PARTS[case['part']]['limit']} |")
    return "\n".join(rows)


# ---- run --------------------------------------------------------------------------------------


def mark_once(key, model, base_url, essay, case, run):
    messages = build_messages(essay, case["part"], case["text"])
    t0 = time.time()
    content, err = call_model(key, model, messages, base_url)
    parsed = parse_reply(content) if content else None
    if content and not parsed:
        content2, err2 = call_model(key, model, messages, base_url)  # one retry, as the app does
        parsed = parse_reply(content2) if content2 else None
        err = err2 or (None if parsed else "unparseable reply")
        content = content2
    rec = {
        "case": case["id"],
        "essay": essay["id"],
        "part": case["part"],
        "run": run,
        "model": model,
        "seconds": round(time.time() - t0, 2),
        "error": err if not parsed else None,
    }
    if parsed:
        within = count_words(case["text"]) <= PARTS[case["part"]]["limit"]
        rec["verdict"] = {"a": parsed["a"], "b": parsed["b"], "c": parsed["c"], "d": parsed["d_llm"] and within}
        rec["d_subs"] = parsed["d_subs"]
        rec["reasons"] = parsed["reasons"]
        rec["feedback"] = parsed["feedback"]
    rec["reply"] = (content or "")[:2000]
    return rec


def summarise(data: dict, records: list[dict], model: str, runs: int) -> str:
    cases = {c["id"]: (e, c) for e in data["essays"] for c in e["cases"]}
    by_case = defaultdict(list)
    for r in records:
        if r.get("verdict"):
            by_case[r["case"]].append(r)
    errors = [r for r in records if r.get("error")]

    # tallies per part x criterion
    agree = defaultdict(lambda: [0, 0])  # (part, crit) -> [agreed, total]
    catch = defaultdict(lambda: [0, 0])  # expected False -> marked False
    false_dock = defaultdict(lambda: [0, 0])  # expected True -> marked False
    unstable = []
    mismatches = []
    total_marks = []

    for cid, recs in by_case.items():
        essay, case = cases[cid]
        exp = expected(case)
        amb = set(case.get("ambiguous", []))
        part = case["part"]
        for crit in CRITERIA:
            vals = [r["verdict"][crit] for r in recs]
            if len(set(vals)) > 1:
                unstable.append((cid, crit, vals))
            if crit in amb:
                continue
            for v in vals:
                agree[(part, crit)][1] += 1
                agree[(part, crit)][0] += v == exp[crit]
                if exp[crit]:
                    false_dock[(part, crit)][1] += 1
                    false_dock[(part, crit)][0] += not v
                else:
                    catch[(part, crit)][1] += 1
                    catch[(part, crit)][0] += not v
            majority = Counter(vals).most_common(1)[0][0]
            if majority != exp[crit]:
                mismatches.append((cid, crit, exp[crit], vals, recs[0]["reasons"].get(crit, "")))
        exp_total = sum(1 for c in CRITERIA if exp[c])
        got = Counter(sum(r["verdict"][c] for c in CRITERIA) for r in recs).most_common(1)[0][0]
        total_marks.append((cid, exp_total, got))

    def pct(x):
        a, t = x
        return f"{a}/{t} ({100 * a / t:.0f}%)" if t else "-"

    lines = [
        f"# Marker pilot: {dt.datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "",
        f"Prompt {PROMPT_VERSION}. Model `{model}`, {runs} run(s) per answer, {len(by_case)} answers marked, {len(errors)} failed calls.",
        "Ambiguous criteria (labelled per case) are left out of agreement figures.",
        "",
        "## Agreement with the labels, by part and criterion",
        "",
        "| Part | (a) | (b) | (c) | (d) conventions |",
        "| --- | --- | --- | --- | --- |",
    ]
    for part in PART_ORDER:
        lines.append(f"| {PARTS[part]['name']} | " + " | ".join(pct(agree[(part, c)]) for c in CRITERIA) + " |")
    lines += [
        "",
        "## Catch rate (a criterion the answer was written to fail was docked)",
        "",
        "| Part | (a) | (b) | (c) | (d) |",
        "| --- | --- | --- | --- | --- |",
    ]
    for part in PART_ORDER:
        lines.append(f"| {PARTS[part]['name']} | " + " | ".join(pct(catch[(part, c)]) for c in CRITERIA) + " |")
    lines += [
        "",
        "## False docks (a criterion that should be met was docked)",
        "",
        "| Part | (a) | (b) | (c) | (d) |",
        "| --- | --- | --- | --- | --- |",
    ]
    for part in PART_ORDER:
        lines.append(f"| {PARTS[part]['name']} | " + " | ".join(pct(false_dock[(part, c)]) for c in CRITERIA) + " |")

    exact = sum(1 for _, e, g in total_marks if e == g)
    lines += [
        "",
        "## Total mark",
        "",
        f"Majority total mark equals the labelled total for {exact} of {len(total_marks)} answers.",
        "",
        "## Disagreements (majority verdict differs from the label)",
        "",
    ]
    if mismatches:
        lines += ["| Case | Criterion | Label | Runs | Marker's reason (run 1) |", "| --- | --- | --- | --- | --- |"]
        for cid, crit, exp_v, vals, reason in sorted(mismatches):
            runs_s = " ".join("met" if v else "docked" for v in vals)
            lines.append(f"| {cid} | ({crit}) | {'met' if exp_v else 'fail'} | {runs_s} | {reason.replace('|', '/')} |")
    else:
        lines.append("None.")
    lines += ["", "## Unstable verdicts (runs disagreed with each other)", ""]
    if unstable:
        for cid, crit, vals in sorted(unstable):
            lines.append(f"- {cid} ({crit}): " + ", ".join("met" if v else "docked" for v in vals))
    else:
        lines.append("None: every criterion got the same verdict on every run.")
    if errors:
        lines += ["", "## Failed calls", ""] + [f"- {r['case']} run {r['run']}: {r['error']}" for r in errors]
    return "\n".join(lines) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--data", type=Path, default=DATA)
    ap.add_argument("--runs", type=int, default=3, help="runs per answer (default 3)")
    ap.add_argument("--model", default=None, help="model slug (default: GRADING_MODEL, else deepseek/deepseek-chat)")
    ap.add_argument("--workers", type=int, default=4, help="parallel calls (default 4)")
    ap.add_argument("--only", default=None, help="only cases whose id starts with this, e.g. vn-evaluation")
    ap.add_argument("--set", choices=["tuning", "holdout", "field", "all"], default="all", help="which answers to mark (default all: every case in the file)")
    ap.add_argument("--gate", action="store_true", help="exit non-zero when tuning agreement is under 90 percent or holdout under 80 percent (SC-003)")
    ap.add_argument("--check", action="store_true", help="offline: validate data and word limits, and that the rendered prompt equals tests/fixtures/paragraph-prompt.golden.txt, then exit")
    ap.add_argument("--write-golden", action="store_true", help="offline: regenerate tests/fixtures/paragraph-prompt.golden.txt from lib/paragraph/rubric.json (after a deliberate prompt change and a promptVersion bump)")
    ap.add_argument("--words", action="store_true", help="offline: print the word count of every answer")
    ap.add_argument("--show-prompt", metavar="CASE_ID", help="offline: print the prompt for one case")
    args = ap.parse_args()

    if args.write_golden:
        GOLDEN_OUTPUT.write_text(golden_text(), encoding="utf-8", newline="\n")
        # the drift test (tests/paragraph/rubric-drift.test.ts) compares this hash with rubric.json
        digest = hashlib.sha256(RUBRIC_PATH.read_bytes().replace(b"\r\n", b"\n")).hexdigest()
        HASH_OUTPUT.write_text(
            json.dumps({"sha256": digest, "promptVersion": PROMPT_VERSION}, indent=2) + "\n", encoding="utf-8", newline="\n"
        )
        print(f"Wrote {GOLDEN_OUTPUT.relative_to(REPO)} and {HASH_OUTPUT.relative_to(REPO)} for prompt version: {PROMPT_VERSION}")
        return 0

    data = json.loads(args.data.read_text(encoding="utf-8"))
    problems = check_data(data)

    if args.words:
        print(word_table(data))
        return 0
    if args.show_prompt:
        for essay in data["essays"]:
            for case in essay["cases"]:
                if case["id"] == args.show_prompt:
                    for m in build_messages(essay, case["part"], case["text"]):
                        print(f"--- {m['role']} ---\n{m['content']}\n")
                    return 0
        print(f"no case {args.show_prompt}", file=sys.stderr)
        return 2
    if args.check:
        if not GOLDEN_OUTPUT.exists() or GOLDEN_OUTPUT.read_text(encoding="utf-8") != golden_text():
            problems.append("the rendered prompt differs from tests/fixtures/paragraph-prompt.golden.txt: run --write-golden after a deliberate change and bump promptVersion")
        n = sum(len(e["cases"]) for e in data["essays"])
        if problems:
            print("Problems:\n" + "\n".join(f"  - {p}" for p in problems))
            return 1
        print(f"OK: {len(data['essays'])} essays, {n} labelled answers, all within word limits.")
        return 0

    if problems:
        print("Data problems (fix or run anyway with care):\n" + "\n".join(f"  - {p}" for p in problems), file=sys.stderr)

    key = load_key()
    if not key:
        print("OPENROUTER_API_KEY is not set (environment, .env.local or .env).", file=sys.stderr)
        return 2
    model = args.model or load_env_value("GRADING_MODEL") or DEFAULT_MODEL
    base_url = os.environ.get("OPENROUTER_BASE_URL", "").strip() or None  # local fake, as in the app

    jobs = [
        (essay, case, run)
        for essay in data["essays"]
        for case in essay["cases"]
        if (not args.only or case["id"].startswith(args.only))
        and (args.set == "all" or case_set(essay, case) == args.set)
        for run in range(1, args.runs + 1)
    ]
    if not jobs:
        print("No cases match.", file=sys.stderr)
        return 2
    print(f"Marking {len(jobs)} calls ({len(jobs) // args.runs} answers x {args.runs} runs) with {model} ...")

    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    out_dir = RUNS_DIR / stamp
    out_dir.mkdir(parents=True, exist_ok=True)
    records = []
    with cf.ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool, open(out_dir / "raw.jsonl", "w", encoding="utf-8") as raw:
        futures = [pool.submit(mark_once, key, model, base_url, e, c, r) for e, c, r in jobs]
        for i, f in enumerate(cf.as_completed(futures), 1):
            rec = f.result()
            records.append(rec)
            raw.write(json.dumps(rec, ensure_ascii=False) + "\n")
            mark = "x" if rec.get("error") else "."
            print(mark, end="" if i % 50 else "\n", flush=True)
    print()

    # Report each set separately: "tuning" answers shaped the prompt; "holdout" answers were
    # written and frozen before any run, and the prompt must never be changed to fit them.
    case_sets = {c["id"]: case_set(e, c) for e in data["essays"] for c in e["cases"]}
    parts = []
    agreement = {}
    for name in SETS:
        recs = [r for r in records if case_sets[r["case"]] == name]
        if recs:
            parts.append(summarise(data, recs, model, args.runs).replace("# Marker pilot:", f"# Marker pilot ({name} set):", 1))
            agreement[name] = total_agreement(data, recs)
    header = [f"Prompt version: {PROMPT_VERSION}", "", "| Set | Majority total equals the label | Answers |", "| --- | --- | --- |"]
    for name, (ok, n) in agreement.items():
        header.append(f"| {name} | {ok} of {n} ({100 * ok / n:.0f}%) | {n} |")
    report = "\n".join(header) + "\n\n" + "\n".join(parts)
    (out_dir / "report.md").write_text(report, encoding="utf-8")
    print(report)
    print(f"Saved: {out_dir.relative_to(REPO)}/report.md and raw.jsonl")
    if args.gate:
        bars = {"tuning": 0.90, "holdout": 0.80}
        failed = [f"{name} {ok}/{n} is under {int(bars[name] * 100)}%" for name, (ok, n) in agreement.items() if name in bars and n and ok / n < bars[name]]
        if failed:
            print("GATE FAILED: " + "; ".join(failed), file=sys.stderr)
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
