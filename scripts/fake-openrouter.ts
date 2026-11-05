/**
 * A local stand-in for OpenRouter, so the concept review flow can be driven by hand without a
 * real model (specs/002-learn-from-mistakes/quickstart.md).
 *
 *   FAKE_REVIEW=pass|fail|fail-once|down npx tsx scripts/fake-openrouter.ts
 *   FAKE_VISION=pass|fail|illegible|not-answer npx tsx scripts/fake-openrouter.ts
 *   FAKE_PARAGRAPH=pass|partial|fail|malformed|down|slow npx tsx scripts/fake-openrouter.ts
 *
 * then in .env.local:
 *   OPENROUTER_API_KEY=local-test
 *   OPENROUTER_BASE_URL=http://localhost:4010/v1/chat/completions   (ignored in production)
 *
 *   pass       every review passes
 *   fail       every review fails (so an item fails twice and is flagged)
 *   fail-once  the first review of each concept fails, later ones pass (fail, regenerate, pass)
 *   down       every review request answers HTTP 503 (the reviewer is unavailable)
 *
 *   FAKE_VISION:
 *   pass       vision requests transcribe successfully (legible, answers the question)
 *   fail       every vision request answers HTTP 500 (the model is unavailable)
 *   illegible  the transcription is unreadable (legible: false)
 *   not-answer the photo is not an answer to the question (answersQuestion: false)
 *
 *   FAKE_PARAGRAPH (spec 007, the paragraph marker). A directive in the student's text,
 *   [met:abd], chooses the verdicts: a, b, c are the part's criteria and d is the conventions
 *   (precise language and no padding); a letter missing from the directive is NOT met.
 *   pass       no directive means all four met; with a directive it is obeyed
 *   partial    no directive means a and d met, b and c not met; with a directive it is obeyed
 *   fail       every request answers HTTP 500
 *   down       every request answers HTTP 503
 *   malformed  every reply is prose, not JSON (the app retries once, then the marker is unavailable)
 *   slow       as pass, but each reply takes 12 seconds (to watch the marking status steps)
 *
 * Generators always answer. Each request is logged with its purpose and model. Development
 * tool only: it is never imported by the app.
 */
import { createServer } from "node:http";

const PORT = Number(process.env.FAKE_PORT ?? 4010);
const MODE = (process.env.FAKE_REVIEW ?? "pass") as "pass" | "fail" | "fail-once" | "down";
if (!["pass", "fail", "fail-once", "down"].includes(MODE)) {
  console.error(`FAKE_REVIEW must be pass, fail, fail-once or down (got "${MODE}")`);
  process.exit(1);
}
const VISION_MODE = (process.env.FAKE_VISION ?? "pass") as "pass" | "fail" | "illegible" | "not-answer";
if (!["pass", "fail", "illegible", "not-answer"].includes(VISION_MODE)) {
  console.error(`FAKE_VISION must be pass, fail, illegible or not-answer (got "${VISION_MODE}")`);
  process.exit(1);
}
const REWRITE_MODE = (process.env.FAKE_REWRITE ?? "pass") as "pass" | "partial" | "fail" | "down";
if (!["pass", "partial", "fail", "down"].includes(REWRITE_MODE)) {
  console.error(`FAKE_REWRITE must be pass, partial, fail or down (got "${REWRITE_MODE}")`);
  process.exit(1);
}

const PARAGRAPH_MODE = (process.env.FAKE_PARAGRAPH ?? "pass") as "pass" | "partial" | "fail" | "malformed" | "down" | "slow";
if (!["pass", "partial", "fail", "malformed", "down", "slow"].includes(PARAGRAPH_MODE)) {
  console.error(`FAKE_PARAGRAPH must be pass, partial, fail, malformed, down or slow (got "${PARAGRAPH_MODE}")`);
  process.exit(1);
}

