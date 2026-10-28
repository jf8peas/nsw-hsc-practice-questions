// Runs every query in docs/teacher-queries.sql exactly as written (FR-021, FR-022, SC-005, SC-008).

import fs from "node:fs";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { conceptSlots, conceptVersions, dailyConceptUsage } from "@/lib/db/schema";

import { createTestDb, type TestDb } from "./helpers/db";
import { seedAttempt, seedResult, seedUsage, seedUser } from "./helpers/fixtures";

const FILE = fs.readFileSync(path.resolve(__dirname, "../docs/teacher-queries.sql"), "utf8");

/** { name -> sql } split on the "-- QUERY: name" markers. */
const QUERIES: Record<string, string> = {};
{
  const parts = FILE.split(/^-- QUERY: (\w+)\s*$/m);
  for (let i = 1; i < parts.length; i += 2) QUERIES[parts[i]] = parts[i + 1].trim();
}

let t: TestDb;
let alice: Awaited<ReturnType<typeof seedUser>>;
let bob: Awaited<ReturnType<typeof seedUser>>;
let carol: Awaited<ReturnType<typeof seedUser>>;

const A = "unit-a";
const B = "unit-b";
const C = "unit-c";
const at = (iso: string) => new Date(iso);

async function answer(
  user: { id: string },
  attemptId: string,
  unitId: string,
  questionId: string,
  marks: number,
  max: number,
  gradedBy: "auto" | "llm" | "self",
  when: string,
  text = "an answer",
) {
  return seedResult(
    t.db,
    { attemptId, userId: user.id },
    { unitId, questionId, marksAwarded: marks, maxMarks: max, gradedBy, createdAt: at(when), answer: text },
  );
}

beforeAll(async () => {
  t = await createTestDb();
  alice = await seedUser(t.db, { name: "Alice", email: "Alice@Example.com", createdAt: at("2026-01-01T00:00:00Z"), lastSignInAt: at("2026-03-10T00:00:00Z") });
  bob = await seedUser(t.db, { name: "Bob", email: "bob@example.com", createdAt: at("2026-01-02T00:00:00Z"), lastSignInAt: at("2026-02-01T00:00:00Z") });
  carol = await seedUser(t.db, { name: "Carol", email: "carol@example.com", createdAt: at("2026-01-03T00:00:00Z"), lastSignInAt: at("2026-01-03T00:00:00Z") });
  await t.pg.query("update users set last_answer_at = $1 where id = $2", [at("2026-03-05T00:00:00Z"), alice.id]);
  await t.pg.query("update users set last_answer_at = $1 where id = $2", [at("2026-02-20T00:00:00Z"), bob.id]);

  const aA = await seedAttempt(t.db, alice.id, { unitId: A });
  const aB = await seedAttempt(t.db, alice.id, { unitId: B });
  const bA = await seedAttempt(t.db, bob.id, { unitId: A });
  const bB = await seedAttempt(t.db, bob.id, { unitId: B });
  const bC = await seedAttempt(t.db, bob.id, { unitId: C });

  // unit A (a1, a2, a3): alice 1/1, 0/1, 0/1 and bob 1/1, 0/1, 0/1 -> 2/6 = 33.3%
  await answer(alice, aA.id, A, "unit-a.a1", 1, 1, "auto", "2026-03-01T01:00:00Z", "Option right");
  await answer(alice, aA.id, A, "unit-a.a2", 0, 1, "auto", "2026-03-01T01:05:00Z", "Option wrong 1");
  await answer(bob, bA.id, A, "unit-a.a1", 1, 1, "auto", "2026-02-01T01:00:00Z", "Option right");
  // unit B: alice llm 0/2 + self 1/2, bob llm 0/2 -> 1/6 = 16.7% with self, 0/4 = 0% without
  await answer(alice, aB.id, B, "unit-b.b1", 0, 2, "llm", "2026-03-02T01:00:00Z");
  await answer(alice, aB.id, B, "unit-b.b2", 1, 2, "self", "2026-03-02T01:05:00Z");
  await answer(bob, bB.id, B, "unit-b.b1", 0, 2, "llm", "2026-02-02T01:00:00Z");
  // unit C: 1/1 = 100%
  await answer(bob, bC.id, C, "unit-c.c1", 1, 1, "auto", "2026-02-03T01:00:00Z", "Option right");
  // MC wrong options for the wrong-option query (unit A question a2)
  await answer(bob, bA.id, A, "unit-a.a2", 0, 1, "auto", "2026-02-01T01:05:00Z", "Option wrong 1");
  await answer(bob, bA.id, A, "unit-a.a3", 0, 1, "auto", "2026-02-01T01:10:00Z", "Option wrong 2");
  await answer(alice, aA.id, A, "unit-a.a3", 0, 1, "auto", "2026-03-01T01:10:00Z", "Option wrong 3");
  await answer(bob, bC.id, C, "unit-c.c2", 0, 1, "auto", "2026-02-03T01:05:00Z", ""); // an empty SHORT answer: not multiple choice

  // today's AI usage
  const today = (await t.pg.query<{ d: string }>("select to_char((now() at time zone 'Australia/Sydney')::date, 'YYYY-MM-DD') d")).rows[0].d;
  await seedUsage(t.db, alice.id, today, 7);
  await seedUsage(t.db, bob.id, today, 2);
  await seedUsage(t.db, carol.id, "2020-01-01", 40); // a different day
});

