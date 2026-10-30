// Shared answer-format helpers for photo answers (specs/004-photo-answers).
//
// This module is deliberately NOT server-only: the client needs `formatAnswer`
// to build the stored answer string when accepting a read-back, while the
// server uses the same helpers to verify it. The markers are the contract
// between /api/transcribe, /api/grade and the stored `results.answer` text.

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