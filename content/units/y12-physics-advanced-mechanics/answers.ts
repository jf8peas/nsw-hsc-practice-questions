import type { AnswerSet } from "@/lib/types";
import { gravitationAnswers } from "./answers-gravitation";
import { projectileAnswers } from "./answers-projectiles";
import { circularAnswers } from "./answers-circular";

// Answer key for y12-physics-advanced-mechanics. NO "server-only" import here (the validator
// reads it); only re-exported via content/answers/index.ts, which is server-only. Never import
// from a client component.
export const answers: AnswerSet = Object.fromEntries([...gravitationAnswers, ...projectileAnswers, ...circularAnswers]);
