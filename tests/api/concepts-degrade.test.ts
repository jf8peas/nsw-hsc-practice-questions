// Whatever fails (generator, reviewer, cap, database), the unit page still lists the student's
// weak concepts with no error, and a quiz can still start (spec 002 US3; FR-028, FR-031).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedUser } from "../helpers/fixtures";
import { post } from "../helpers/routes";
import { READY, conceptId, failVerdict, fakeLlmPort, fixtureContent, seedResultAt, type FakePort } from "../helpers/concept-fixtures";

import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh: () => {} }),
}));

const A = conceptId("a");
let env: TestEnv;
let port: FakePort;

beforeEach(async () => {
  env = await setupTestEnv();
  fixtureContent();
  port = fakeLlmPort();
  vi.stubEnv("CONCEPT_MODEL", "vendor/gen");
  vi.stubEnv("REVIEW_MODEL", "vendor/rev");
  vi.doMock("@/lib/concepts/llm.server", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/lib/concepts/llm.server")>()),
    createConceptLlmPort: () => port,
  }));
});
afterEach(async () => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  await env.close();
});

async function weakStudent() {
  const row = await seedUser(env.db);
  env.signedInAs(asSessionUser(row));
  const attempt = await seedAttempt(env.db, row.id, { unitId: READY });
  await seedResultAt(env.db, { attemptId: attempt.id, userId: row.id }, READY, `${READY}.m01`, 0, 1, new Date());
  return row;
}

async function ensure() {
  const { POST } = await import("@/app/api/units/[unitId]/concepts/ensure/route");
  const { settleBackground } = await import("@/lib/background.server");
  const res = await POST(new Request("http://localhost/x", { method: "POST" }), { params: Promise.resolve({ unitId: READY }) });
  const body = await res.json();
  await settleBackground();
  return { status: res.status, body };
}

function find(node: ReactNode, name: string, out: ReactElement[] = []) {
  if (Array.isArray(node)) node.forEach((n) => find(n, name, out));
  else if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    if (typeof el.type === "function" && (el.type as { name?: string }).name === name) out.push(el);
    find(el.props.children, name, out);
  }
  return out;
}

/** The unit page as a student sees it: the panel's markup, and where Start quiz is. */
async function page() {
  const Page = (await import("@/app/unit/[unitId]/page")).default;
  const tree = await Page({ params: Promise.resolve({ unitId: READY }) });
  const panel = find(tree, "ConceptPanel")[0];
  const { ConceptPanel } = await import("@/components/ConceptPanel");
  return {
    html: renderToStaticMarkup(createElement(ConceptPanel, panel.props as never)),
    hasStart: find(tree, "StartQuiz").length === 1,
  };
}

const NO_ERROR = /error|failed|unavailable|try again|something went wrong|generat|review|cap/i;

describe("a used-up daily cap", () => {
  it("leaves the weak concept listed by its description, with no error, and nothing new is prepared", async () => {
    vi.stubEnv("CONCEPT_DAILY_CAP", "1"); // enough to generate, not to review
    await weakStudent();
    const first = await ensure();
    expect(first.status).toBe(202);
    expect(port.count("generateSummary")).toBe(1);
    expect(port.count("reviewSummary")).toBe(0);

    const { html, hasStart } = await page();
    expect(html).toContain("Concept A");
    expect(html).toContain("3 more correct answers needed");
    expect(html).not.toMatch(NO_ERROR);
    expect(html).not.toContain("<details");
    expect(hasStart).toBe(true);

    const second = await ensure(); // still pending review, and the cap is still used up
    expect(second.body.queued).toEqual([A]);
    expect(port.count("generateSummary")).toBe(1); // the review is retried, a new generation is not
    expect(port.count("reviewSummary")).toBe(0);
  });

  it("a cap of 0 prepares nothing at all", async () => {
    vi.stubEnv("CONCEPT_DAILY_CAP", "0");
    await weakStudent();
    expect((await ensure()).body.queued).toEqual([]);
    expect(port.calls).toHaveLength(0);
    expect((await page()).html).toContain("Concept A");
  });
});