const seenReviews = new Set<string>();

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">' +
  '<line x1="60" y1="340" x2="600" y2="340" stroke="black" stroke-width="2"/>' +
  '<line x1="60" y1="340" x2="60" y2="40" stroke="black" stroke-width="2"/>' +
  '<text x="300" y="385" font-size="16">Quantity</text><text x="8" y="30" font-size="16">Price</text>' +
  '<line x1="80" y1="320" x2="560" y2="80" stroke="blue" stroke-width="3"/><text x="520" y="70" font-size="16" fill="blue">S</text>' +
  '<line x1="80" y1="80" x2="560" y2="320" stroke="red" stroke-width="3"/><text x="520" y="330" font-size="16" fill="red">D</text>' +
  "</svg>";

function lineOf(text: string, label: string): string {
  return text.split("\n").find((l) => l.startsWith(label))?.slice(label.length).trim() ?? "";
}

function reply(content: string, status = 200) {
  return { status, body: JSON.stringify({ choices: [{ message: { content } }] }) };
}

/** The paragraph marker's reply (spec 007): verdicts from a [met:...] directive in the student's text. */
function paragraphReply(user: string) {
  const answer = /Student's [^\n]+:\n"""\n([\s\S]*?)\n"""/.exec(user)?.[1] ?? "";
  const directive = /\[met:([abcd]*)\]/.exec(answer)?.[1];
  const met = (k: string) =>
    directive !== undefined ? directive.includes(k) : PARAGRAPH_MODE === "partial" ? k === "a" || k === "d" : true;
  return reply(
    JSON.stringify({
      restated: "Fake restated text.",
      criteria: {
        a: { reason: met("a") ? "Fake: criterion a is met." : "Fake: criterion a is not met.", met: met("a") },
        b: { reason: met("b") ? "Fake: criterion b is met." : "Fake: criterion b is not met.", met: met("b") },
        c: { reason: met("c") ? "Fake: criterion c is met." : "Fake: criterion c is not met.", met: met("c") },
      },
      conventions: { reason: met("d") ? "Fake: formal and concise." : "Fake: informal wording.", preciseLanguage: met("d"), noPadding: met("d") },
      feedback: "Fake paragraph marker: keep tying each point back to the question.",
    }),
  );
}