afterAll(async () => {
  await t.close();
});

const run = async (name: string, edit: (sql: string) => string = (s) => s) =>
  (await t.pg.query<Record<string, unknown>>(edit(QUERIES[name]))).rows;

const setParam = (sql: string, from: string, to: string) => sql.replace(from, to);

describe("the file", () => {
  it("contains the documented queries, each with an editable params block where it has anything to edit", () => {
    expect(Object.keys(QUERIES).sort()).toEqual(
      [
        "ai_answers_used_today",
        "common_wrong_mc_option",
        "concept_generation_usage",
        "flagged_concept_content",
        "questions_in_unit_by_average",
        "student_history",
        "students_last_active",
        "units_by_class_average",
      ].sort(),
    );
    // flagged_concept_content takes no parameters: it lists every flagged item
    for (const [name, sql] of Object.entries(QUERIES)) if (name !== "flagged_concept_content") expect(sql, name).toMatch(/WITH params AS/);
  });

  it("every query is read-only", () => {
    for (const sql of Object.values(QUERIES)) {
      expect(sql).not.toMatch(/\b(insert|update|delete|drop|alter|truncate|create)\b/i);
    }
  });

  it("the params of each date-filterable query offer from_date, to_date and include_self", () => {
    for (const name of ["units_by_class_average", "questions_in_unit_by_average", "common_wrong_mc_option", "student_history", "students_last_active"]) {
      expect(QUERIES[name], name).toMatch(/AS from_date/);
      expect(QUERIES[name], name).toMatch(/AS to_date/);
    }
    for (const name of ["units_by_class_average", "questions_in_unit_by_average", "student_history", "students_last_active"]) {
      expect(QUERIES[name], name).toMatch(/AS include_self/);
    }
  });
});

