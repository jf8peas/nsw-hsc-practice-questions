#!/usr/bin/env python3
"""
Smoke test for the essay unit's plan review (spec 010, research R5): not part of the marker gate.

Sends four hand-built scaffolds (a strong plan, a plan with no data, a plan that is about the wrong economy, and a
plan that is far too long for its content) through the review prompt in lib/essay/review.json, several times each,
with the same OpenRouter setup as the app (OPENROUTER_API_KEY, temperature 0, JSON reply). Then reports, per reply:

  - seven lines: exactly the seven check ids, each a strength or a fix, each line at most 240 characters
  - questions: every fix contains a question mark (the proxy for "never writes sentences for the student")
  - no mark: no mark, band or rewritten text in the reply
  - figure flags: the planted wrong figure in the "wrongfigure" plan is flagged, and no flag gives a number of its own
  - cut-offs: any reply that ended at max_tokens

Usage (from the repo root, in Git Bash):
  python scripts/pilot-essay-review.py --check      # offline: the prompts render
  python scripts/pilot-essay-review.py              # 4 plans x 3 runs
  python scripts/pilot-essay-review.py --runs 5 --model deepseek/deepseek-chat

Model: --model, else ESSAY_REVIEW_MODEL, else deepseek/deepseek-v4.1-flash. Standard library only. The key is read
from the environment, then .env.local, then .env, and is never printed.
"""

from __future__ import annotations

import argparse
import concurrent.futures as cf
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
REVIEW = json.loads((REPO / "lib" / "essay" / "review.json").read_text(encoding="utf-8"))
RUBRIC = json.loads((REPO / "lib" / "essay" / "rubric.json").read_text(encoding="utf-8"))
ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "deepseek/deepseek-v4.1-flash"
MAX_TOKENS = 2500
TIMEOUT_S = 120
IDS = [c["id"] for c in REVIEW["checks"]]

QUESTION = "Evaluate the effectiveness of the strategies used to promote economic growth and development in one emerging and one developing economy you have studied."
RULE = "one emerging AND one developing economy (here China and Nepal); both must be treated"
WRONG = "China's GDP was $90 trillion in 2020"

SECTIONS = {
    "intro": ["Judgement (one sentence answering the question)", "Key terms to define", "Economy or economies and their status"],
    "body": ["Point (topic sentence)", "Theory or model", "Data and indicators (with year)", "Evaluation (limitation or counterpoint)", "Link back to the judgement"],
    "conclusion": ["Restated judgement", "The reason that weighs most"],
}


def plan_text(intro, bodies, conclusion) -> str:
    out = ["Introduction\n" + "\n".join(f"- {k}: {v or '(empty)'}" for k, v in zip(SECTIONS["intro"], intro))]
    for i, b in enumerate(bodies, 1):
        out.append(f"Body paragraph {i}\n" + "\n".join(f"- {k}: {v or '(empty)'}" for k, v in zip(SECTIONS["body"], b)))
    out.append("Conclusion\n" + "\n".join(f"- {k}: {v or '(empty)'}" for k, v in zip(SECTIONS["conclusion"], conclusion)))
    return "\n\n".join(out)


PLANS = {
    "strong": plan_text(
        ["Both strategies worked, but China's export-led model was more effective than Nepal's remittance model", "globalisation, effectiveness, HDI", "China (emerging), Nepal (developing)"],
        [
            ["China's WTO entry in 2001 drove export-led growth", "comparative advantage", "exports rose from about 4% to 20% of world trade, 2001 to 2020", "income inequality widened", "supports the judgement"],
            ["Nepal relies on remittances after 1990s liberalisation", "Harrod-Domar", "remittances about 22% of GDP, 2023", "dependence and little investment", "weaker model than China's"],
            ["Both used external bodies: IMF and World Bank programs", "AD/AS", "poverty rate fell, 2000 to 2020", "environmental costs", "China's results were stronger"],
        ],
        ["China was more effective", "growth outweighs the costs"],
    ),
    "nodata": plan_text(
        ["Globalisation was good for both economies", "", "China and Nepal"],
        [["Trade grew", "", "", "", ""], ["Money from abroad helped Nepal", "", "", "", ""], ["Governments helped", "", "", "", ""]],
        ["Good for both", ""],
    ),
    "wrongeconomy": plan_text(
        ["Australia benefited from globalisation through mining exports", "globalisation", "Australia (advanced)"],
        [["Iron ore exports to China, 2010", "comparative advantage", "iron ore exports were $60 billion in 2010", "boom and bust", "supports the judgement"], ["", "", "", "", ""], ["", "", "", "", ""]],
        ["Australia did well", "mining"],
    ),
    "wrongfigure": plan_text(
        ["China's strategies were highly effective but Nepal's were only partly effective", "globalisation, HDI", "China (emerging), Nepal (developing)"],
        [
            ["China's SEZs from 1980 attracted FDI", "Harrod-Domar", WRONG, "uneven regional gains", "supports the judgement"],
            ["Nepal's remittances raised household income", "AD/AS", "remittances about 22% of GDP in 2023", "dependence", "Nepal partly effective"],
            ["", "", "", "", ""],
        ],
        ["China more effective", "growth weighs most"],
    ),
}


