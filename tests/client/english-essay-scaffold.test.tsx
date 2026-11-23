// @vitest-environment jsdom
//
// The English essay's plan screen (spec 011 FR-004 to FR-008): a thesis and three optional claim/evidence pairs with
// placeholders (no labelled sub-boxes, no conclusion), the 150-word cap and thesis rule on the one S1 action, the server's
// saved plan winning over this tab's mirror, the directive highlighted as a whole phrase, and 44 px actions. Components only.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DirectiveQuestionBlock } from "@/components/english-essay/DirectiveQuestionBlock";
import { Scaffold } from "@/components/english-essay/Scaffold";
import { saveEnglishEssayScaffoldDraft } from "@/lib/drafts";
import { emptyEnglishEssayScaffold } from "@/lib/english-essay/scaffold";
import type { EnglishEssayScaffold, PublicEnglishEssay } from "@/lib/english-essay/types";

const essay = (over: Partial<PublicEnglishEssay> = {}): PublicEnglishEssay => ({
  type: "englishEssay",
  group: "englishEssay",
  maxMarks: 20,
  live: true,
  id: "y12-english-essay-writing.e3",
  prompt: "Discuss how the composer of your prescribed text makes connections between the audience and the complex lives of others within the play.",
  directive: "discuss",
  directiveDefinition: "identify issues and provide points for and/or against.",
  directiveGuidance: "nesa",
  offer: 3,
  source: "Abbotsleigh 2025 Trial, Q6",
  conceptIds: [],
  ...over,
});

const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");
const plan = (thesis: string, claim = ""): EnglishEssayScaffold => {
  const s = emptyEnglishEssayScaffold();
  s.thesis = thesis;
  s.body[0].claim = claim;
  return s;
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ saved: true, words: 1 }), { status: 200 })));
  window.sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const renderScaffold = (initial: EnglishEssayScaffold, e = essay(), onStarted = vi.fn()) =>
  render(<Scaffold attemptId="a1" attemptToken="t" essay={e} initial={initial} onStarted={onStarted} />);
const start = () => screen.getByRole("button", { name: /Start writing/ }) as HTMLButtonElement;

describe("the plan screen", () => {
  it("shows a thesis box and three claim and evidence pairs with placeholders, and no conclusion", () => {
    const { container } = renderScaffold(emptyEnglishEssayScaffold());
    expect(container.querySelectorAll("textarea")).toHaveLength(7);
    expect(screen.getByPlaceholderText(/One or two sentences answering this question and taking a position/)).toBeTruthy();
    expect(screen.getAllByPlaceholderText(/One idea about human experience that builds your thesis/)).toHaveLength(3);
    expect(screen.getAllByPlaceholderText(/Optional: quotations, scenes, stage directions/)).toHaveLength(3);
    expect(screen.queryByText(/conclusion/i)).toBeNull();
    expect(screen.getByText("0 / 150 words")).toBeTruthy();
    expect(screen.getByText(/Abbotsleigh 2025 Trial, Q6/)).toBeTruthy();
  });

  it("offers only Start writing in S1 (no review action)", () => {
    renderScaffold(plan("A thesis"));
    expect(screen.queryByRole("button", { name: /feedback/i })).toBeNull();
    expect(start().disabled).toBe(false);
  });

  it("is disabled at 151 words and enabled at 150 with a thesis", () => {
    renderScaffold(plan("A thesis", words(148)));
    expect(screen.getByText("150 / 150 words")).toBeTruthy();
    expect(start().disabled).toBe(false);
    cleanup();
    renderScaffold(plan("A thesis", words(149)));
    expect(screen.getByText("151 / 150 words, cut 1 word")).toBeTruthy();
    expect(start().disabled).toBe(true);
  });

  it("is disabled for an empty or whitespace thesis whatever else is filled, and every other field may stay empty", () => {
    renderScaffold(plan("   ", "a claim"));
    expect(start().disabled).toBe(true);
    cleanup();
    renderScaffold(plan("Only a thesis"));
    expect(start().disabled).toBe(false);
  });

  it("updates the counter and enables the action as the student types", () => {
    renderScaffold(emptyEnglishEssayScaffold());
    expect(start().disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Thesis"), { target: { value: "My position on the play" } });
    expect(screen.getByText("5 / 150 words")).toBeTruthy();
    expect(start().disabled).toBe(false);
  });

  it("locks and moves on when Start writing succeeds, and stays put with the plan when it fails", async () => {
    const onStarted = vi.fn();
    renderScaffold(plan("A thesis"), essay(), onStarted);
    fireEvent.click(start());
    await vi.waitFor(() => expect(onStarted).toHaveBeenCalledTimes(1));
    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find((c) => JSON.parse(c[1].body).action === "start");
    expect(call![0]).toBe("/api/english-essay/scaffold");
    expect(JSON.parse(call![1].body)).toMatchObject({ attemptId: "a1", attemptToken: "t", questionId: "y12-english-essay-writing.e3", action: "start" });

    cleanup();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "scaffold_invalid", reasons: ["no_thesis"] }), { status: 400 })));
    const again = vi.fn();
    renderScaffold(plan("A thesis"), essay(), again);
    fireEvent.click(start());
    await screen.findByRole("alert");
    expect(again).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Thesis") as HTMLTextAreaElement).value).toBe("A thesis");
  });
});