describe("units_by_class_average (3 weakest units)", () => {
  it("ranks units lowest class average first, weighted by marks", async () => {
    const rows = await run("units_by_class_average");
    expect(rows.map((r) => r.unit_id)).toEqual([B, A, C]);
    expect(Number(rows[0].class_average_pct)).toBe(16.7);
    expect(Number(rows[1].class_average_pct)).toBe(33.3);
    expect(Number(rows[2].class_average_pct)).toBe(50); // c1 1/1 and the empty short answer c2 0/1
    expect(Number(rows[0].answers)).toBe(3);
    expect(Number(rows[0].students)).toBe(2);
  });

  it("include_self = false drops self-marked answers", async () => {
    const rows = await run("units_by_class_average", (s) => s.replace("true              AS include_self", "false             AS include_self"));
    const unitB = rows.find((r) => r.unit_id === B)!;
    expect(Number(unitB.class_average_pct)).toBe(0); // 0 / 4: the self-marked 1/2 is gone
    expect(Number(unitB.answers)).toBe(2);
  });

  it("the date range limits what is counted", async () => {
    const rows = await run("units_by_class_average", (s) =>
      setParam(setParam(s, "DATE '2000-01-01'", "DATE '2026-03-01'"), "DATE '2999-12-31'", "DATE '2026-03-31'"),
    );
    // only alice's March answers: unit A (1/2 + 0/1 on 1 Mar Sydney) and unit B (2 Mar)
    const ids = rows.map((r) => r.unit_id);
    expect(ids).toContain(A);
    expect(ids).toContain(B);
    expect(ids).not.toContain(C);
    expect(Number(rows.find((r) => r.unit_id === B)!.students)).toBe(1);
  });

  it("max_rows limits the list", async () => {
    const rows = await run("units_by_class_average", (s) => s.replace("3                 AS max_rows", "1                 AS max_rows"));
    expect(rows).toHaveLength(1);
    expect(rows[0].unit_id).toBe(B);
  });
});

describe("questions_in_unit_by_average (5 weakest questions)", () => {
  it("ranks the unit's questions lowest first", async () => {
    const rows = await run("questions_in_unit_by_average", (s) => s.replace("'y11-formula-test'::text", `'${A}'::text`));
    // a2 and a3 tie at 0%: more answers first, then question id
    expect(rows.map((r) => r.question_id)).toEqual(["unit-a.a2", "unit-a.a3", "unit-a.a1"]);
    expect(Number(rows[0].average_mark_pct)).toBe(0);
    expect(Number(rows[2].average_mark_pct)).toBe(100);
    expect(Number(rows[1].answers)).toBe(2);
  });

  it("only returns the chosen unit, honours max_rows and include_self", async () => {
    const forB = await run("questions_in_unit_by_average", (s) => s.replace("'y11-formula-test'::text", `'${B}'::text`));
    expect(forB.map((r) => r.question_id).sort()).toEqual(["unit-b.b1", "unit-b.b2"]);
    const noSelf = await run("questions_in_unit_by_average", (s) =>
      s.replace("'y11-formula-test'::text", `'${B}'::text`).replace("true                     AS include_self", "false                    AS include_self"),
    );
    expect(noSelf.map((r) => r.question_id)).toEqual(["unit-b.b1"]);
    const limited = await run("questions_in_unit_by_average", (s) =>
      s.replace("'y11-formula-test'::text", `'${A}'::text`).replace("5                        AS max_rows", "2                        AS max_rows"),
    );
    expect(limited).toHaveLength(2);
  });
});

describe("common_wrong_mc_option", () => {
  it("shows the most chosen wrong option text per MC question, excluding empty short answers", async () => {
    const rows = await run("common_wrong_mc_option");
    const a2 = rows.find((r) => r.question_id === "unit-a.a2")!;
    expect(a2.most_common_wrong_option).toBe("Option wrong 1");
    expect(Number(a2.times_chosen)).toBe(2);
    const a3 = rows.find((r) => r.question_id === "unit-a.a3")!;
    // wrong 2 and wrong 3 tie at 1 each: ties break alphabetically
    expect(a3.most_common_wrong_option).toBe("Option wrong 2");
    expect(Number(a3.wrong_answers)).toBe(2);
    expect(rows.find((r) => r.question_id === "unit-c.c2")).toBeUndefined(); // empty answer = a short question
    expect(rows.some((r) => r.question_id === "unit-b.b1")).toBe(false); // AI-graded, not MC
  });

  it("can be limited to one unit and a date range", async () => {
    const onlyA = await run("common_wrong_mc_option", (s) => s.replace("NULL::text        AS unit_id", `'${A}'::text AS unit_id`));
    expect(onlyA.every((r) => r.unit_id === A)).toBe(true);
    const feb = await run("common_wrong_mc_option", (s) =>
      setParam(setParam(s, "DATE '2000-01-01'", "DATE '2026-02-01'"), "DATE '2999-12-31'", "DATE '2026-02-28'"),
    );
    const a2 = feb.find((r) => r.question_id === "unit-a.a2")!;
    expect(Number(a2.times_chosen)).toBe(1); // only bob's February answer
  });
});

