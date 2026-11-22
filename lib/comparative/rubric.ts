// The comparative unit's marking prompt (spec 009 FR-016, research R6): its own file, lib/comparative/rubric.json,
// based on spec 008's with the two comparison skills, NESA's "compare" and the one-pairing model-answer rule.
// Its promptVersion is bumped on every change. The pilot script (scripts/pilot-unseen-marker.py --unit comparative)
// reads the same JSON file the app does, so they can never differ. This module only types the file; it is
// server-side data (the prompt holds no answers), imported by lib/grading.server.ts and the content validator.

import type { Rubric } from "@/lib/unseen/marker.server";

import rubricJson from "./rubric.json";

/**
 * max_tokens for the comparative marker (spec 009 T022). The model reasons before it replies: at an uncapped tuning pass
 * (36 calls, run 20261121-185724) the longest completion was 5285 tokens, 4867 of them reasoning, and the default 4000
 * cut two of 108 replies off. 6607 (that longest completion plus 25%) was not enough for the longer texts: the holdout run
 * 20261121-185954 had 4 of 44 replies cut off, reasoning up to ~7500 tokens. Raised to 12000 by the teacher's decision; no
 * prompt change. scripts/pilot-unseen-marker.py (COMPARATIVE_MAX_TOKENS) holds the same number; tests/unseen/pilot-comparative.test.ts
 * keeps them equal. A longer budget means a slower worst case: the first-call timeout (40 s) is checked against the next run's p95.
 */
export const COMPARATIVE_MAX_TOKENS = 12000;

export const comparativeRubric = rubricJson as unknown as Rubric;
export const COMPARATIVE_PROMPT_VERSION = comparativeRubric.promptVersion;
