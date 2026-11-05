// Shared types for the paragraph-writing unit (spec 007, contracts/api.md). Type-only: safe in the
// browser bundle. These describe what MAY reach the browser and when (constitution Principle I,
// 2.14.0): the question view before phase 1 is marked, the verdicts after it, and the discussion
// (current model part, labels only for later parts) at the discussion or self-mark screen.

import type { BriefField, PartNo } from "@/lib/types";

export type CriterionKey = "a" | "b" | "c" | "d";

export interface CriterionView {
  key: CriterionKey;
  met: boolean;
  /** The marker's one line; "" on the self-mark path. */
  reason: string;
  /** Criterion d only. */
  subs?: { preciseLanguage: boolean; noPadding: boolean; withinLimit: boolean };
}

export interface EssayPartDot {
  part: PartNo;
  short: string;
  state: "done" | "current" | "later";
}

/** Released before phase 1 is marked. Earlier parts' model text only; never the current or later ones. */
export interface ParagraphQuestionView {
  essayNo: number;
  essayTotal: number;
  part: PartNo;
  partName: string;
  limit: number;
  verbDefinition: string;
  guidance: [string, string, string, string];
  brief: {
    economy: string;
    argument: string;
    counterpoint: string;
    chainSteps: string[];
    facts: string[];
    limitation: string[];
  };
  uses: BriefField[];
  earlier: Array<{ part: PartNo; label: string; text: string }>;
  parts: EssayPartDot[];
}

/** Released at the discussion or the self-mark screen only. Later parts are labels, never text. */
export interface ParagraphDiscussion {
  modelPart: string;
  commentary: string;
  modelWords: number;
  modelSoFar: Array<{ part: PartNo; label: string; text: string; current: boolean }>;
  laterSlots: Array<{ part: PartNo; label: string; when: string }>;
  next:
    | { kind: "part"; essayNo: number; part: PartNo; name: string }
    | { kind: "essay"; essayNo: number; part: 1; name: string }
    | { kind: "none" };
}

export type ParagraphEnding = "full_marks" | "corrected" | "no_correction" | "self_mark";

export interface ParagraphPhaseView {
  text: string;
  mark: number;
  criteria: CriterionView[];
  feedback: string;
  wordCount: number;
}

export interface ParagraphGradeResult {
  questionId: string;
  type: "paragraph";
  maxMarks: 4;
  phase: 1 | 2;
  /** 0..4 (phase 1) or 0..3 (phase 2, capped); null only when `needsSelfMark`. */
  marksAwarded: number | null;
  recordedMark?: number;
  criteria?: CriterionView[];
  feedback: string;
  wordCount: number;
  ending?: ParagraphEnding;
  /** On phase 2 and 409 responses: the first try, so the discussion can label the pills. */
  phase1?: ParagraphPhaseView;
  /** Only when final, or when `needsSelfMark`. */
  discussion?: ParagraphDiscussion;
  needsSelfMark: boolean;
}

/** The resume and start payload (data-model.md §4.2). */
export interface ParagraphState {
  stage: "write" | "correct" | "discussion";
  view: ParagraphQuestionView;
  draft1?: string;
  phase1?: ParagraphPhaseView;
  draft2?: string;
  phase2?: ParagraphPhaseView;
  ending?: ParagraphEnding;
  recordedMark?: number;
  flagged?: boolean;
  mode?: "marker" | "self_mark";
  discussion?: ParagraphDiscussion;
}

/** The recorded-mark outcome table lives with the components; the shape of the essay bar is shared. */
export interface EssayBar {
  essayNo: number;
  essayTotal: number;
  question: string;
  economy: string;
  parts: Array<{ part: PartNo; short: string; state: "done" | "next" | "later"; mark: number | null }>;
}
