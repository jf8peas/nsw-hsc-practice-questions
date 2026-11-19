#!/usr/bin/env python3
"""
Pilot the AI marker for spec 008 (Advanced English unseen-text short answers) before /speckit-specify.

Sends every labelled answer in resources/english-unseen/pilot-questions.json through the DRAFT marking
prompt in lib/unseen/rubric.json (the file the app sends; the seven skills are in lib/unseen/skills.json), several
times each, using the same OpenRouter setup as the app (OPENROUTER_API_KEY, ENGLISH_ADV_GRADING_MODEL, temperature
0, JSON reply). Then reports:

  - mark agreement : is the majority mark inside the labelled range? (and within 1 of it?)
  - skill catch    : of the skills an answer was written to miss, how many were marked missed?
  - false docks    : on answers that should meet every skill, how many skills were marked missed?
  - description    : for visual texts, did the marker flag a description that is too thin to mark from?
  - consistency    : did repeated runs give the same mark?

Usage (from the repo root, in Git Bash):
  python scripts/pilot-unseen-marker.py --check                 # offline: data, word counts, no API calls
  python scripts/pilot-unseen-marker.py --show-prompt fs25-q1-mid
  python scripts/pilot-unseen-marker.py                         # full run, 3 runs per answer
  python scripts/pilot-unseen-marker.py --runs 5 --only fs23-q1
  python scripts/pilot-unseen-marker.py --model deepseek/deepseek-v4.1-flash  # default: ENGLISH_ADV_GRADING_MODEL

Standard library only. The key is read from the environment, then .env.local, then .env, and never printed.
Results go to resources/english-unseen/runs/<timestamp>/ (report.md + raw.jsonl).
The holdout set (--set holdout: Cheltenham Girls 2023, St George Girls 2025) is NEVER used to tune the prompt.
"""

from __future__ import annotations

import argparse
import hashlib
import concurrent.futures as cf
import datetime as dt
import json
import os
import re
import sys
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
BASE = REPO / "resources" / "english-unseen"
DATA_PATH = BASE / "pilot-questions.json"
RUBRIC_PATH = REPO / "lib" / "unseen" / "rubric.json"
SKILLS_PATH = REPO / "lib" / "unseen" / "skills.json"
RUNS_DIR = BASE / "runs"
FIXTURES = REPO / "tests" / "fixtures"
FIXTURE_PATH = FIXTURES / "unseen-prompt-input.json"
GOLDEN_PATH = FIXTURES / "unseen-prompt.golden.txt"
HASH_PATH = FIXTURES / "unseen-rubric.hash"

ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "deepseek/deepseek-v4.1-flash"  # the unit's default (ENGLISH_ADV_GRADING_MODEL); never GRADING_MODEL
TIMEOUT_S = 90
MAX_TOKENS = 4000  # room for models that reason before replying

RUBRIC = json.loads(RUBRIC_PATH.read_text(encoding="utf-8"))
PROMPT_VERSION = RUBRIC["promptVersion"]
SKILLS = [s["id"] for s in json.loads(SKILLS_PATH.read_text(encoding="utf-8"))]


# ---- helpers ------------------------------------------------------------------------------


def count_words(text: str) -> int:
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


def all_cases(data: dict):
    for q in data["questions"]:
        for c in q["cases"]:
            yield q, c


def build_messages(q: dict, c: dict) -> list[dict]:
    text = c.get("textOverride") or q["text"]
    visual_note = (
        " — VISUAL TEXT: you cannot see the image; this is a written description of it" if q.get("visual") else ""
    )
    by_id = {x["id"]: x for x in q["cases"]}
    anchor_id = next((a for a in q.get("anchors", []) if by_id[a]["answer"] != c["answer"]), None)
    anchor = by_id[anchor_id]["answer"] if anchor_id else "None available."
    values = {
        "anchor": anchor,
        "marks": q["marks"],
        "questionHeading": q["questionHeading"],
        "question": q["question"],
        "directive": q["directive"],
        "directiveDefinition": RUBRIC["directiveVerbs"].get(q["directive"], ""),
        "textForm": q["textForm"],
        "visualNote": visual_note,
        "text": text,
        "criteria": q["criteria"],
        "notes": q["notes"] or "None provided.",
        "suggestedWords": q["suggestedWords"],
        "wordCount": count_words(c["answer"]),
        "answer": c["answer"],
    }
    user = RUBRIC["userTemplate"]
    for k, v in values.items():
        user = user.replace("{" + k + "}", str(v))
    return [{"role": "system", "content": RUBRIC["systemPrompt"]}, {"role": "user", "content": user}]


