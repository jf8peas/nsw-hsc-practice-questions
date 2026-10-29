import type { Question } from "@/lib/types";
import { conceptOfQuestionId } from "./concept-tags";
import { gravitationQuestions } from "./questions-gravitation";
import { projectileQuestions } from "./questions-projectiles";
import { circularQuestions } from "./questions-circular";

// PUBLIC — no answer keys here. Module 5 Advanced Mechanics (2017 syllabus, examined in the
// 2027 HSC). Every question is copied word for word from a school trial or half-yearly paper and
// shows its source (constitution Principle V); no HSC questions. See
// docs/y12-physics-advanced-mechanics-research.md.
export const questions: Question[] = [...gravitationQuestions, ...projectileQuestions, ...circularQuestions].map(
  (q) => ({ ...q, concept: conceptOfQuestionId[q.id] }),
);
