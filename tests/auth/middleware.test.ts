import { describe, expect, it } from "vitest";

import { UNCONFIGURED_BODY, decideAccess, isPublicPath, safeCallbackUrl } from "@/lib/access";
import { REQUIRED_ENV } from "@/lib/config";

const FULL_ENV = Object.fromEntries(REQUIRED_ENV.map((n) => [n, "x"]));

describe("signed-out access (SC-007)", () => {
  it("redirects signed-out page requests to /signin with a callbackUrl", () => {
    expect(decideAccess({ pathname: "/unit/y11-formula-test", search: "?a=1", authed: false, nodeEnv: "development" })).toEqual({
      type: "redirect-signin",
      callbackUrl: "/unit/y11-formula-test?a=1",
    });
    expect(decideAccess({ pathname: "/", authed: false, nodeEnv: "development" }).type).toBe("redirect-signin");
  });

  it("answers signed-out API requests with 401", () => {
    for (const p of ["/api/grade", "/api/attempts", "/api/results/retry", "/api/results/self-mark"]) {
      expect(decideAccess({ pathname: p, authed: false, nodeEnv: "development" }).type).toBe("unauthenticated-api");
    }
  });

  it("lets public paths through without a session", () => {
    for (const p of ["/signin", "/api/auth/signin", "/api/auth/callback/google", "/api/auth/session", "/api/cron/retention"]) {
      expect(decideAccess({ pathname: p, authed: false, nodeEnv: "development" }).type).toBe("next");
      expect(isPublicPath(p)).toBe(true);
    }
  });

  it("does not treat look-alike paths as public", () => {
    for (const p of ["/signin/extra", "/api/authx", "/api/cron/retention/x", "/api/cron", "/unit/signin"]) {
      expect(isPublicPath(p)).toBe(false);
    }
  });

  it("lets signed-in requests through", () => {
    expect(decideAccess({ pathname: "/progress", authed: true, nodeEnv: "development" }).type).toBe("next");
    expect(decideAccess({ pathname: "/api/grade", authed: true, nodeEnv: "development" }).type).toBe("next");
  });
});

describe("fail closed in production (SC-010)", () => {
  it.each(REQUIRED_ENV)("refuses every request when %s is missing", (name) => {
    const env = { ...FULL_ENV, [name]: undefined };
    for (const authed of [true, false]) {
      for (const pathname of ["/", "/signin", "/api/grade", "/api/auth/session", "/api/cron/retention"]) {
        const d = decideAccess({ pathname, authed, nodeEnv: "production", env });
        expect(d).toEqual({ type: "unconfigured", missing: [name] });
      }
    }
  });

  it("the 503 body names no variables", () => {
    for (const name of REQUIRED_ENV) expect(UNCONFIGURED_BODY).not.toContain(name);
  });

  it("serves normally in production when fully configured", () => {
    expect(decideAccess({ pathname: "/signin", authed: false, nodeEnv: "production", env: FULL_ENV }).type).toBe("next");
    expect(decideAccess({ pathname: "/", authed: true, nodeEnv: "production", env: FULL_ENV }).type).toBe("next");
  });

  it("does not fail closed outside production (local dev may lack Google config)", () => {
    expect(decideAccess({ pathname: "/signin", authed: false, nodeEnv: "development", env: {} }).type).toBe("next");
  });
});

describe("callbackUrl handling", () => {
  it("honours only same-origin relative paths", () => {
    expect(safeCallbackUrl("/unit/x/quiz?attempt=1")).toBe("/unit/x/quiz?attempt=1");
    expect(safeCallbackUrl("/")).toBe("/");
  });

  it("ignores external, protocol-relative and malformed targets", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "evil.example", "", null, undefined, "/ok\r\nSet-Cookie: x=1"]) {
      expect(safeCallbackUrl(bad as string | null | undefined)).toBe("/");
    }
  });
});