def render(template: str, values: dict) -> str:
    return re.sub(r"\{(\w+)\}", lambda m: str(values[m.group(1)]) if m.group(1) in values else m.group(0), template)


def build(plan: str) -> list[dict]:
    values = {
        "question": QUESTION,
        "verb": "evaluate",
        "verbMeaning": RUBRIC["verbMeanings"]["evaluate"],
        "economyRule": RULE,
        "checks": "\n".join(f"- {c['id']}: {c['look']}" for c in REVIEW["checks"]),
        "plan": plan,
    }
    return [{"role": "system", "content": REVIEW["system"]}, {"role": "user", "content": render(REVIEW["userTemplate"], values)}]


def load_env_value(name: str) -> str | None:
    if os.environ.get(name):
        return os.environ[name]
    for fname in (".env.local", ".env"):
        p = REPO / fname
        if p.exists():
            for line in p.read_text(encoding="utf-8").splitlines():
                m = re.match(rf"\s*{name}\s*=\s*(.*)\s*$", line)
                if m:
                    return m.group(1).strip().strip('"').strip("'")
    return None


def call(key: str, model: str, messages: list[dict]):
    body = json.dumps({"model": model, "messages": messages, "temperature": 0, "max_tokens": MAX_TOKENS, "response_format": {"type": "json_object"}}).encode("utf-8")
    req = urllib.request.Request(ENDPOINT, data=body, headers={"authorization": f"Bearer {key}", "content-type": "application/json", "X-Title": "NSW HSC Practice (review pilot)"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as res:
            data = json.loads(res.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"], data["choices"][0].get("finish_reason"), None
    except urllib.error.HTTPError as e:
        return None, None, f"http {e.code}"
    except Exception as e:  # noqa: BLE001
        return None, None, f"{type(e).__name__}: {str(e)[:120]}"


def check_reply(name: str, content: str | None, finish: str | None, err: str | None, plan: str) -> dict:
    rec = {"plan": name, "seven": False, "questions": False, "noMark": False, "flagOk": True, "cutOff": finish == "length", "problems": [], "seconds": 0.0}
    if err or not content:
        rec["problems"].append(err or "no content")
        return rec
    s, e = content.find("{"), content.rfind("}")
    try:
        obj = json.loads(content[s : e + 1])
    except Exception:  # noqa: BLE001
        rec["problems"].append("bad JSON")
        return rec
    checks = obj.get("checks") or []
    ids = [c.get("id") for c in checks if isinstance(c, dict)]
    rec["seven"] = sorted(ids) == sorted(IDS) and all(c.get("status") in ("strength", "fix") and 0 < len(c.get("line", "")) <= 240 for c in checks)
    fixes = [c for c in checks if c.get("status") == "fix"]
    rec["questions"] = all("?" in c.get("line", "") for c in fixes)
    rec["noMark"] = not any(k in obj for k in ("mark", "band", "rewrite", "rewritten", "sample"))
    flags = obj.get("figureFlags") or []
    for f in flags:
        quote, why = f.get("quote", ""), f.get("why", "")
        in_quote = set(re.findall(r"\d+(?:[.,]\d+)*", quote))
        if any(n not in in_quote for n in re.findall(r"\d+(?:[.,]\d+)*", why)):
            rec["problems"].append(f"flag gives its own number: {why[:80]}")
    if name == "wrongfigure":
        rec["flagOk"] = any("90 trillion" in (f.get("quote") or "") for f in flags)
    if not rec["seven"]:
        rec["problems"].append("not seven valid check lines")
    if not rec["questions"]:
        rec["problems"].append("a fix is not a question")
    return rec


def run_one(key, model, name, plan):
    t0 = time.time()
    content, finish, err = call(key, model, build(plan))
    rec = check_reply(name, content, finish, err, plan)
    rec["seconds"] = round(time.time() - t0, 1)
    rec["reply"] = (content or "")[:1500]
    return rec


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--model", default=None)
    ap.add_argument("--check", action="store_true", help="offline: render every prompt, then exit")
    args = ap.parse_args()

    if args.check:
        for name, plan in PLANS.items():
            msgs = build(plan)
            assert "{plan}" not in msgs[1]["content"] and "{checks}" not in msgs[1]["content"], name
            print(f"{name}: prompt renders ({len(msgs[1]['content'])} characters)")
        print(f"\nOK: {len(PLANS)} plans, prompt {REVIEW['promptVersion']}.")
        return 0

    key = load_env_value("OPENROUTER_API_KEY")
    if not key:
        print("OPENROUTER_API_KEY is not set (environment, .env.local or .env).", file=sys.stderr)
        return 1
    model = args.model or load_env_value("ESSAY_REVIEW_MODEL") or DEFAULT_MODEL
    print(f"Reviewing {len(PLANS)} plans x {args.runs} runs with {model} (prompt {REVIEW['promptVersion']})...")
    jobs = [(n, p) for n, p in PLANS.items() for _ in range(args.runs)]
    with cf.ThreadPoolExecutor(max_workers=4) as pool:
        recs = list(pool.map(lambda j: run_one(key, model, *j), jobs))

    ok = lambda f: sum(1 for r in recs if f(r))  # noqa: E731
    total = len(recs)
    secs = sorted(r["seconds"] for r in recs)
    p95 = secs[min(len(secs) - 1, int(0.95 * len(secs)))]
    gate = [
        ("seven valid lines on every reply", ok(lambda r: r["seven"]) == total, f"{ok(lambda r: r['seven'])} of {total}"),
        ("every fix is a question", ok(lambda r: r["questions"]) == total, f"{ok(lambda r: r['questions'])} of {total}"),
        ("no mark, band or rewritten text", ok(lambda r: r["noMark"]) == total, f"{ok(lambda r: r['noMark'])} of {total}"),
        ("the planted wrong figure is flagged", all(r["flagOk"] for r in recs if r["plan"] == "wrongfigure"), f"{ok(lambda r: r['plan'] == 'wrongfigure' and r['flagOk'])} of {ok(lambda r: r['plan'] == 'wrongfigure')}"),
        ("no flag gives a number of its own", not any("number" in p for r in recs for p in r["problems"]), "see problems"),
        ("no reply cut off at max_tokens", not any(r["cutOff"] for r in recs), f"{ok(lambda r: r['cutOff'])} cut off"),
        ("p95 seconds at most 25", p95 <= 25, f"p95 {p95:.1f}s"),
    ]
    out = [f"# Plan review pilot (prompt {REVIEW['promptVersion']}, model {model})", "", "| Check | Result | Detail |", "| --- | --- | --- |"]
    out += [f"| {n} | {'PASS' if p else 'FAIL'} | {d} |" for n, p, d in gate]
    out += ["", f"Overall: **{'PASS' if all(p for _n, p, _d in gate) else 'FAIL'}**", ""]
    for r in recs:
        if r["problems"]:
            out.append(f"- {r['plan']}: {'; '.join(r['problems'])}")
    out_dir = REPO / "resources" / "topic011" / "runs"
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d-%H%M%S")
    (out_dir / f"review-{stamp}.md").write_text("\n".join(out) + "\n", encoding="utf-8")
    (out_dir / f"review-{stamp}.jsonl").write_text("\n".join(json.dumps(r, ensure_ascii=False) for r in recs) + "\n", encoding="utf-8")
    print("\n".join(out))
    print(f"Saved: resources/topic011/runs/review-{stamp}.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