describe("student_history", () => {
  const forEmail = (email: string) => (s: string) => s.replace("'student@example.com'::text", `'${email}'::text`);

  it("lists one student's answers in time order, matching email case-insensitively", async () => {
    const rows = await run("student_history", forEmail("alice@example.COM"));
    expect(rows.map((r) => r.question_id)).toEqual(["unit-a.a1", "unit-a.a2", "unit-a.a3", "unit-b.b1", "unit-b.b2"]);
    const times = rows.map((r) => new Date(r.answered_at_sydney as string).getTime());
    expect([...times].sort((x, y) => x - y)).toEqual(times);
    expect(rows[0]).toHaveProperty("attempt_id");
    expect(rows[0]).toHaveProperty("graded_by");
  });

  it("only that student, with include_self and date range applied", async () => {
    const noSelf = await run("student_history", (s) =>
      forEmail("alice@example.com")(s).replace("true                        AS include_self", "false                       AS include_self"),
    );
    expect(noSelf.some((r) => r.graded_by === "self")).toBe(false);
    expect(noSelf).toHaveLength(4);
    const none = await run("student_history", forEmail("nobody@example.com"));
    expect(none).toEqual([]);
  });
});

describe("students_last_active", () => {
  it("lists every student, most recently active first", async () => {
    const rows = await run("students_last_active");
    expect(rows.map((r) => r.email)).toEqual(["Alice@Example.com", "bob@example.com", "carol@example.com"]);
    // alice: latest of last answer (5 Mar) and last sign-in (10 Mar) is the sign-in
    expect(new Date(rows[0].last_active_sydney as string).toISOString().slice(0, 10)).toBe("2026-03-10");
    expect(Number(rows[0].answers_in_range)).toBe(5);
    expect(Number(rows[2].answers_in_range)).toBe(0);
  });

  it("the date range filters on last activity, include_self on the answer count", async () => {
    const recent = await run("students_last_active", (s) => setParam(s, "DATE '2000-01-01'", "DATE '2026-03-01'"));
    expect(recent.map((r) => r.email)).toEqual(["Alice@Example.com"]);
    const noSelf = await run("students_last_active", (s) => s.replace("true              AS include_self", "false             AS include_self"));
    expect(Number(noSelf[0].answers_in_range)).toBe(4);
  });
});

describe("ai_answers_used_today", () => {
  it("shows each student's AI-graded answers for today's Sydney date", async () => {
    const rows = await run("ai_answers_used_today");
    expect(rows.map((r) => [r.email, Number(r.ai_answers_used)])).toEqual([
      ["Alice@Example.com", 7],
      ["bob@example.com", 2],
    ]); // carol's 40 were on a different day
  });

  it("can be pointed at another day", async () => {
    const rows = await run("ai_answers_used_today", (s) =>
      s.replace("(now() AT TIME ZONE 'Australia/Sydney')::date AS day", "DATE '2020-01-01' AS day"),
    );
    expect(rows.map((r) => r.email)).toEqual(["carol@example.com"]);
  });
});

describe("a deleted student is absent from every query (SC-008)", () => {
  it("removes them from every query after deleting their row", async () => {
    await t.pg.query("delete from users where id = $1", [carol.id]);
    const last = await run("students_last_active");
    expect(last.some((r) => r.email === "carol@example.com")).toBe(false);
    await t.pg.query("delete from users where id = $1", [bob.id]);
    for (const name of Object.keys(QUERIES)) {
      const rows = await run(name, (s) => s.replace("'student@example.com'::text", "'bob@example.com'::text"));
      const text = JSON.stringify(rows);
      expect(text, name).not.toContain("bob@example.com");
      expect(text, name).not.toContain(bob.id);
    }
    const students = await run("units_by_class_average");
    expect(students.find((r) => r.unit_id === C)).toBeUndefined(); // bob was the only one on unit C
  });
});

