import "server-only";

// Short-answer grading via OpenRouter. Configured with OPENROUTER_API_KEY and
// (optionally) GRADING_MODEL. If the key is absent, gradeShortAnswer returns
// null and the caller falls back to student self-marking.

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-chat";
const TIMEOUT_MS = 20_000;

export function llmGradingConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export interface ShortGrade {
  marksAwarded: number;
  feedback: string;
  rubricHits: string[];
  rubricMisses: string[];
  gradedBy: string;
}

interface GradeParams {
  formula?: string;
  prompt: string;
  modelAnswer: string;
  rubric: string[];
  maxMarks: number;
  answer: string;
}

function clampMarks(v: unknown, max: number): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, 0), max);
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/** Pull the first {...} block out of a model response and parse it. */
function parseGradeJson(content: string, maxMarks: number): Omit<ShortGrade, "gradedBy"> | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(content.slice(start, end + 1));
  } catch {
    return null;
  }
  const feedback = typeof obj.feedback === "string" ? obj.feedback.trim() : "";
  if (!feedback) return null;
  return {
    marksAwarded: clampMarks(obj.marksAwarded, maxMarks),
    feedback,
    rubricHits: asStringArray(obj.rubricHits),
    rubricMisses: asStringArray(obj.rubricMisses),
  };
}

function buildMessages(p: GradeParams) {
  const system =
    `You are marking a NSW HSC Year 11 Physics short-answer question against a rubric. ` +
    `Award a whole number of marks from 0 to ${p.maxMarks}: one mark for each rubric point the student's answer clearly satisfies. ` +
    `Accept equivalent wording, and common SI unit forms (e.g. "m/s^2", "m s^-2" and "metres per second squared" are all fine; "kg m/s" and "N s" are both fine for momentum; "V/m" and "N/C" are both fine for electric field). ` +
    `A dimensionless quantity such as refractive index correctly has no unit. ` +
    `Do not award marks for correct physics that the question did not ask for. ` +
    `Respond with JSON only, no prose outside it.`;

  const user =
    `Formula: ${p.formula ?? "(none)"}\n` +
    `Question: ${p.prompt}\n\n` +
    `Rubric (1 mark each, ${p.maxMarks} available):\n` +
    p.rubric.map((r, i) => `${i + 1}. ${r}`).join("\n") +
    `\n\nModel answer: ${p.modelAnswer}\n\n` +
    `Student's answer:\n"""\n${p.answer}\n"""\n\n` +
    `Reply with exactly this shape:\n` +
    `{"marksAwarded": <integer 0-${p.maxMarks}>, "feedback": "<1-2 sentences to the student>", ` +
    `"rubricHits": ["<rubric points satisfied>"], "rubricMisses": ["<rubric points missed>"]}`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export async function gradeShortAnswer(p: GradeParams): Promise<ShortGrade | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    console.warn("[grade] OPENROUTER_API_KEY not set — short answer falls back to self-marking");
    return null;
  }
  const model = process.env.GRADING_MODEL || DEFAULT_MODEL;

  const body = JSON.stringify({
    model,
    messages: buildMessages(p),
    temperature: 0,
    max_tokens: 500,
    response_format: { type: "json_object" },
  });

  async function attempt(): Promise<Omit<ShortGrade, "gradedBy"> | null> {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "https://physics-practice.vercel.app",
        "X-Title": "Physics Practice",
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[grade] OpenRouter ${res.status} (model ${model}): ${detail.slice(0, 300)}`);
      return null;
    }
    const data = await res.json();
    const content: unknown = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      console.error(`[grade] OpenRouter response had no message content: ${JSON.stringify(data).slice(0, 300)}`);
      return null;
    }
    const parsed = parseGradeJson(content, p.maxMarks);
    if (!parsed) console.error(`[grade] could not parse grader JSON: ${content.slice(0, 300)}`);
    return parsed;
  }

  let out = await attempt().catch((e) => {
    console.error(`[grade] OpenRouter call threw: ${e}`);
    return null;
  });
  if (!out) {
    out = await attempt().catch((e) => {
      console.error(`[grade] OpenRouter retry threw: ${e}`);
      return null;
    });
  }
  if (!out) return null;

  console.info(`[grade] ${model} → ${out.marksAwarded}/${p.maxMarks}`);
  return { ...out, gradedBy: model };
}
