// markComparative (spec 009 FR-013, FR-015, research R5/R6, task T017): the marker is given only the texts the
// student wrote about, the comparative prompt and nine verdicts; a different allowed pairing is judged like any
// other; nothing about the pairing but the model answer's text reaches it. Content and the model call are stubbed.

import { beforeEach, describe, expect, it, vi } from "vitest";

import { COMPARATIVE_SKILL_IDS } from "@/lib/unseen/skills";

const chat = vi.fn();
vi.mock("@/lib/openrouter.server", () => ({ chatCompletion: (p: unknown) => chat(p) }));

const CMP = "y12-english-advanced-comparative-texts";
const poem = (id: string, words: string) => ({
  id, form: "poem", heading: `Text ${id} – Poem`, title: `Title ${id}`, author: `Author ${id}`, sourceLine: "x",
  body: { kind: "poem", stanzas: [[words, `${words} again`]] }, hscChecked: "2026-11-19",
});
const image = { id: "t3", form: "visual", heading: "Text t3 – Image", title: "", author: "", sourceLine: "x", body: { kind: "image", image: "t3", alt: "A photograph" }, hscChecked: "2026-11-19" };
const texts = [poem("t1", "FIRST-POEM-WORDS"), poem("t2", "SECOND-POEM-WORDS"), image];

const choiceQ = {
  id: `${CMP}.q-choice`, type: "comparative", group: "comparative", prompt: "Compare how Text t1 and ONE other text explore loss.",
  maxMarks: 6, verb: "compare", suggestedWords: 216, suggestedFrom: "lines", textIds: ["t1", "t2", "t3"],
  choice: { fixed: ["t1"], from: ["t2", "t3"], pick: 1 }, concepts: [], outcome: "EAV-12-01", paper: {}, source: "S",
};
const fixedQ = { ...choiceQ, id: `${CMP}.q-fixed`, textIds: ["t1", "t2"], choice: null };
const key = {
  criteria: "6 – CRITERIA-LINE", notes: "NOTES-LINE", model: "MODEL-ANSWER-TEXT written about two other poems", pairing: ["t1", "t2"],
  modelOrigin: "school", criteriaOrigin: "school",
  visuals: { t3: { description: "DESCRIPTION-OF-THE-PICTURE: an empty chair by a window." } },
};

vi.mock("@/content", () => ({
  getQuestion: (id: string) => {
    const question = id.endsWith("q-choice") ? choiceQ : id.endsWith("q-fixed") ? fixedQ : null;
    return question ? { question, unit: { id: CMP, texts } } : null;
  },
  getUnit: () => ({ id: CMP, texts }),
}));
vi.mock("@/content/answers", () => ({ getAnswer: () => ({ rubric: [], comparative: key }) }));

const reply = (mark: number, over: Record<string, unknown> = {}) =>
  JSON.stringify({
    mark,
    skills: Object.fromEntries(COMPARATIVE_SKILL_IDS.map((id) => [id, { met: true, reason: `${id} shown` }])),
    feedback: "You compared the texts clearly.",
    biggestGap: mark === 6 ? null : "Compare more as you go.",
    goFurther: mark === 6 ? "End on what the two texts together suggest." : null,
    descriptionAdequate: null,
    ...over,
  });

async function mod() {
  return import("@/lib/grading.server");
}
const userContent = () => chat.mock.calls[0][0].messages[1].content as string;

beforeEach(() => {
  chat.mockReset();
  process.env.OPENROUTER_API_KEY = "k";
  chat.mockResolvedValue({ ok: true, content: reply(4), finishReason: "stop" });
});

