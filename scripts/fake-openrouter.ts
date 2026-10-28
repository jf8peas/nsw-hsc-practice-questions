/**
 * A local stand-in for OpenRouter, so the concept review flow can be driven by hand without a
 * real model (specs/002-learn-from-mistakes/quickstart.md).
 *
 *   FAKE_REVIEW=pass|fail|fail-once|down npx tsx scripts/fake-openrouter.ts
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

function handle(body: { model?: string; messages?: Array<{ role: string; content: unknown }> }) {
  const system = String(body.messages?.find((m) => m.role === "system")?.content ?? "");
  const userRaw = body.messages?.find((m) => m.role === "user")?.content;
  const user = typeof userRaw === "string" ? userRaw : JSON.stringify(userRaw);
  const task = /\[task: ([\w-]+)\]/.exec(system)?.[1] ?? "grading";
  const concept = lineOf(String(typeof userRaw === "string" ? userRaw : ""), "Concept:") || "(unknown)";
  console.log(`[fake] ${task} model=${body.model ?? "?"} concept="${concept}"`);

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
      res.writeHead(out.status, { "content-type": "application/json" }).end(out.body);
    } catch (error) {
      console.error("[fake] bad request", error);
      res.writeHead(400).end("bad request");
    }
  });
}).listen(PORT, () => {
  console.log(`[fake] OpenRouter stand-in on http://localhost:${PORT}/v1/chat/completions (reviews: ${MODE})`);
});