def call_model(key: str, model: str, messages: list[dict]) -> tuple[str | None, str | None]:
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
            "X-Title": "NSW HSC Practice (unseen marker pilot)",
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
        choice = data["choices"][0]
        content = choice["message"].get("content")
    except (KeyError, IndexError, TypeError, AttributeError):
        return None, f"no content: {json.dumps(data)[:200]}"
    if not content or not content.strip():
        return None, f"empty reply (finish_reason={choice.get('finish_reason')})"
    if choice.get("finish_reason") == "length":
        return None, "reply cut off at max_tokens"
    return content, None


def parse_reply(content: str, max_mark: int) -> tuple[dict | None, str | None]:
    s = content.strip()
    s = re.sub(r"^```(?:json)?\s*|\s*```$", "", s)
    try:
        r = json.loads(s)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", s, re.S)
        if not m:
            return None, "not JSON"
        try:
            r = json.loads(m.group(0))
        except json.JSONDecodeError:
            return None, "not JSON"
    mark = r.get("mark")
    if not isinstance(mark, int) or not 0 <= mark <= max_mark:
        return None, f"bad mark {mark!r}"
    skills = r.get("skills") or {}
    missing = [s for s in SKILLS if not isinstance(skills.get(s, {}).get("met"), bool)]
    if missing:
        return None, f"missing skill verdicts: {', '.join(missing)}"
    # mirrors lib/unseen/marker.server.ts: feedback is always required. At full marks there is no gap to
    # name, so biggestGap may be null or empty and goFurther is required instead; below full marks
    # biggestGap is required and goFurther is dropped.
    feedback = r.get("feedback")
    if not isinstance(feedback, str) or not feedback.strip():
        return None, "no feedback"
    gap = r.get("biggestGap")
    gap = gap.strip() if isinstance(gap, str) else ""
    go = r.get("goFurther")
    go = go.strip() if isinstance(go, str) else ""
    if mark == max_mark:
        if not go:
            return None, "full-mark reply has no goFurther"
        r["goFurther"] = go
        r["biggestGap"] = gap
    else:
        if not gap:
            return None, "below-full reply has no biggestGap"
        r["biggestGap"] = gap
        r["goFurther"] = None
    return r, None


ECHO_RUN = 60


def _squash(t: str) -> str:
    return re.sub(r"\s+", " ", t).strip().lower()


def reply_echoes_anchor(q: dict, c: dict, reply: dict) -> bool:
    """Would the app echo guard reject this reply? A 60-character run of the model answer (the anchor)
    in the reply feedback, gap or reasons, outside the stimulus. Windows that start or end on a space
    are skipped, as in lib/unseen/marker.server.ts."""
    by_id = {x["id"]: x for x in q["cases"]}
    anchor_id = next((a for a in q.get("anchors", []) if by_id[a]["answer"] != c["answer"]), None)
    if not anchor_id:
        return False
    model = _squash(by_id[anchor_id]["answer"])
    stimulus = _squash(c.get("textOverride") or q["text"])
    out = " ".join(
        [reply.get("feedback") or "", reply.get("biggestGap") or "", reply.get("goFurther") or ""]
        + [v.get("reason", "") for v in (reply.get("skills") or {}).values() if isinstance(v, dict)]
    )
    out = _squash(out)
    for i in range(0, max(0, len(model) - ECHO_RUN + 1)):
        w = model[i : i + ECHO_RUN]
        if w.startswith(" ") or w.endswith(" "):
            continue
        if w in out and w not in stimulus:
            return True
    return False


def mark_once(key, model, q, c, run, attempts=2):
    """One marking, retried once on an empty, cut-off or unparseable reply. Never raises."""
    rec = {"case": c["id"], "question": q["id"], "run": run, "model": model, "promptVersion": PROMPT_VERSION}
    for attempt in range(1, attempts + 1):
        try:
            content, err = call_model(key, model, build_messages(q, c))
            if err:
                rec["error"] = err
                continue
            parsed, perr = parse_reply(content, q["marks"])
            if perr:
                rec["error"] = perr
                rec["raw"] = content[:2000]
                continue
            rec.pop("error", None)
            rec.pop("raw", None)
            rec["echo"] = reply_echoes_anchor(q, c, parsed)
            rec["reply"] = parsed
            rec["attempts"] = attempt
            return rec
        except Exception as e:  # never let one call stop the run
            rec["error"] = f"{type(e).__name__}: {str(e)[:200]}"
    return rec