describe("which texts reach the marker", () => {
  it("sends both texts of a fixed pair, in tab order, with the comparative prompt", async () => {
    const { markComparative } = await mod();
    const out = await markComparative(fixedQ.id, "My answer ".repeat(10), 1, undefined);
    expect(out?.promptVersion).toMatch(/^comparative-pilot-/);
    const sent = userContent();
    expect(sent).toContain("FIRST-POEM-WORDS");
    expect(sent).toContain("SECOND-POEM-WORDS");
    expect(sent.indexOf("FIRST-POEM-WORDS")).toBeLessThan(sent.indexOf("SECOND-POEM-WORDS"));
    expect(sent).not.toContain("DESCRIPTION-OF-THE-PICTURE");
    expect(sent).toContain("DIRECTIVE VERB: compare = Show how things are similar or different.");
    expect(chat.mock.calls[0][0].messages[0].content).toContain("compares-texts");
  });

  it("sends only the fixed text and the picked one on a choice question: an unpicked allowed text never leaves the server", async () => {
    const { markComparative } = await mod();
    await markComparative(choiceQ.id, "My answer ".repeat(10), 1, ["t2"]);
    const all = JSON.stringify(chat.mock.calls[0][0].messages);
    expect(all).toContain("FIRST-POEM-WORDS");
    expect(all).toContain("SECOND-POEM-WORDS");
    expect(all).not.toContain("DESCRIPTION-OF-THE-PICTURE");
    expect(all).not.toContain("Text t3 – Image");
  });

  it("sends a picked visual as its written description, flagged, and not the poem it was not paired with", async () => {
    const { markComparative } = await mod();
    await markComparative(choiceQ.id, "My answer ".repeat(10), 1, ["t3"]);
    const all = JSON.stringify(chat.mock.calls[0][0].messages);
    expect(all).toContain("DESCRIPTION-OF-THE-PICTURE");
    expect(all).toContain("VISUAL TEXT: you cannot see the image");
    expect(all).not.toContain("SECOND-POEM-WORDS");
  });

  it("tells the marker nothing about the pairing but the model answer's text", async () => {
    const { markComparative } = await mod();
    await markComparative(choiceQ.id, "My answer ".repeat(10), 1, ["t3"]);
    const sent = userContent();
    expect(sent).toContain("MODEL-ANSWER-TEXT");
    expect(sent).not.toMatch(/pairing/i);
  });

  it("refuses to mark with a missing, incomplete or disallowed pick (the handler validates first; this is the last line)", async () => {
    const { markComparative } = await mod();
    for (const pick of [undefined, [], ["t2", "t3"], ["t1"], ["nope"]]) {
      expect(await markComparative(choiceQ.id, "x ".repeat(30), 1, pick as string[] | undefined)).toBeNull();
    }
    expect(chat).not.toHaveBeenCalled();
  });
});

describe("the model call", () => {
  it("asks for the comparative marker's larger max_tokens, not spec 008's 4000", async () => {
    const { markComparative } = await mod();
    const { COMPARATIVE_MAX_TOKENS } = await import("@/lib/comparative/rubric");
    await markComparative(fixedQ.id, "My answer ".repeat(10), 1, undefined);
    expect(chat.mock.calls[0][0].maxTokens).toBe(COMPARATIVE_MAX_TOKENS);
    expect(COMPARATIVE_MAX_TOKENS).toBeGreaterThan(4000);
  });
});

describe("the marks", () => {
  it("returns nine verdicts and the first try's mark and go-further sentence at full marks", async () => {
    chat.mockResolvedValue({ ok: true, content: reply(6), finishReason: "stop" });
    const { markComparative } = await mod();
    const out = await markComparative(fixedQ.id, "x ".repeat(30), 1, undefined);
    expect(Object.keys(out!.verdicts)).toEqual([...COMPARATIVE_SKILL_IDS]);
    expect(out!.mark).toBe(6);
    expect(out!.goFurther).toContain("End on");
  });

  it("caps the retry one mark below full marks and gives no go-further sentence", async () => {
    chat.mockResolvedValue({ ok: true, content: reply(6), finishReason: "stop" });
    const { markComparative } = await mod();
    const out = await markComparative(fixedQ.id, "x ".repeat(30), 2, undefined);
    expect(out!.mark).toBe(5);
    expect(out!.goFurther).toBeNull();
  });

  it("is unavailable when the marker is (no key) and never marks without a picture's description", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const { markComparative } = await mod();
    expect(await markComparative(fixedQ.id, "x ".repeat(30), 1, undefined)).toBeNull();
  });
});
