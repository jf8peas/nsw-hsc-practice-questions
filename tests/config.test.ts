import { describe, expect, it } from "vitest";

import { configProblems } from "@/lib/config";
import { getConceptModels, getConfig, getEnglishAdvModel, getEnglishEssayGradingModel, getEnglishEssayReviewModel, getEssayGradingModel, getEssayReviewModel } from "@/lib/config.server";

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

describe("getConceptModels", () => {
  it("defaults the generator and leaves the illustration and review models unset", () => {
    expect(getConceptModels({})).toEqual({
      generator: "deepseek/deepseek-chat",
      illustration: null,
      reviewer: null,
    });
  });

  it("trims names and treats blank values as unset", () => {
    expect(
      getConceptModels({ CONCEPT_MODEL: " vendor/gen ", ILLUSTRATION_MODEL: "  ", REVIEW_MODEL: "vendor/rev" }),
    ).toEqual({ generator: "vendor/gen", illustration: null, reviewer: "vendor/rev" });
    expect(getConceptModels({ CONCEPT_MODEL: "   " }).generator).toBe("deepseek/deepseek-chat");
  });
});

describe("getEnglishAdvModel", () => {
  it("defaults to deepseek-v4.1-flash when unset or blank", () => {
    expect(getEnglishAdvModel({})).toBe("deepseek/deepseek-v4.1-flash");
    expect(getEnglishAdvModel({ ENGLISH_ADV_GRADING_MODEL: "   " })).toBe("deepseek/deepseek-v4.1-flash");
  });

  it("uses the configured model, trimmed", () => {
    expect(getEnglishAdvModel({ ENGLISH_ADV_GRADING_MODEL: " vendor/english " })).toBe("vendor/english");
  });

  it("never falls back to GRADING_MODEL", () => {
    expect(getEnglishAdvModel({ GRADING_MODEL: "vendor/other" })).toBe("deepseek/deepseek-v4.1-flash");
  });
});

describe("getConfig", () => {
  it("uses defaults when nothing is set", () => {
    expect(getConfig({})).toEqual({
      llmDailyCap: 40,
      gradeRateLimit: 20,
      gradeIpRateLimit: 150,
      attemptRateLimit: 20,
      draftRateLimit: 30,
      flagRateLimit: 10,
      conceptDailyCap: 100,
      conceptRateLimit: 10,
    });
  });

  it("reads CONCEPT_DAILY_CAP: default 100, 0 turns generation off, bad values fall back", () => {
    expect(getConfig({ CONCEPT_DAILY_CAP: "0" }).conceptDailyCap).toBe(0);
    expect(getConfig({ CONCEPT_DAILY_CAP: "250" }).conceptDailyCap).toBe(250);
    expect(getConfig({ CONCEPT_DAILY_CAP: "abc" }).conceptDailyCap).toBe(100);
    expect(getConfig({ CONCEPT_DAILY_CAP: "-1" }).conceptDailyCap).toBe(100);
    expect(getConfig({ CONCEPT_DAILY_CAP: "2.5" }).conceptDailyCap).toBe(100);
  });

  it("requires CONCEPT_RATE_LIMIT to be at least 1", () => {
    expect(getConfig({ CONCEPT_RATE_LIMIT: "0" }).conceptRateLimit).toBe(10);
    expect(getConfig({ CONCEPT_RATE_LIMIT: "3" }).conceptRateLimit).toBe(3);
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

describe("essay models (spec 010)", () => {
  it("default to deepseek-v4.1-flash when unset or blank", () => {
    expect(getEssayGradingModel({})).toBe("deepseek/deepseek-v4.1-flash");
    expect(getEssayGradingModel({ ESSAY_GRADING_MODEL: "  " })).toBe("deepseek/deepseek-v4.1-flash");
    expect(getEssayReviewModel({})).toBe("deepseek/deepseek-v4.1-flash");
  });

  it("use the configured model, trimmed, and are independent of each other", () => {
    expect(getEssayGradingModel({ ESSAY_GRADING_MODEL: " vendor/mark ", ESSAY_REVIEW_MODEL: "vendor/review" })).toBe("vendor/mark");
    expect(getEssayReviewModel({ ESSAY_GRADING_MODEL: "vendor/mark", ESSAY_REVIEW_MODEL: " vendor/review " })).toBe("vendor/review");
  });

  it("never fall back to another unit's model", () => {
    const env = { GRADING_MODEL: "vendor/a", ENGLISH_ADV_GRADING_MODEL: "vendor/b" };
    expect(getEssayGradingModel(env)).toBe("deepseek/deepseek-v4.1-flash");
    expect(getEssayReviewModel(env)).toBe("deepseek/deepseek-v4.1-flash");
  });
});

describe("English essay models (spec 011)", () => {
  it("default to openai/gpt-6.2-sol when unset or blank", () => {
    expect(getEnglishEssayGradingModel({})).toBe("openai/gpt-6.2-sol");
    expect(getEnglishEssayGradingModel({ ENGLISH_ESSAY_GRADING_MODEL: "  " })).toBe("openai/gpt-6.2-sol");
    expect(getEnglishEssayReviewModel({})).toBe("openai/gpt-6.2-sol");
    expect(getEnglishEssayReviewModel({ ENGLISH_ESSAY_REVIEW_MODEL: "" })).toBe("openai/gpt-6.2-sol");
  });

  it("use the configured model, trimmed, and are independent of each other", () => {
    const env = { ENGLISH_ESSAY_GRADING_MODEL: " vendor/mark ", ENGLISH_ESSAY_REVIEW_MODEL: " vendor/review " };
    expect(getEnglishEssayGradingModel(env)).toBe("vendor/mark");
    expect(getEnglishEssayReviewModel(env)).toBe("vendor/review");
    expect(getEnglishEssayGradingModel({ ENGLISH_ESSAY_REVIEW_MODEL: "vendor/review" })).toBe("openai/gpt-6.2-sol");
    expect(getEnglishEssayReviewModel({ ENGLISH_ESSAY_GRADING_MODEL: "vendor/mark" })).toBe("openai/gpt-6.2-sol");
  });

  it("never fall back to another unit's model setting", () => {
    const env = {
      ESSAY_GRADING_MODEL: "vendor/a",
      ESSAY_REVIEW_MODEL: "vendor/b",
      ENGLISH_ADV_GRADING_MODEL: "vendor/c",
      GRADING_MODEL: "vendor/d",
    };
    expect(getEnglishEssayGradingModel(env)).toBe("openai/gpt-6.2-sol");
    expect(getEnglishEssayReviewModel(env)).toBe("openai/gpt-6.2-sol");
  });
});
