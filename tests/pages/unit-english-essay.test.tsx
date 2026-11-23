// The English essay unit page (spec 011 FR-001 to FR-005, contracts/api.md A): the live essays in offer order with their
// school-trial sources, the latest FINAL mark and band, Redo replacing the display, the first unanswered as "Next up", the open
// attempt with its token for Discard, the unreadable-database notice with no guessed list, and no key field anywhere.

import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UnitEssays } from "@/components/english-essay/UnitEssays";
import type { EnglishEssayUnitData } from "@/lib/english-essay/progress.server";

import {
  E1,
  E2,
  E3,
  ENGLISH_UNIT,
  essayOfWords,
  gradeEnglish,
  mockEnglishContent,
  restoreEnglishEnv,
  setupEnglishEnv,
  startEnglish,
  startEnglishToWriting,
  type EnglishEnv,
} from "../helpers/english-essay";
import { signedInStudent } from "../helpers/routes";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh: () => {}, push: vi.fn() }),
  usePathname: () => "/",
}));

let env: EnglishEnv;
afterEach(async () => {
  restoreEnglishEnv();
  vi.restoreAllMocks();
  await env?.close();
});

function findAll(node: ReactNode, match: (el: ReactElement) => boolean, out: ReactElement[] = []) {
  if (Array.isArray(node)) node.forEach((n) => findAll(n, match, out));
  else if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    if (match(el)) out.push(el);
    findAll(el.props.children, match, out);
  }
  return out;
}
const named = (name: string) => (el: ReactElement) => typeof el.type === "function" && (el.type as { name?: string }).name === name;

async function page() {
  const Page = (await import("@/app/unit/[unitId]/page")).default;
  return Page({ params: Promise.resolve({ unitId: ENGLISH_UNIT }) });
}
async function data(): Promise<Pick<EnglishEssayUnitData, "essays" | "openAttempt" | "gapDetails">> {
  const els = findAll(await page(), named("UnitEssays"));
  expect(els).toHaveLength(1);
  return (els[0]!.props as { data: EnglishEssayUnitData }).data;
}

describe("the list", () => {
  it("shows only live essays, in offer order, with the exact trial sources and no key field", async () => {
    env = await setupEnglishEnv();
    mockEnglishContent([E3, E1]); // e2 is not live
    await signedInStudent(env);
    const d = await data();
    expect(d.essays.map((e) => e.question.id)).toEqual([E1, E3]);
    expect(d.essays.map((e) => e.question.source)).toEqual(["Knox 2025 Trial, Q6", "Abbotsleigh 2025 Trial, Q6"]);
    expect(d.essays[0]!.nextUp).toBe(true);
    expect(d.essays[1]!.nextUp).toBe(false);
    expect(d.openAttempt).toBeNull();
    const s = JSON.stringify(d);
    for (const secret of ["ENOTES-TOKEN", "EMODELESSAYTOKEN", "conceptTags", "markingNotes"]) expect(s).not.toContain(secret);
  });

  it("shows the latest FINAL mark and band, and a redo replaces it", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting(E1);
    await gradeEnglish(a, E1, essayOfWords(900, "[band:1]", "[mark:19]", "[focus:partly]"));
    let d = await data();
    expect(d.essays[0]!.latest).toMatchObject({ mark: 12, band: 3, attemptId: a.attemptId });
    expect(d.essays[0]!.nextUp).toBe(false);
    expect(d.essays[1]!.nextUp).toBe(true); // the first unanswered

    const redo = await startEnglishToWriting(E1);
    await gradeEnglish(redo, E1, essayOfWords(900, "[band:2]", "[mark:15]"));
    d = await data();
    expect(d.essays[0]!.latest).toMatchObject({ mark: 15, band: 2, attemptId: redo.attemptId });
  });

  it("marks the open essay, gives the page a signed token for Discard and no Next up while one is open", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E2);
    const d = await data();
    expect(d.essays.find((e) => e.question.id === E2)!.open).toBe(true);
    expect(d.openAttempt).toMatchObject({ essayId: E2, attemptId: a.attemptId, stage: "scaffold" });
    expect(d.openAttempt!.attemptToken).toMatch(/\./);
  });

  it("lists the latest gap detail for the concept panel", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting(E1);
    await gradeEnglish(a, E1, essayOfWords(900));
    const d = await data();
    expect(Object.values(d.gapDetails).join(" ")).toContain("EMARKER-GAP-8810");
  });
});

describe("states", () => {
  it("with no live essay the unit is not registered at all", async () => {
    env = await setupEnglishEnv();
    mockEnglishContent([]);
    await signedInStudent(env);
    const Page = (await import("@/app/unit/[unitId]/page")).default;
    await expect(Page({ params: Promise.resolve({ unitId: ENGLISH_UNIT }) })).rejects.toThrow();
  });

  it("an unreadable database shows a notice and no guessed list", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    env = await setupEnglishEnv();
    await signedInStudent(env);
    env.databaseDown();
    const tree = await page();
    expect(findAll(tree, named("UnitEssays"))).toHaveLength(0);
    const text = JSON.stringify(tree);
    expect(text).toContain("We can't load your essays right now");
    env.databaseUp();
  });
});

describe("the list component", () => {
  beforeEach(() => {
    env = undefined as unknown as EnglishEnv; // no database in these
  });
  const item = (n: number, over: Record<string, unknown> = {}) => ({
    question: { type: "englishEssay", group: "englishEssay", maxMarks: 20, live: true, id: `${ENGLISH_UNIT}.e${n}`, prompt: `Question ${n}`, directive: "discuss", directiveDefinition: "d", directiveGuidance: "nesa", offer: n, source: `Source ${n}`, conceptIds: [] },
    latest: null,
    open: false,
    nextUp: false,
    ...over,
  });

  it("labels Start, Redo and Resume, disables others while one is open and names the sources", () => {
    const html = renderToStaticMarkup(
      createElement(UnitEssays as never, {
        unitId: ENGLISH_UNIT,
        data: {
          openAttempt: { essayId: `${ENGLISH_UNIT}.e2`, attemptId: "att", stage: "write", attemptToken: "tok" },
          essays: [item(1, { latest: { mark: 14, band: 2, attemptId: "a1", at: "2026-11-23T00:00:00Z" } }), item(2, { open: true }), item(3)],
        },
      }),
    );
    expect(html).toContain("Source 1");
    expect(html).toContain("14 / 20");
    expect(html).toContain("band 2");
    expect(html).toContain(">Redo<");
    expect(html).toContain(">Resume<");
    expect(html).toContain("Discard this attempt");
    expect(html).toContain("Finish your open essay first.");
    expect(html).not.toContain("Next up"); // not while an attempt is open
  });

  it("shows a waiting message when no essay is live", () => {
    expect(renderToStaticMarkup(createElement(UnitEssays as never, { unitId: ENGLISH_UNIT, data: { openAttempt: null, essays: [] } }))).toContain("Essays are being checked");
  });
});