function handle(body: { model?: string; messages?: Array<{ role: string; content: unknown }> }) {
  const system = String(body.messages?.find((m) => m.role === "system")?.content ?? "");
  const userRaw = body.messages?.find((m) => m.role === "user")?.content;
  const user = typeof userRaw === "string" ? userRaw : JSON.stringify(userRaw);
  const task = /\[task: ([\w-]+)\]/.exec(system)?.[1] ?? "grading";
  const concept = lineOf(String(typeof userRaw === "string" ? userRaw : ""), "Concept:") || "(unknown)";
  console.log(`[fake] ${task} model=${body.model ?? "?"} concept="${concept}"`);

  // Vision (photo transcription): the user message carries image_url parts.
  const isVision =
    Array.isArray(userRaw) && userRaw.some((c) => c && typeof c === "object" && "image_url" in c);
  if (isVision) {
    if (VISION_MODE === "fail") return reply("", 500);
    if (VISION_MODE === "illegible") {
      return reply(
        JSON.stringify({ transcription: "", legible: false, answersQuestion: true, notes: "too blurry to read" }),
      );
    }
    if (VISION_MODE === "not-answer") {
      return reply(
        JSON.stringify({ transcription: "", legible: true, answersQuestion: false, notes: "not an answer to the question" }),
      );
    }
    return reply(
      JSON.stringify({ transcription: "F = ma", legible: true, answersQuestion: true, notes: "" }),
    );
  }

  // Paragraph marking (spec 007): the system prompt starts "You are marking one part of a body paragraph".
  if (/one part of a body paragraph/.test(system)) {
    if (PARAGRAPH_MODE === "fail") return reply("", 500);
    if (PARAGRAPH_MODE === "down") return reply("", 503);
    if (PARAGRAPH_MODE === "malformed") return reply("I am sorry, I cannot give JSON today.");
    return paragraphReply(user);
  }

  // Rewrite grading (spec 005, extended by spec 006): the system prompt names "sentence-writing".
  const isRewrite = /sentence-writing/.test(system);
  if (isRewrite) {
    if (REWRITE_MODE === "fail") return reply("", 500);
    if (REWRITE_MODE === "down") return reply("", 503);
    const terms = [...user.matchAll(/^\d+\. ([^—]+) —/gm)].map((m) => m[1].trim());
    const answer = /Student's sentence:\n"""\n([\s\S]*?)\n"""/.exec(user)?.[1] ?? "";
    const statuses = terms.map((t, i) => {
      const status = REWRITE_MODE === "partial" && i === 0 ? "missing" : "used";
      // spec 006: a credited span is the exact words in the answer, or null for a non-credited term.
      const span = status === "used" && answer.toLowerCase().includes(t.toLowerCase()) ? t : null;
      return { term: t, status, span };
    });
    // spec 006: a deterministic language note when the answer contains the mockup's typo.
    const languageNote = answer.includes("fromm")
      ? { spelling: [{ wrong: "fromm", fix: "from" }] }
      : undefined;
    return reply(
      JSON.stringify({
        criterionA: true,
        padding: false,
        terms: statuses,
        feedback: "Fake rewrite grader: well done.",
        ...(languageNote ? { languageNote } : {}),
      }),
    );
  }

  if (task === "concept-summary") {
    const wantsPicture = /diagram|graph|curve|model/i.test(concept);
    return reply(
      JSON.stringify({
        bullets: [
          `${concept}: the core idea, stated in general terms.`,
          "A second point that helps a student relearn it.",
          "A third point to remember for the exam.",
        ],
        illustration: wantsPicture
          ? { brief: "A labelled supply and demand diagram.", alt: "A graph with price on the vertical axis and quantity on the horizontal axis, and crossing supply and demand curves." }
          : null,
      }),
    );
  }
  if (task === "concept-illustration") return reply(SVG);

  if (task === "concept-summary-review" || task === "concept-illustration-review") {
    if (MODE === "down") return reply("", 503);
    const key = `${task}:${concept}`;
    const first = !seenReviews.has(key);
    seenReviews.add(key);
    const pass = MODE === "pass" || (MODE === "fail-once" && !first);
    const names =
      task === "concept-summary-review"
        ? ["matches_concept", "accurate", "no_answer_leak", "general_not_question_specific"]
        : ["matches_concept", "labels_correct", "axes_correct", "shapes_correct", "no_answer_leak"];
    const checks = Object.fromEntries(names.map((n) => [n, pass || (n !== "accurate" && n !== "axes_correct")]));
    return reply(JSON.stringify({ checks, reason: pass ? "" : "Fake reviewer: this was marked as failing on purpose." }));
  }

  // anything else (short-answer grading): full marks
  void user;
  return reply(JSON.stringify({ marksAwarded: 1, feedback: "Fake grader: well done.", rubricHits: ["a point"], rubricMisses: [] }));
}

createServer((req, res) => {
  if (req.method !== "POST" || !req.url?.endsWith("/chat/completions")) {
    res.writeHead(404).end("not found");
    return;
  }
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    try {
      const out = handle(JSON.parse(raw));
      const delay = PARAGRAPH_MODE === "slow" && /one part of a body paragraph/.test(raw) ? 12_000 : 0;
      setTimeout(() => res.writeHead(out.status, { "content-type": "application/json" }).end(out.body), delay);
    } catch (error) {
      console.error("[fake] bad request", error);
      res.writeHead(400).end("bad request");
    }
  });
}).listen(PORT, () => {
  console.log(`[fake] OpenRouter stand-in on http://localhost:${PORT}/v1/chat/completions (reviews: ${MODE})`);
});