describe("flagged_concept_content", () => {
  const NOW = new Date("2026-10-28T10:00:00Z");
  const base = { unitId: "fx-ready", generatorModel: "vendor/gen", generatedAt: NOW, createdAt: NOW } as const;

  async function seedSlot(conceptId: string, kind: "summary" | "illustration", replacementId: string | null) {
    await t.db.insert(conceptSlots).values({ conceptId, kind, unitId: "fx-ready", replacementVersionId: replacementId });
  }
  const bullets = ["one", "two", "three"];

  it("lists held-back items with the reason, models and times, and omits approved, pending and first-failure versions", async () => {
    const [flagged] = await t.db
      .insert(conceptVersions)
      .values({
        ...base, conceptId: "fx-ready.c-a", kind: "summary", status: "failed_review", origin: "auto_retry", attemptNo: 2,
        summaryBullets: bullets, reviewerModel: "vendor/rev", reviewerReason: "Quotes the model answer.", reviewedAt: NOW,
      })
      .returning();
    await seedSlot("fx-ready.c-a", "summary", flagged.id);

    const [pending] = await t.db
      .insert(conceptVersions)
      .values({ ...base, conceptId: "fx-ready.c-b", kind: "summary", status: "pending_review", origin: "first", attemptNo: 1, summaryBullets: bullets })
      .returning();
    await seedSlot("fx-ready.c-b", "summary", pending.id);

    const [approved] = await t.db
      .insert(conceptVersions)
      .values({
        ...base, conceptId: "fx-ready.c-c", kind: "summary", status: "approved", origin: "first", attemptNo: 1,
        summaryBullets: bullets, reviewerModel: "vendor/rev", reviewedAt: NOW, approvedBy: "reviewer",
      })
      .returning();
    await t.db.insert(conceptSlots).values({ conceptId: "fx-ready.c-c", kind: "summary", unitId: "fx-ready", liveVersionId: approved.id });

    const [firstFailure] = await t.db
      .insert(conceptVersions)
      .values({
        ...base, conceptId: "fx-ready.c-d", kind: "summary", status: "failed_review", origin: "first", attemptNo: 1,
        summaryBullets: bullets, reviewerModel: "vendor/rev", reviewerReason: "Retry pending.", reviewedAt: NOW,
      })
      .returning();
    await seedSlot("fx-ready.c-d", "summary", firstFailure.id);

    const rows = await run("flagged_concept_content");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      concept_id: "fx-ready.c-a",
      unit_id: "fx-ready",
      kind: "summary",
      reason: "Quotes the model answer.",
      generator_model: "vendor/gen",
      reviewer_model: "vendor/rev",
      version_id: flagged.id,
    });
    expect(rows[0]).toHaveProperty("generated_at_sydney");
    expect(rows[0]).toHaveProperty("reviewed_at_sydney");
  });
});

describe("concept_generation_usage", () => {
  it("shows today's calls (0 when none were made) and can be pointed at a seeded day", async () => {
    const today = await run("concept_generation_usage");
    expect(today).toHaveLength(1);
    expect(Number(today[0].concept_calls_used)).toBe(0);

    await t.db.insert(dailyConceptUsage).values({ sydneyDate: "2020-01-01", count: 7 });
    const seeded = await run("concept_generation_usage", (sql) =>
      sql.replace("(now() AT TIME ZONE 'Australia/Sydney')::date AS day", "DATE '2020-01-01' AS day"),
    );
    expect(seeded.map((r) => [(r.sydney_date as Date).toISOString().slice(0, 10), Number(r.concept_calls_used)])).toEqual([["2020-01-01", 7]]);
  });
});
