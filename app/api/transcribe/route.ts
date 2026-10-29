import { NextResponse } from "next/server";

import { getQuestion } from "@/content";
import { resolveSession } from "@/lib/auth.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { getResult } from "@/lib/db/queries/results.server";
import { getConfig } from "@/lib/config.server";
import { checkIpRateLimit, checkUserRateLimit } from "@/lib/ratelimit.server";
import { verifyAttemptToken, attemptFieldsOf, signTranscriptionToken, TRANSCRIPTION_TTL_SECONDS } from "@/lib/tokens.server";
import { reserveAiSlot, refundAiSlot, type AiSlot } from "@/lib/usage.server";
import { withSingleFlight } from "@/lib/singleFlight";
import { buildVisionPrompt, validateImage, logTranscribeOutcome, formatAnswer } from "@/lib/transcribe.server";
import { chatCompletion } from "@/lib/openrouter.server";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 60; // seconds

const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers });

const bad = (error: string, status = 400) => json({ error }, status);

interface TranscribeSuccess {
  transcription: string;
  transcriptionHtml: string;
  transcriptionToken: string;
  note?: string;
  readCount: number;
  reservedSlot?: {
    userId: string;
    sydneyDate: string;
  };
}

/**
 * POST /api/transcribe
 *
 * Accept 1-3 photos of a handwritten answer, transcribe via vision model,
 * and return the transcription with a signed token for grading.
 */
