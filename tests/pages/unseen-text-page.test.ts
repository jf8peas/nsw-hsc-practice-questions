// The text of an unseen-text question on its own page (spec 008 FR-006, research R12): sign-in required, a
// text shown only to a student who has an attempt on a question using it (anything else is one 404), and
// only public text fields in what it renders.

import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getAnswer } from "@/content/answers";

import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedUser } from "../helpers/fixtures";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

let env: TestEnv;
afterEach(async () => {
  await env?.close();
});

const UNIT = "y12-english-advanced-unseen-texts";
const POEM_Q = `${UNIT}.fs25-q1`; // Text 1 – Poem, fs25-t1
const PROSE_Q = `${UNIT}.fs25-q2`; // prose with footnotes, fs25-t2
const IMAGE_Q = `${UNIT}.fs23-q1`; // a visual text, fs23-t1

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

async function setup() {
  env = await setupTestEnv();
  const me = await seedUser(env.db);
  env.signedInAs(asSessionUser(me));
  return me;
}
const page = async (textId: string) => {
  const Page = (await import("@/app/unit/[unitId]/text/[textId]/page")).default;
  return Page({ params: Promise.resolve({ unitId: UNIT, textId }) });
};
/** The TextPanel the page renders, as the browser would first see it (the Shell and its menu are not under test). */
async function panelHtml(textId: string) {
  const tree = await page(textId);
  const panel = findAll(tree, named("TextPanel"))[0];
  return { tree, panel, html: renderToStaticMarkup(createElement(panel.type as never, panel.props as never)) };
}

describe("the text page: access", () => {
  it("redirects a signed-out request to sign-in", async () => {
    env = await setupTestEnv();
    env.signedOut();
    await expect(page("fs25-t1")).rejects.toThrow(/REDIRECT:.*signin/);
  });

  it("answers the same 404 for a text the student has not started, an unknown text and a malformed id", async () => {
    await setup();
    await expect(page("fs25-t1")).rejects.toThrow("NOT_FOUND"); // exists, but not started
    await expect(page("no-such-text")).rejects.toThrow("NOT_FOUND");
    await expect(page("../../etc/passwd")).rejects.toThrow("NOT_FOUND");
    await expect(page("FS25-T1")).rejects.toThrow("NOT_FOUND");
  });

  it("does not open for another student's attempt, and opens for a finished or an unfinished one of the student's own", async () => {
    const me = await setup();
    const other = await seedUser(env.db);
    await seedAttempt(env.db, other.id, { unitId: UNIT, questionIds: [POEM_Q] });
    await expect(page("fs25-t1")).rejects.toThrow("NOT_FOUND");
    await seedAttempt(env.db, me.id, { unitId: UNIT, questionIds: [POEM_Q] });
    expect((await panelHtml("fs25-t1")).html).toContain("un-text");
    await seedAttempt(env.db, me.id, { unitId: UNIT, questionIds: [PROSE_Q], completedAt: new Date() });
    expect((await panelHtml("fs25-t2")).html).toContain("un-text");
  });

  it("answers the same 404 for a text on a question the student's attempt did not include", async () => {
    const me = await setup();
    await seedAttempt(env.db, me.id, { unitId: UNIT, questionIds: [POEM_Q] });
    await expect(page("fs25-t2")).rejects.toThrow("NOT_FOUND");
  });
});

describe("the text page: what it shows", () => {
  it("a poem: heading, title, author, source line and every line, with no question, answer box or open-in-a-new-tab icon", async () => {
    const me = await setup();
    await seedAttempt(env.db, me.id, { unitId: UNIT, questionIds: [POEM_Q] });
    const { panel, html } = await panelHtml("fs25-t1");
    const text = panel.props as unknown as { text: { heading: string; title: string; author: string; sourceLine: string; body: { stanzas: string[][] } } };
    expect(html).toContain(text.text.heading.replace(/&/g, "&amp;"));
    expect(html).toContain(text.text.title);
    expect(html).toContain(text.text.author);
    expect(html).toContain("un-source");
    for (const line of text.text.body.stanzas.flat().slice(0, 3)) expect(html).toContain(line.replace(/'/g, "&#x27;").replace(/"/g, "&quot;"));
    expect(html).not.toContain("un-open");
    expect(html).not.toContain("<textarea");
    expect(html).not.toMatch(/Submit for marking/);
  });

  it("prose with its footnotes", async () => {
    const me = await setup();
    await seedAttempt(env.db, me.id, { unitId: UNIT, questionIds: [PROSE_Q] });
    const { html } = await panelHtml("fs25-t2");
    expect(html).toContain("un-prose");
    expect(html).toContain("un-footnotes");
    expect(html).toContain("decorously: in a polite and restrained manner.");
  });

  it("a visual text: the image from the authenticated route with a Zoom button, and no description", async () => {
    const me = await setup();
    await seedAttempt(env.db, me.id, { unitId: UNIT, questionIds: [IMAGE_Q] });
    const { html } = await panelHtml("fs23-t1");
    expect(html).toContain('src="/api/unseen/image/fs23-t1"');
    expect(html).toContain("Zoom");
    expect(html).not.toMatch(/description/i);
  });

  it("the tab title is '<heading> – <title>' for a started text and neutral otherwise", async () => {
    const me = await setup();
    const { generateMetadata } = await import("@/app/unit/[unitId]/text/[textId]/page");
    const meta = (textId: string) => generateMetadata({ params: Promise.resolve({ unitId: UNIT, textId }) });
    expect((await meta("fs25-t1")).title).toBe("Text");
    await seedAttempt(env.db, me.id, { unitId: UNIT, questionIds: [POEM_Q] });
    expect((await meta("fs25-t1")).title).toMatch(/^Text 1 – Poem – /);
  });
});

describe("the text page carries no key field", () => {
  it("no key property, and none of the question's criteria, notes, model answer or a visual's description", async () => {
    const me = await setup();
    await seedAttempt(env.db, me.id, { unitId: UNIT, questionIds: [POEM_Q, PROSE_Q, IMAGE_Q] });
    for (const [textId, qid] of [["fs25-t1", POEM_Q], ["fs25-t2", PROSE_Q], ["fs23-t1", IMAGE_Q]] as const) {
      const { tree, html } = await panelHtml(textId);
      const serialised = JSON.stringify(tree) + html;
      for (const banned of ["criteria", "modelAnswer", "visualDescription", "descriptionCheck", "descriptionHash", "unseenKey", "\"notes\""]) {
        expect(serialised, `${textId} ${banned}`).not.toContain(banned);
      }
      const key = getAnswer(qid)!.unseen!;
      for (const secret of [key.model, key.criteria, key.notes]) {
        for (let i = 0; i + 50 <= secret.length; i += 25) expect(serialised, `${textId} key run`).not.toContain(secret.slice(i, i + 50));
      }
    }
  });
});