# ---- golden prompt (the app and this script must send the same prompt) -------------------------


def rubric_hash() -> str:
    """sha256 of the prompt parts, as tests/unseen/rubric-drift.test.ts computes it (line endings do not matter)."""
    verbs = "\n".join(f"{k}={v}" for k, v in sorted(RUBRIC["directiveVerbs"].items()))
    blob = "\n---\n".join([RUBRIC["systemPrompt"], RUBRIC["userTemplate"], verbs])
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


def golden_text() -> str:
    """The messages for the synthetic fixture, in the format tests/unseen/prompt.test.ts compares."""
    q = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))["question"]
    c = next(x for x in q["cases"] if x["id"].endswith("-student"))
    system, user = build_messages(q, c)
    return f"===== SYSTEM =====\n{system['content']}\n===== USER =====\n{user['content']}\n"


def hash_line() -> str:
    return f"{PROMPT_VERSION} {rubric_hash()}\n"


def check_golden() -> list[str]:
    problems = []
    if not GOLDEN_PATH.exists():
        return [f"{GOLDEN_PATH.name} is missing: run --write-golden"]
    if GOLDEN_PATH.read_text(encoding="utf-8").replace("\r\n", "\n") != golden_text():
        problems.append("the rendered prompt differs from tests/fixtures/unseen-prompt.golden.txt (run --write-golden after bumping promptVersion)")
    if not HASH_PATH.exists() or HASH_PATH.read_text(encoding="utf-8").strip() != hash_line().strip():
        problems.append("tests/fixtures/unseen-rubric.hash is stale: bump promptVersion if the prompt changed, then run --write-golden")
    return problems


# ---- checks -------------------------------------------------------------------------------


def check_data(data: dict) -> list[str]:
    problems = []
    seen = set()
    for q, c in all_cases(data):
        if c["id"] in seen:
            problems.append(f"duplicate case id {c['id']}")
        seen.add(c["id"])
        if c.get("needsLabel"):
            problems.append(f"{c['id']}: needsLabel is still true; set expectMark and expectMissed, then clear needsLabel")
            continue
        lo, hi = c["expectMark"]
        if not 0 <= lo <= hi <= q["marks"]:
            problems.append(f"{c['id']}: expectMark {c['expectMark']} outside 0..{q['marks']}")
        for s in c.get("expectMissed", []):
            if s not in SKILLS:
                problems.append(f"{c['id']}: unknown skill {s}")
        if count_words(c["answer"]) < 20:
            problems.append(f"{c['id']}: under 20 words (the app would block it, FR-017)")
    for q in data["questions"]:
        if not q["text"].strip():
            problems.append(f"{q['id']}: empty text")
    return problems


def word_table(data: dict) -> str:
    rows = ["| Case | Words | Suggested | Over by | App would |", "| --- | --- | --- | --- | --- |"]
    for q, c in all_cases(data):
        n, s = count_words(c["answer"]), q["suggestedWords"]
        over = (n - s) / s if s else 0
        verdict = "block (>20% over)" if over > 0.20 else ("warn" if over > 0 else "allow")
        rows.append(f"| {c['id']} | {n} | {s} | {max(0, round(over * 100))}% | {verdict} |")
    return "\n".join(rows)


# ---- report -------------------------------------------------------------------------------


