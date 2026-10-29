import "server-only";

import { createHash, createHmac } from "node:crypto";
import type { ChatMessage } from "@/lib/openrouter.server";

/**
 * Transcribe server logic for photo answers.
 *
 * - buildVisionPrompt: Creates the vision model prompt (question only, no model answer/rubric)
 * - validateImage: Checks magic bytes for JPEG/PNG/WebP
 * - logTranscribeOutcome: Logs minimal structured metrics (FR-026)
 */

// ---- Vision prompt builder ------------------------------------------------

/**
 * Build the vision model prompt for transcribing a handwritten answer.
 *
 * IMPORTANT: The prompt gets ONLY the question prompt - never the model answer,
 * rubric, or marking notes (Principle I, FR-008).
 *
 * @param questionPrompt - The question text the student is answering
 * @returns Chat messages for the vision model
 */
export function buildVisionPrompt(questionPrompt: string): ChatMessage[] {
  const system: ChatMessage = {
    role: "system",
    content:
      "You are transcribing a handwritten NSW HSC short-answer response. " +
      "Write out exactly what is on the page in reading order. " +
      "Format maths as LaTeX (e.g. \\frac{1}{2}, x^2, \\sqrt{3}). " +
      "Mark crossed-out work as '[crossed out: ...]'. " +
      "Describe any drawn diagram in words (axes labels, curves, arrows, equilibrium points). " +
      "Do not correct or complete anything. " +
      "If more than a small part is unreadable, set legible to false. " +
      "If this is not an answer to the question (blank page, wrong question, selfie), set answersQuestion to false. " +
      "Reply with JSON only: { transcription: string, legible: boolean, answersQuestion: boolean, notes: string }.",
  };

  const user: ChatMessage = {
    role: "user",
    content: [
      { type: "text", text: `Question: ${questionPrompt}\n\nTranscribe the handwritten answer:` },
      // Images will be added here by the caller as { type: "image_url", image_url: { url: dataUrl } }
    ],
  };

  return [system, user];
}

// ---- Image validation -----------------------------------------------------

const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const WEBP_MAGIC_RIFF = Buffer.from([0x52, 0x49, 0x46, 0x46]); // "RIFF"
const WEBP_MAGIC_WEBP = Buffer.from([0x57, 0x45, 0x42, 0x50]); // "WEBP" at offset 8

/**
 * Validate an image buffer by checking magic bytes.
 *
 * @param buffer - The raw file buffer
 * @returns { ok: true } or { ok: false, reason: string }
 */
export function validateImage(buffer: Buffer): { ok: true } | { ok: false; reason: string } {
  if (buffer.length < 12) {
    return { ok: false, reason: "File too small to be a valid image" };
  }

  // Check JPEG: FF D8 FF
  if (buffer.slice(0, 3).equals(JPEG_MAGIC)) {
    return { ok: true };
  }

  // Check PNG: 89 50 4E 47
  if (buffer.slice(0, 4).equals(PNG_MAGIC)) {
    return { ok: true };
  }

  // Check WebP: RIFF....WEBP
  if (buffer.slice(0, 4).equals(WEBP_MAGIC_RIFF) && buffer.slice(8, 12).equals(WEBP_MAGIC_WEBP)) {
    return { ok: true };
  }

  return { ok: false, reason: "Not a valid JPEG, PNG, or WebP image" };
}

// ---- Logging (FR-026) -----------------------------------------------------

export type TranscribeOutcome =
  | "success"
  | "illegible"
  | "not-answer"
  | "model-fail"
  | "unparseable"
  | "rate-limited"
  | "over-cap"
  | "read-limit"
  | "already-answered"
  | "invalid-upload"
  | "db-unavailable";

export interface LogTranscribeOptions {
  userId: string;
  questionId: string;
  outcome: TranscribeOutcome;
  durationMs: number;
  model: string;
}

/**
 * Log a transcription outcome with minimal structured metrics (FR-026).
 *
 * - Hashes userId with HMAC-SHA256 using AUTH_SECRET (not bare SHA-256)
 * - Logs: timestamp, userIdHash, questionId, outcome, durationMs, model
 * - NEVER logs: image bytes, transcription text, model's raw reply
 *
 * @param options - Logging options
 */
export function logTranscribeOutcome(options: LogTranscribeOptions): void {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    // In production this should never happen (middleware would 503)
    return;
  }

  const userIdHash = createHmac("sha256", secret).update(options.userId).digest("hex");
  const timestamp = new Date().toISOString();

  // Structured log entry (FR-026 compliant)
  const logEntry = {
    timestamp,
    userIdHash,
    questionId: options.questionId,
    outcome: options.outcome,
    durationMs: options.durationMs,
    model: options.model,
  };

  // Use console.info for structured logging (Vercel will capture this)
  // Never include image data, transcription text, or model's raw reply
  console.info("[transcribe]", JSON.stringify(logEntry));
}

// ---- Answer format helpers ------------------------------------------------

export const TRANSCRIPTION_MARKER = "<<<TRANSCRIPTION>>>";
export const NOTE_MARKER = "<<<NOTE>>>";

/**
 * Format the stored answer from transcription and note.
 *
 * @param transcription - The transcribed text (with LaTeX)
 * @param note - Optional typed note (≤500 chars)
 * @returns Formatted answer string
 */
export function formatAnswer(transcription: string, note?: string): string {
  if (!note || note.trim() === "") {
    return `${TRANSCRIPTION_MARKER}\n${transcription}`;
  }
  return `${TRANSCRIPTION_MARKER}\n${transcription}\n${NOTE_MARKER}\n${note}`;
}

/**
 * Extract the transcription portion from a stored answer.
 *
 * @param answer - The stored answer string
 * @returns The transcription text (without markers) or null if invalid format
 */
export function extractTranscription(answer: string): string | null {
  if (!answer.startsWith(TRANSCRIPTION_MARKER)) {
    return null;
  }

  const withoutMarker = answer.slice(TRANSCRIPTION_MARKER.length).trimStart();
  const noteIndex = withoutMarker.indexOf(NOTE_MARKER);
  if (noteIndex === -1) {
    return withoutMarker;
  }
  return withoutMarker.slice(0, noteIndex).trimEnd();
}

/**
 * Extract the note portion from a stored answer.
 *
 * @param answer - The stored answer string
 * @returns The note text (without markers) or empty string if no note
 */
export function extractNote(answer: string): string {
  const noteIndex = answer.indexOf(NOTE_MARKER);
  if (noteIndex === -1) {
    return "";
  }
  return answer.slice(noteIndex + NOTE_MARKER.length).trim();
}