describe("a generator that fails", () => {
  it("stores nothing, backs off for 15 minutes, then tries again", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-28T10:00:00Z"));
    await weakStudent();
    port.queue.generateSummary.push("call_failed");

    expect((await ensure()).status).toBe(202);
    expect(port.count("generateSummary")).toBe(1);
    const { html } = await page();
    expect(html).toContain("Concept A");
    expect(html).not.toMatch(NO_ERROR);

    // inside the backoff, opening the page makes no call
    vi.setSystemTime(new Date("2026-10-28T10:10:00Z"));
    const during = await ensure();
    expect(during.body.queued).toEqual([]);
    expect(port.count("generateSummary")).toBe(1);

    // after it, the next visit tries again and succeeds
    vi.setSystemTime(new Date("2026-10-28T10:16:00Z"));
    const after = await ensure();
    expect(after.body.queued).toEqual([A]);
    expect(port.count("generateSummary")).toBe(2);
    expect((await page()).html).toContain("<details");
  });
});

describe("a reviewer that is missing, the same model, or down", () => {
  it("leaves content unseen and the concept listed, for each", async () => {
    for (const setting of ["", "vendor/gen", "Vendor/GEN:online"]) {
      vi.stubEnv("REVIEW_MODEL", setting);
      port = fakeLlmPort();
      await env.close();
      env = await setupTestEnv();
      fixtureContent();
      vi.doMock("@/lib/concepts/llm.server", async (importOriginal) => ({
        ...(await importOriginal<typeof import("@/lib/concepts/llm.server")>()),
        createConceptLlmPort: () => port,
      }));
      await weakStudent();
      await ensure();
      const { html } = await page();
      expect(html).toContain("Concept A");
      expect(html).not.toContain("<details");
      expect(html).not.toMatch(NO_ERROR);
    }
  });

  it("a reviewer that is down leaves the generated version pending and unseen, then approves it once it is back", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-28T10:00:00Z"));
    await weakStudent();
    port.queue.reviewSummary.push("call_failed");
    await ensure();
    expect((await page()).html).not.toContain("<details");

    vi.setSystemTime(new Date("2026-10-28T10:20:00Z"));
    await ensure(); // the review is retried, not the generation
    expect(port.count("generateSummary")).toBe(1);
    expect((await page()).html).toContain("<details");
  });
});

describe("content that failed review twice", () => {
  it("is shown to no student, and opening the page again never regenerates it", async () => {
    await weakStudent();
    port.queue.reviewSummary.push(failVerdict("Quotes the model answer."), failVerdict("Still wrong."));
    await ensure();
    const { html } = await page();
    expect(html).toContain("Concept A");
    expect(html).not.toContain("<details");
    expect(html).not.toContain("Still wrong");
    expect(html).not.toContain("model answer");
    const calls = port.calls.length;
    await ensure();
    await ensure();
    expect(port.calls.length).toBe(calls);
  });
});

describe("the database", () => {
  it("when it cannot be read the page shows a plain notice and a quiz still starts", async () => {
    await weakStudent();
    env.databaseDown();
    const { html, hasStart } = await page();
    expect(html).toContain("We could not load your weak concepts right now");
    expect(hasStart).toBe(true);

    const { POST } = await import("@/app/api/attempts/route");
    const res = await POST(post("/api/attempts", { unitId: READY }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.persisted).toBe(false);
    expect(body.questions).toHaveLength(8);
  });

  it("the ensure and status routes answer 503 temporarily_unavailable, never 401", async () => {
    await weakStudent();
    env.databaseDown();
    expect((await ensure()).status).toBe(503);
    const { GET } = await import("@/app/api/units/[unitId]/concepts/status/route");
    const res = await GET(new Request("http://localhost/x"), { params: Promise.resolve({ unitId: READY }) });
    expect(res.status).toBe(503);
  });
});

describe("what students never see", () => {
  it("no response or page carries a reviewer reason, an error, or a model name, even after failures", async () => {
    await weakStudent();
    port.queue.generateSummary.push({ ok: true, value: { bullets: ["a b c", "d e f", "g h i"], illustration: null } }, "call_failed");
    port.queue.reviewSummary.push(failVerdict("SECRET-REASON quoting the model answer"));
    const r = await ensure();
    const page1 = await page();
    const text = JSON.stringify(r.body) + page1.html;
    for (const secret of ["SECRET-REASON", "vendor/", "http ", "call_failed", "generation failed"]) expect(text).not.toContain(secret);
  });
});
