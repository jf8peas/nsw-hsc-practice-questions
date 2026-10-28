// @vitest-environment jsdom
//
// The header's user menu: only the student's name is printed; the address stays available as the
// hover title on the name, so it is never shown inline beside it.

import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedUser } from "../helpers/fixtures";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

let env: TestEnv | undefined;
afterEach(async () => {
  cleanup();
  await env?.close();
  env = undefined;
});

async function renderMenu() {
  const { UserMenu } = await import("@/components/UserMenu");
  const element = await UserMenu();
  return element === null ? null : render(element).container;
}

describe("UserMenu", () => {
  it("prints the name only and keeps the address as the hover title", async () => {
    env = await setupTestEnv();
    const row = await seedUser(env.db, { name: "Ada Lovelace", email: "ada@example.com" });
    env.signedInAs(asSessionUser(row));

    const container = await renderMenu();
    expect(container).not.toBeNull();

    const id = container!.querySelector(".user-menu-id");
    expect(id?.getAttribute("title")).toBe("ada@example.com");
    expect(container!.querySelector(".user-menu-name")?.textContent).toBe("Ada Lovelace");

    // The address is only in the title attribute, never rendered as text beside the name.
    expect(container!.querySelector(".user-menu-email")).toBeNull();
    expect(container!.textContent).not.toContain("ada@example.com");
  });

  it("keeps the progress link named when its label collapses to an icon", async () => {
    env = await setupTestEnv();
    const row = await seedUser(env.db, { name: "Ada Lovelace", email: "ada@example.com" });
    env.signedInAs(asSessionUser(row));

    const container = await renderMenu();
    const link = container!.querySelector(".user-menu-link");

    expect(link?.getAttribute("href")).toBe("/progress");
    // The icon is decorative; the full label still names the link for screen readers.
    expect(link?.getAttribute("aria-label")).toBe("My progress");
    expect(container!.querySelector(".user-menu-link-icon")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(container!.querySelector(".user-menu-link-text")?.textContent).toBe("My progress");
  });

  it("falls back to the address as the label when the name is empty", async () => {
    env = await setupTestEnv();
    const row = await seedUser(env.db, { name: "", email: "noname@example.com" });
    env.signedInAs(asSessionUser(row));

    const container = await renderMenu();
    expect(container!.querySelector(".user-menu-name")?.textContent).toBe("noname@example.com");
    expect(container!.querySelector(".user-menu-id")?.getAttribute("title")).toBe(
      "noname@example.com",
    );
  });

  it("renders nothing when signed out", async () => {
    env = await setupTestEnv();
    env.signedOut();
    expect(await renderMenu()).toBeNull();
  });
});