export async function POST(req: Request) {
  const session = await resolveSession();
  if (session.kind === "none") {
    return bad("unauthenticated", 401);
  }
  const user = session.user;
  const userId = user.id;

  const startTime = Date.now();
  const model = process.env.VISION_MODEL || "deepseek/deepseek-v4.1-flash";

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    logTranscribeOutcome({ userId, questionId: "", outcome: "invalid-upload", durationMs: Date.now() - startTime, model });
    return bad("invalid_request");
  }

  const attemptId = formData.get("attemptId") as string | null;
  const attemptToken = formData.get("attemptToken") as string | null;
  const questionId = formData.get("questionId") as string | null;
  const note = formData.get("note") as string | null;
  const imageFiles = formData.getAll("images") as File[];

  // Validate required fields
  if (!attemptId || !attemptToken || !questionId || imageFiles.length === 0) {
    logTranscribeOutcome({ userId, questionId: questionId || "", outcome: "invalid-upload", durationMs: Date.now() - startTime, model });
    return bad("invalid_request");
  }

  // Validate note length
  if (note && note.length > 500) {
    logTranscribeOutcome({ userId, questionId, outcome: "invalid-upload", durationMs: Date.now() - startTime, model });
    return bad("invalid_note");
  }

  // Validate image count
  if (imageFiles.length > 3) {
    logTranscribeOutcome({ userId, questionId, outcome: "invalid-upload", durationMs: Date.now() - startTime, model });
    return bad("invalid_request");
  }

  // Verify attempt token
  const verified = verifyAttemptToken(attemptToken, { uid: userId, attemptId });
  if (!verified.ok) {
    logTranscribeOutcome({ userId, questionId, outcome: "invalid-upload", durationMs: Date.now() - startTime, model });
    return bad("invalid_attempt_token", 403);
  }

  const attempt = verified.payload;
  
  // Check question is in attempt
  const questionIds = attemptFieldsOf(attempt).questionIds;
  if (!questionIds.includes(questionId)) {
    logTranscribeOutcome({ userId, questionId, outcome: "invalid-upload", durationMs: Date.now() - startTime, model });
    return bad("not_found", 404);
  }

  // Check question exists and is short-answer
  const questionResult = getQuestion(questionId);
  if (!questionResult || questionResult.question.type !== "short") {
    logTranscribeOutcome({ userId, questionId, outcome: "invalid-upload", durationMs: Date.now() - startTime, model });
    return bad("not_found", 404);
  }
  const question = questionResult.question;

  // Check rate limits
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const ipResult = await checkIpRateLimit(ip);
  if (!ipResult.ok) {
    logTranscribeOutcome({ userId, questionId, outcome: "rate-limited", durationMs: Date.now() - startTime, model });
    return json({ error: "rate_limited" }, 429);
  }

  const userResult = await checkUserRateLimit(userId);
  if (!userResult.ok) {
    logTranscribeOutcome({ userId, questionId, outcome: "rate-limited", durationMs: Date.now() - startTime, model });
    return json({ error: "rate_limited" }, 429);
  }

  // Check if already answered (degraded mode safe)
  try {
    const existing = await dbCall((db) => getResult(db, userId, attemptId, questionId));
    if (existing) {
      logTranscribeOutcome({ userId, questionId, outcome: "already-answered", durationMs: Date.now() - startTime, model });
      return json({ error: "already_answered" }, 409);
    }
  } catch (error) {
    if (error instanceof DbUnavailableError) {
      // In degraded mode, we can't check - proceed but log
      console.warn("DB unavailable: cannot check if already answered");
    } else {
      throw error;
    }
  }

  // Validate images and convert to base64
  const imageUrls: string[] = [];
  for (const file of imageFiles) {
    // Check file size (1.5 MB limit)
    if (file.size > 1.5 * 1024 * 1024) {
      logTranscribeOutcome({ userId, questionId, outcome: "invalid-upload", durationMs: Date.now() - startTime, model });
      return bad("image_too_large");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = validateImage(buffer);
    if (!validation.ok) {
      logTranscribeOutcome({ userId, questionId, outcome: "invalid-upload", durationMs: Date.now() - startTime, model });
      return bad("invalid_image");
    }

    // Convert to base64 data URL
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";
    imageUrls.push(`data:${mimeType};base64,${base64}`);
  }

  // Reserve AI slot
  let slot: AiSlot | null = null;
  const config = getConfig();
  try {
    slot = await dbCall((db) => reserveAiSlot(db, userId, config.llmDailyCap));
    if (!slot) {
      logTranscribeOutcome({ userId, questionId, outcome: "over-cap", durationMs: Date.now() - startTime, model });
      return json({ error: "over_daily_cap" }, 429);
    }
  } catch (error) {
    if (error instanceof DbUnavailableError) {
      // In degraded mode, proceed without slot reservation
      console.warn("DB unavailable: proceeding without slot reservation");
    } else {
      logTranscribeOutcome({ userId, questionId, outcome: "db-unavailable", durationMs: Date.now() - startTime, model });
      return json({ error: "db_unavailable" }, 503);
    }
  }

  // Single-flight key to prevent double-tap
  const singleFlightKey = `transcribe:${userId}:${attemptId}:${questionId}`;

  let transcriptionResult: { transcription: string; legible: boolean; answersQuestion: boolean; notes: string };

  try {
    transcriptionResult = await withSingleFlight(singleFlightKey, async () => {
      // Build vision prompt
      const messages = buildVisionPrompt(question.prompt);

      // Add images to user message
      const userMessage = messages[1];
      if (userMessage && typeof userMessage.content !== "string") {
        for (const url of imageUrls) {
          userMessage.content.push({ type: "image_url", image_url: { url } });
        }
      }

      // Call vision model with timeout and retry
      const maxRetries = 1;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const result = await chatCompletion({
          model,
          messages,
          temperature: 0,
          maxTokens: 2000,
          timeoutMs: 25000, // 25s timeout
          json: true,
        });

        if (!result.ok) {
          lastError = new Error(`Vision call failed: ${result.reason}`);
          if (attempt < maxRetries) {
            console.warn(`Vision call attempt ${attempt + 1} failed: ${result.reason}, retrying...`);
            continue;
          }
          throw lastError;
        }

        // Parse JSON response
        const content = result.content.trim();
        let parsed: { transcription: string; legible: boolean; answersQuestion: boolean; notes: string };
        try {
          parsed = JSON.parse(content);
        } catch {
          // Try to extract JSON from markdown code block
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[1]);
          } else {
            throw new Error("Could not parse vision response as JSON");
          }
        }

        return parsed;
      }

      throw lastError || new Error("Vision call failed after retries");
    });
  } catch (error) {
    // Refund slot on failure
    if (slot) {
      await dbCall((db) => refundAiSlot(db, slot));
    }
    logTranscribeOutcome({ userId, questionId, outcome: "model-fail", durationMs: Date.now() - startTime, model });
    return json({ error: "model_fail" }, 500);
  }

  // Check if transcription is legible and answers the question
  if (!transcriptionResult.legible) {
    if (slot) await dbCall((db) => refundAiSlot(db, slot));
    logTranscribeOutcome({ userId, questionId, outcome: "illegible", durationMs: Date.now() - startTime, model });
    return json({ error: "illegible" }, 400);
  }

  if (!transcriptionResult.answersQuestion) {
    if (slot) await dbCall((db) => refundAiSlot(db, slot));
    logTranscribeOutcome({ userId, questionId, outcome: "not-answer", durationMs: Date.now() - startTime, model });
    return json({ error: "not_answer" }, 400);
  }

  // Calculate read count (this is the first read)
  const readCount = 1;

  // Create transcription hash for token
  const transcriptionHash = createHash("sha256")
    .update(transcriptionResult.transcription)
    .digest("hex");

  // Sign transcription token
  const tokenNowMs = Date.now();
  const transcriptionToken = signTranscriptionToken(
    {
      uid: userId,
      attemptId,
      questionId,
      transcriptionHash,
      readCount,
      reservedSlot: slot || null,
    },
    tokenNowMs,
  );

  // Format answer with markers
  const formattedAnswer = formatAnswer(transcriptionResult.transcription, note || undefined);

  // Convert LaTeX to KaTeX HTML for display
  const transcriptionHtml = formattedAnswer.replace(/\$([^\$]+)\$/g, "<span class=\"katex\">$1</span>");

  const response: TranscribeSuccess = {
    transcription: transcriptionResult.transcription,
    transcriptionHtml,
    transcriptionToken,
    note: note || undefined,
    readCount,
    reservedSlot: slot || undefined,
  };

  logTranscribeOutcome({ userId, questionId, outcome: "success", durationMs: Date.now() - startTime, model });

  return json(response);
}
