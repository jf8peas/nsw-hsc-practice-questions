import { afterEach, describe, expect, it } from "vitest";

import { buildProviders, devLoginUser, providerId } from "@/lib/auth.providers";

import { setupTestEnv, type TestEnv } from "../helpers/env";

const ids = (nodeEnv: string) => buildProviders(nodeEnv).map(providerId);

let env: TestEnv | undefined;
afterEach(async () => {
  await env?.close();
  env = undefined;
});

describe("dev-login provider", () => {
  it("is registered in development and test", () => {
    expect(ids("development")).toContain("dev-login");
    expect(ids("test")).toContain("dev-login");
  });

  it("is absent in production, leaving only Google", () => {
    expect(ids("production")).toEqual(["google"]);
    expect(ids("production")).not.toContain("dev-login");
  });

  it("derives a stable dev:<slug> id and a placeholder email", () => {
    expect(devLoginUser("Ann Lee")).toEqual({ id: "dev:ann-lee", name: "Ann Lee", email: "ann-lee@dev.local" });
    expect(devLoginUser("  ").id).toBe("dev:dev-student");
    expect(devLoginUser("!!!").id).toBe("dev:student");
  });

  it("creates a user whose google_sub is dev:<name>", async () => {
    env = await setupTestEnv();
    const callbacks = await import("@/lib/auth.callbacks.server");
    const { getUser } = await import("@/lib/db/queries/users.server");
    const user = devLoginUser("Ann Lee");
    const token = await callbacks.jwtCallback({
      token: {},
      user,
      account: { provider: "dev-login", providerAccountId: user.id },
    });
    const row = await getUser(env.db, token.uid as string);
    expect(row!.googleSub).toBe("dev:ann-lee");
  });
});
