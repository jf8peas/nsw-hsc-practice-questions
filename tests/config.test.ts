import { describe, expect, it } from "vitest";

import { configProblems } from "@/lib/config";
import { getConfig } from "@/lib/config.server";

const FULL = {
  AUTH_SECRET: "s",
  AUTH_GOOGLE_ID: "id",
  AUTH_GOOGLE_SECRET: "secret",
  DATABASE_URL: "postgres://x",
};

describe("configProblems", () => {
  it("returns nothing when everything is set", () => {
    expect(configProblems(FULL)).toEqual([]);
  });

  it("lists exactly the missing or blank variables", () => {
    expect(configProblems({})).toEqual([
      "AUTH_SECRET",
      "AUTH_GOOGLE_ID",
      "AUTH_GOOGLE_SECRET",
      "DATABASE_URL",
    ]);
    expect(configProblems({ ...FULL, AUTH_SECRET: undefined })).toEqual(["AUTH_SECRET"]);
    expect(configProblems({ ...FULL, DATABASE_URL: "   " })).toEqual(["DATABASE_URL"]);
  });
});

describe("getConfig", () => {
  it("uses defaults when nothing is set", () => {
    expect(getConfig({})).toEqual({
      llmDailyCap: 40,
      gradeRateLimit: 20,
      gradeIpRateLimit: 150,
      attemptRateLimit: 20,
    });
  });

  it("falls back for LLM_DAILY_CAP of abc and -5, accepts 0 and 12", () => {
    expect(getConfig({ LLM_DAILY_CAP: "abc" }).llmDailyCap).toBe(40);
    expect(getConfig({ LLM_DAILY_CAP: "-5" }).llmDailyCap).toBe(40);
    expect(getConfig({ LLM_DAILY_CAP: "0" }).llmDailyCap).toBe(0);
    expect(getConfig({ LLM_DAILY_CAP: "12" }).llmDailyCap).toBe(12);
    expect(getConfig({ LLM_DAILY_CAP: "1.5" }).llmDailyCap).toBe(40);
  });

  it("requires rate limits to be at least 1", () => {
    expect(getConfig({ GRADE_RATE_LIMIT: "0" }).gradeRateLimit).toBe(20);
    expect(getConfig({ GRADE_RATE_LIMIT: "5" }).gradeRateLimit).toBe(5);
  });

  it("importing the modules with no env set does not throw", async () => {
    await expect(import("@/lib/config")).resolves.toBeTruthy();
    await expect(import("@/lib/config.server")).resolves.toBeTruthy();
  });
});