def summarise(data: dict, records: list[dict], model: str, runs: int) -> str:
    by_case = defaultdict(list)
    for r in records:
        by_case[r["case"]].append(r)

    lines = []
    tot = in_range = within1 = consistent = 0
    caught = should_catch = 0
    false_docks = full_skill_checks = 0
    desc_ok = desc_total = 0
    errors = sum(1 for r in records if "error" in r)
    skill_miss_counter = Counter()
    case_rows = []

    for q, c in all_cases(data):
        recs = [r for r in by_case.get(c["id"], []) if "reply" in r]
        if not recs:
            if c["id"] in by_case:
                case_rows.append(f"| {c['id']} | {c['origin']} | {c['expectMark']} | errors only | | | |")
            continue
        marks = [r["reply"]["mark"] for r in recs]
        maj = Counter(marks).most_common(1)[0][0]
        lo, hi = c["expectMark"]
        tot += 1
        ok = lo <= maj <= hi
        in_range += ok
        within1 += lo - 1 <= maj <= hi + 1
        consistent += len(set(marks)) == 1

        # skills: majority verdict per skill
        missed_major = []
        for s in SKILLS:
            v = [r["reply"]["skills"][s]["met"] for r in recs]
            if v.count(False) > len(v) / 2:
                missed_major.append(s)
                skill_miss_counter[s] += 1
        exp = c.get("expectMissed", [])
        caught += sum(1 for s in exp if s in missed_major)
        should_catch += len(exp)
        if c.get("allSkillsMet"):
            full_skill_checks += len(SKILLS)
            false_docks += len(missed_major)

        desc = ""
        if "expectDescriptionAdequate" in c:
            d = [r["reply"].get("descriptionAdequate") for r in recs]
            dmaj = Counter(d).most_common(1)[0][0]
            desc_total += 1
            desc_ok += dmaj == c["expectDescriptionAdequate"]
            desc = f"{dmaj} (want {c['expectDescriptionAdequate']})"

        flag = "" if ok else " ✗"
        exp_s = ", ".join(exp) or ("none (all met)" if c.get("allSkillsMet") else "—")
        case_rows.append(
            f"| {c['id']}{flag} | {c['origin']} | {lo}–{hi} | {', '.join(map(str, marks))} | "
            f"{exp_s} | {', '.join(missed_major) or 'none'} | {desc} |"
        )

    def pct(a, b):
        return f"{a}/{b} ({round(100 * a / b)}%)" if b else "n/a"

    lines += [
        f"# Unseen-text marker pilot — {dt.datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "",
        f"Model `{model}` · prompt `{PROMPT_VERSION}` · {runs} run(s) per answer · {len(records)} calls · {errors} errors",
        "",
        "## Summary",
        "",
        f"- Majority mark inside the labelled range: {pct(in_range, tot)}",
        f"- Majority mark within 1 of the range: {pct(within1, tot)}",
        f"- Same mark on every run: {pct(consistent, tot)}",
        f"- Skills an answer was written to miss, marked missed: {pct(caught, should_catch)}",
        f"- False docks on answers that should meet every skill: {pct(false_docks, full_skill_checks)}",
        f"- Visual description verdict as expected: {pct(desc_ok, desc_total)}",
        "",
        "Skills marked missed (majority), across all answers: "
        + ", ".join(f"{s} {skill_miss_counter[s]}" for s in SKILLS),
        "",
        "## Per answer",
        "",
        "✗ = majority mark outside the labelled range.",
        "",
        "| Case | Origin | Want | Marks per run | Written to miss | Marked missed (majority) | Description |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        *case_rows,
        "",
        "## Answer length vs suggested length (FR-018)",
        "",
        word_table(data),
        "",
        "## Marker feedback (first run of each answer)",
        "",
    ]
    for q, c in all_cases(data):
        recs = [r for r in by_case.get(c["id"], []) if "reply" in r]
        if not recs:
            continue
        r = recs[0]["reply"]
        lines.append(f"**{c['id']}** — mark {r['mark']}/{q['marks']}")
        lines.append(f"- Feedback: {r.get('feedback', '')}")
        lines.append(f"- Biggest gap: {r.get('biggestGap') or ''}")
        if r.get("goFurther"):
            lines.append(f"- To go further: {r['goFurther']}")
        for s in SKILLS:
            v = r["skills"][s]
            lines.append(f"  - {'met' if v['met'] else 'MISSED'} · {s}: {v.get('reason', '')}")
        lines.append("")
    full = [(q, r) for q, c in all_cases(data) for r in by_case.get(c["id"], []) if "reply" in r and r["reply"]["mark"] == q["marks"]]
    with_go = [1 for _, r in full if r["reply"].get("goFurther")]
    no_go = [r for r in records if "error" in r and "goFurther" in r["error"]]
    lines += [
        "## To go further check",
        "",
        f"- Full-mark replies with a goFurther: {len(with_go)}/{len(full)}"
        + (f"; {len(no_go)} reply(ies) rejected for lacking one" if no_go else ""),
        "- PASS" if len(with_go) == len(full) else "- FAIL: a full-mark reply has no goFurther",
        "",
    ]
    errs = [r for r in records if "error" in r]
    if errs:
        lines += ["## Errors", ""] + [f"- {r['case']} run {r['run']}: {r['error']}" for r in errs]
    return "\n".join(lines) + "\n"