describe("resume", () => {
  it("the server's saved plan wins over this tab's mirror", () => {
    saveEnglishEssayScaffoldDraft("a1", plan("Mirror thesis"));
    renderScaffold(plan("Server thesis"));
    expect((screen.getByLabelText("Thesis") as HTMLTextAreaElement).value).toBe("Server thesis");
  });

  it("this tab's mirror fills in only when the server has nothing yet", () => {
    saveEnglishEssayScaffoldDraft("a1", plan("Mirror thesis"));
    renderScaffold(emptyEnglishEssayScaffold());
    expect((screen.getByLabelText("Thesis") as HTMLTextAreaElement).value).toBe("Mirror thesis");
  });

  it("a restored over-cap draft stays disabled", () => {
    renderScaffold(plan("A thesis", words(200)));
    expect(start().disabled).toBe(true);
  });
});

describe("the directive highlight", () => {
  const marked = (e: PublicEnglishEssay) => {
    const { container } = render(<DirectiveQuestionBlock essay={e} />);
    return container.querySelector("mark")?.textContent ?? null;
  };

  it("highlights the whole stored phrase", () => {
    expect(marked(essay())).toBe("Discuss");
    cleanup();
    expect(
      marked(
        essay({
          prompt: "'Texts illuminate the anomalies.' To what extent does this statement align with your understanding?",
          directive: "to what extent",
          directiveDefinition: "Make a judgement about how far the statement holds.",
          directiveGuidance: "unit",
        }),
      ),
    ).toBe("To what extent");
  });

  it("does not highlight 'how' inside 'show' or 'however', and labels unit guidance", () => {
    cleanup();
    const e = essay({
      prompt: "However the text may show it, how does the writer shape meaning?",
      directive: "how",
      directiveDefinition: "Explain and analyse the ways the text achieves the effect named.",
      directiveGuidance: "unit",
    });
    const { container } = render(<DirectiveQuestionBlock essay={e} />);
    const hit = container.querySelector("mark")!;
    expect(hit.textContent).toBe("how");
    expect(container.querySelector(".pg-question-text")!.textContent).toBe("“However the text may show it, how does the writer shape meaning?”");
    expect(screen.getByText(/Unit guidance, not a NESA glossary definition/)).toBeTruthy();
  });

  it("shows no unit label for a NESA glossary directive", () => {
    cleanup();
    render(<DirectiveQuestionBlock essay={essay()} />);
    expect(screen.queryByText(/Unit guidance/)).toBeNull();
    expect(screen.getByText(/identify issues and provide points/)).toBeTruthy();
  });
});
