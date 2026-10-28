import "server-only";

import { chatCompletion, type ChatMessage, type ChatResult } from "@/lib/openrouter.server";
import type { CallFailed, ConceptLlmPort } from "@/lib/concepts/port";
import {
  ILLUSTRATION_CHECKS,
  SUMMARY_CHECKS,
  illustrationMessages,
  illustrationReviewMessages,
  parseSummary,
  parseVerdict,
  summaryMessages,
  summaryReviewMessages,
} from "@/lib/concepts/prompts";
import { checkSvg, renderPng } from "@/lib/concepts/svg.server";

// The real model port: prompts and parsing from prompts.ts, requests through chatCompletion.
// Nothing here is sent to or readable from a browser. See contracts/llm.md.

const GENERATE_TIMEOUT_MS = 20_000;
const REVIEW_TIMEOUT_MS = 25_000;
const ILLUSTRATION_TIMEOUT_MS = 60_000;

/**
 * True when two model names are the same model, ignoring case and a trailing `:variant`
 * (so `vendor/model:online` is the same as `vendor/model`). Used to refuse a reviewer that is
 * the generator (FR-024).
 */
export function sameModel(a: string, b: string): boolean {
  const norm = (s: string) => {
    const n = s.trim().toLowerCase();
    const colon = n.lastIndexOf(":");
    return colon > n.indexOf("/") && colon > 0 ? n.slice(0, colon) : n;
  };
  return norm(a) === norm(b);
}

function failed(r: Extract<ChatResult, { ok: false }>): CallFailed {
  const status = r.status ? ` ${r.status}` : "";
  return { ok: false, kind: "call_failed", reason: `${r.reason}${status}` };
}

const asChat = (messages: Array<{ role: "system" | "user"; content: string }>): ChatMessage[] => messages;

export function createConceptLlmPort(): ConceptLlmPort {
  return {
    async generateSummary(input) {
      const r = await chatCompletion({
        model: input.model,
        messages: asChat(summaryMessages(input)),
        // the automatic regeneration runs hotter, so it does not repeat the failed version
        temperature: input.attemptNo === 1 ? 0.4 : 0.7,
        maxTokens: 700,
        timeoutMs: GENERATE_TIMEOUT_MS,
        json: true,
      });
      if (!r.ok) return failed(r);
      return parseSummary(r.content);
    },

    async reviewSummary(input) {
      const r = await chatCompletion({
        model: input.model,
        messages: asChat(summaryReviewMessages(input)),
        temperature: 0,
        maxTokens: 500,
        timeoutMs: REVIEW_TIMEOUT_MS,
        json: true,
      });
      if (!r.ok) return failed(r);
      const parsed = parseVerdict(r.content, SUMMARY_CHECKS);
      return parsed.ok ? { ok: true, verdict: parsed.verdict } : { ok: false, kind: "call_failed", reason: parsed.reason };
    },

    async generateIllustration(input) {
      const r = await chatCompletion({
        model: input.model,
        messages: asChat(illustrationMessages(input)),
        temperature: input.attemptNo === 1 ? 0.4 : 0.7,
        maxTokens: 3000,
        timeoutMs: ILLUSTRATION_TIMEOUT_MS,
      });
      if (!r.ok) return failed(r);
      const checked = checkSvg(r.content);
      return checked.ok
        ? { ok: true, svg: checked.svg }
        : { ok: false, kind: "content_rejected", reason: `SVG rejected: ${checked.reason}` };
    },

    async reviewIllustration(input) {
      let png: Buffer;
      try {
        png = await renderPng(input.svg);
      } catch (error) {
        // no picture, no review: the item stays pending rather than being approved unseen
        return { ok: false, kind: "call_failed", reason: `could not render the picture: ${String(error).slice(0, 100)}` };
      }
      const [system, user] = illustrationReviewMessages(input);
      const messages: ChatMessage[] = [
        { role: system.role, content: system.content },
        {
          role: user.role,
          content: [
            { type: "text", text: user.content },
            { type: "image_url", image_url: { url: `data:image/png;base64,${png.toString("base64")}` } },
          ],
        },
      ];
      const r = await chatCompletion({
        model: input.model,
        messages,
        temperature: 0,
        maxTokens: 500,
        timeoutMs: REVIEW_TIMEOUT_MS * 2,
        json: true,
      });
      if (!r.ok) return failed(r);
      const parsed = parseVerdict(r.content, ILLUSTRATION_CHECKS);
      return parsed.ok ? { ok: true, verdict: parsed.verdict } : { ok: false, kind: "call_failed", reason: parsed.reason };
    },
  };
}