# ---- the gate: every set, reported separately ------------------------------------------------

GATE_TUNING_IN_RANGE = 0.90
GATE_HOLDOUT_IN_RANGE = 0.80


def set_stats(data: dict, records: list[dict]) -> dict:
    by_case = defaultdict(list)
    for r in records:
        by_case[r["case"]].append(r)
    st = dict(total=0, in_range=0, within1=0, off_by_more=[], caught=0, should_catch=0, false_docks=0, checks=0, echo=0)
    for q, c in all_cases(data):
        recs = [r for r in by_case.get(c["id"], []) if "reply" in r]
        st["echo"] += sum(1 for r in recs if r.get("echo"))
        if not recs:
            continue
        marks = [r["reply"]["mark"] for r in recs]
        maj = Counter(marks).most_common(1)[0][0]
        lo, hi = c["expectMark"]
        st["total"] += 1
        st["in_range"] += lo <= maj <= hi
        st["within1"] += lo - 1 <= maj <= hi + 1
        if not lo - 1 <= maj <= hi + 1:
            st["off_by_more"].append(c["id"])
        missed = [sk for sk in SKILLS if [r["reply"]["skills"][sk]["met"] for r in recs].count(False) > len(recs) / 2]
        exp = c.get("expectMissed", [])
        st["caught"] += sum(1 for sk in exp if sk in missed)
        st["should_catch"] += len(exp)
        if c.get("allSkillsMet"):
            st["checks"] += len(SKILLS)
            st["false_docks"] += len(missed)
    return st


def gate_report(data: dict, records: list[dict], model: str, runs: int) -> tuple[str, bool]:
    """Three sections (tuning, holdout, field) and whether the gate passed. Field cases are reported, not gated."""

    def pct(a, b):
        return f"{a}/{b} ({round(100 * a / b)}%)" if b else "n/a"

    lines = [
        f"# Unseen-text marker gate - {dt.datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "",
        f"Model `{model}` · prompt `{PROMPT_VERSION}` · {runs} run(s) per answer · {len(records)} calls",
        "",
    ]
    passed = True
    for name in ("tuning", "holdout", "field"):
        sub_data = {**data, "questions": [q for q in data["questions"] if q.get("set", "tuning") == name]}
        st = set_stats(sub_data, records)
        lines.append(f"## {name.capitalize()} set")
        if name == "holdout":
            lines.append("holdout: not for tuning")
        if name == "field":
            lines.append("reported, not gated: a flagged answer label is a human judgement")
        lines += [
            "",
            f"- In range: {pct(st['in_range'], st['total'])}",
            f"- Within 1 of the range: {pct(st['within1'], st['total'])}",
            f"- Skills written to miss, caught: {pct(st['caught'], st['should_catch'])}",
            f"- False docks: {pct(st['false_docks'], st['checks'])}",
            f"- Replies the echo guard would reject: {st['echo']}",
        ]
        if st["off_by_more"]:
            lines.append(f"- More than 1 mark out: {', '.join(st['off_by_more'])}")
        lines.append("")
        if name == "tuning" and st["total"] and st["in_range"] / st["total"] < GATE_TUNING_IN_RANGE:
            passed = False
            lines.append(f"FAIL: tuning in-range is under {round(GATE_TUNING_IN_RANGE * 100)}%\n")
        if name == "holdout" and st["total"] and st["in_range"] / st["total"] < GATE_HOLDOUT_IN_RANGE:
            passed = False
            lines.append(f"FAIL: holdout in-range is under {round(GATE_HOLDOUT_IN_RANGE * 100)}%\n")
        if name != "field" and st["off_by_more"]:
            passed = False
    lines.append("Gate: " + ("PASSED" if passed else "FAILED"))
    return "\n".join(lines) + "\n", passed


