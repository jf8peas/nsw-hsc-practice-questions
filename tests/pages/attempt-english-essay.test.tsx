// The attempt detail page for an English essay (spec 011 FR-029, contracts/api.md G): a finished own attempt renders the full
// result and the model essay; an unfinished own attempt renders only the public question, the plan and the draft; another
// student's id is not found; and no raw mark, marker band, review, successful quote, key or play field is ever serialised.

import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  E1,
  INVENTED_QUOTE_FAKE,
  INVENTED_QUOTE_NEAR,
  INVENTED_QUOTE_OK,
  MODEL_WORD,
  essayOfWords,
  goodEnglishScaffold,
  gradeEnglish,
  restoreEnglishEnv,
  saveEnglishDraft,
  saveEnglishScaffold,
  setupEnglishEnv,
  startEnglish,
  startEnglishToWriting,
  type EnglishEnv,
} from "../helpers/english-essay";
import { signedInStudent } from "../helpers/routes";
import { asSessionUser } from "../helpers/env";
import { seedUser } from "../helpers/fixtures";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh: () => {}, push: vi.fn() }),
  usePathname: () => "/",
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
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

/** The static markup of the page's English detail element (the shell is async). */
async function detail(attemptId: string): Promise<string> {
  const Page = (await import("@/app/attempts/[attemptId]/page")).default;
  const tree = await Page({ params: Promise.resolve({ attemptId }) });
  const els = findAll(tree, (el) => typeof el.type === "function" && (el.type as { name?: string }).name === "EnglishEssayAttemptDetail");
  expect(els).toHaveLength(1);
  return renderToStaticMarkup(createElement(els[0]!.type as never, els[0]!.props as never));
}

const FORBIDDEN = ["ENOTES-TOKEN", "conceptTags", "markingNotes", "rawMark", "referenceTextHash", "usedWell", "REVIEW"];

describe("a finished own attempt", () => {
  it("renders the whole result and the model essay, with the near correction and no successful quote", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting();
    const essay = `${essayOfWords(880, "[mark:14]")} "${INVENTED_QUOTE_OK}" and "${INVENTED_QUOTE_NEAR}" and "${INVENTED_QUOTE_FAKE}"`;
    expect((await gradeEnglish(a, E1, essay)).status).toBe(200);
    const html = await detail(a.attemptId);
    expect(html).toContain("A band 1 model essay");
    expect(html).toContain(MODEL_WORD);
    expect(html).toContain("The lantern trembled in the salt wind"); // the near match's exact correction
    expect(html).toContain("not found in the play");
    expect(html).not.toContain(`<q>${INVENTED_QUOTE_OK}</q>`); // an accurate quotation is not listed as a flag (it is only in the essay text)
    for (const secret of FORBIDDEN) expect(html).not.toContain(secret);
    expect(html).toContain("Your essay");
    expect(html).toContain("Your plan");
  });
});

describe("an unfinished own attempt", () => {
  it("renders only the public question, the plan and the draft: no model, no marking field", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    await saveEnglishScaffold(a, E1, "start", goodEnglishScaffold());
    await saveEnglishDraft(a, E1, "MY OWN UNFINISHED DRAFT");
    const html = await detail(a.attemptId);
    expect(html).toContain("not finished yet");
    expect(html).toContain("MY OWN UNFINISHED DRAFT");
    expect(html).toContain("facing loss together");
    expect(html).toContain("Knox 2025 Trial, Q6");
    expect(html).not.toContain(MODEL_WORD);
    expect(html).not.toContain("band 1 model");
    for (const secret of FORBIDDEN) expect(html).not.toContain(secret);
  });

  it("an attempt still at the plan shows the plan so far", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    await saveEnglishScaffold(a, E1, "save", goodEnglishScaffold());
    const html = await detail(a.attemptId);
    expect(html).toContain("facing loss together");
    expect(html).not.toContain(MODEL_WORD);
  });
});

describe("ownership", () => {
  it("another student's attempt is not found, finished or not", async () => {
    env = await setupEnglishEnv();
    const owner = await signedInStudent(env);
    const a = await startEnglishToWriting();
    await gradeEnglish(a, E1, essayOfWords(900));
    const intruder = await seedUser(env.db, { email: "intruder@example.com", googleSub: "g-intruder" });
    env.signedInAs(asSessionUser(intruder));
    const Page = (await import("@/app/attempts/[attemptId]/page")).default;
    await expect(Page({ params: Promise.resolve({ attemptId: a.attemptId }) })).rejects.toThrow(/NEXT_NOT_FOUND/);
    env.signedInAs(asSessionUser(owner));
    await expect(detail(a.attemptId)).resolves.toContain(MODEL_WORD);
  });
});