# ---- main ---------------------------------------------------------------------------------


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="offline checks only, no API calls")
    ap.add_argument("--show-prompt", metavar="CASE_ID", help="print the messages sent for one answer")
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--only", default=None, help="only cases whose id starts with this")
    ap.add_argument("--model", default=None, help="model slug (default: ENGLISH_ADV_GRADING_MODEL, else deepseek/deepseek-v4.1-flash)")
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--write-golden", action="store_true", help="regenerate the golden prompt and rubric hash fixtures")
    ap.add_argument("--set", choices=("tuning", "holdout", "field", "all"), default="tuning",
                    help="which questions to mark: the tuning set (default), the frozen holdout set, the field set (flagged answers), or all")
    ap.add_argument("--data", default=None, help="a pilot file other than resources/english-unseen/pilot-questions.json (tests)")
    ap.add_argument("--gate", action="store_true",
                    help="mark every case of every set and report tuning, holdout and field separately; exit 1 when "
                         "tuning in-range is under 90%%, holdout in-range under 80%%, or any tuning or holdout case is more than 1 mark out")
    args = ap.parse_args()

    if args.write_golden:
        GOLDEN_PATH.write_text(golden_text(), encoding="utf-8", newline="\n")
        HASH_PATH.write_text(hash_line(), encoding="utf-8", newline="\n")
        print(f"wrote {GOLDEN_PATH.name} and {HASH_PATH.name} for prompt {PROMPT_VERSION}")
        return 0

    data = json.loads((Path(args.data) if args.data else DATA_PATH).read_text(encoding="utf-8"))
    if args.gate:
        args.set = "all"
    if args.set != "all" and not args.show_prompt:
        data["questions"] = [q for q in data["questions"] if q.get("set", "tuning") == args.set]
    problems = check_data(data)

    if args.show_prompt:
        for q, c in all_cases(data):
            if c["id"] == args.show_prompt:
                for m in build_messages(q, c):
                    print(f"===== {m['role'].upper()} =====\n{m['content']}\n")
                return 0
        print(f"no case {args.show_prompt}", file=sys.stderr)
        return 1

    if args.check:
        print(f"{sum(1 for _ in all_cases(data))} answers across {len(data['questions'])} questions; prompt {PROMPT_VERSION}")
        print(word_table(data))
        print("\n".join(problems) if problems else "\nNo data problems.")
        golden = check_golden()
        print("\n".join(golden) if golden else "The rendered prompt equals the golden file (the app sends this prompt).")
        return 1 if problems or golden else 0

    unlabelled = [p for p in problems if "needsLabel" in p]
    if unlabelled:
        print("Refusing to mark: a case still needs its label.\n" + "\n".join(unlabelled), file=sys.stderr)
        return 1
    if problems:
        print("Data problems (fix or run --check):\n" + "\n".join(problems), file=sys.stderr)

    key = load_env_value("OPENROUTER_API_KEY")
    if not key:
        print("OPENROUTER_API_KEY not found in the environment, .env.local or .env", file=sys.stderr)
        return 2
    model = args.model or load_env_value("ENGLISH_ADV_GRADING_MODEL") or DEFAULT_MODEL

    jobs = [(q, c, run) for q, c in all_cases(data) if not args.only or c["id"].startswith(args.only)
            for run in range(1, args.runs + 1)]
    print(f"Marking {len(jobs)} calls with {model} (prompt {PROMPT_VERSION}) ...")
    records = []
    with cf.ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = [ex.submit(mark_once, key, model, q, c, run) for q, c, run in jobs]
        for i, f in enumerate(cf.as_completed(futs), 1):
            r = f.result()
            records.append(r)
            status = r.get("error") or f"mark {r['reply']['mark']}"
            print(f"  [{i}/{len(jobs)}] {r['case']} run {r['run']}: {status}")

    out = RUNS_DIR / dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    out.mkdir(parents=True, exist_ok=True)
    with (out / "raw.jsonl").open("w", encoding="utf-8") as fh:
        for r in sorted(records, key=lambda r: (r["case"], r["run"])):
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")
    report = summarise(data, records, model, args.runs).replace(
        "# Unseen-text marker pilot", f"# Unseen-text marker pilot ({args.set} set)", 1)
    (out / "report.md").write_text(report, encoding="utf-8")
    if args.gate:
        gate_text, passed = gate_report(data, records, model, args.runs)
        (out / "gate.md").write_text(gate_text, encoding="utf-8")
        print("\n" + gate_text)
        print(f"Full report: {out / 'report.md'}")
        return 0 if passed else 1
    print("\n" + report.split("## Per answer")[0])
    print(f"Full report: {out / 'report.md'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
