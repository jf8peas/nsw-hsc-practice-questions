// Per-student unit archiving on the home page: archived units are hidden by default, return
// visually muted with "Unarchive" under ?all=1, the "Show all" switch appears only when there
// is something to archive, every unit archived shows the notice instead of an empty group, and
// a database outage shows everything with no archive UI and no error.

import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { unitArchives } from "@/lib/db/schema";
import { sydneyDate } from "@/lib/sydney";
import type { Unit } from "@/lib/types";

import { fixtureContent } from "../helpers/concept-fixtures";
import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedUser } from "../helpers/fixtures";

// UnitCard renders next/link and ArchiveButton reads next/navigation.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  redirect: () => {
    throw new Error("redirect called");
  },
}));

let env: TestEnv;
afterEach(async () => {
  await env?.close();
});

/** A unit created `n` whole days ago (Sydney calendar), far from the 14-day boundary. */
const daysAgo = (n: number) => sydneyDate(new Date(Date.now() - n * 86_400_000));

const OLD = "fx-old";
const FRESH = "fx-fresh";

/** An old unit (archivable) and one too young to archive, in the same year group. */
function year12Units(): Unit[] {
  return [
    {
      id: OLD,
      year: "Year 12",
      topic: "Fixtures",
      type: "Topic Quiz",
      title: "Old fixture",
      description: "",
      created: daysAgo(30),
      order: 0,
      questions: [],
    },
    {
      id: FRESH,
      year: "Year 12",
      topic: "Fixtures",
      type: "Topic Quiz",
      title: "Fresh fixture",
      description: "",
      created: daysAgo(5),
      order: 1,
      questions: [],
    },
  ];
}

/** Find elements in a React element tree (server components are not rendered, just inspected). */
function findAll(node: ReactNode, match: (el: ReactElement) => boolean, out: ReactElement[] = []) {
  if (Array.isArray(node)) node.forEach((n) => findAll(n, match, out));
  else if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    if (match(el)) out.push(el);
    findAll(el.props.children, match, out);
  }
  return out;
}

/** All string text inside an element tree. */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node as ReactElement<{ children?: ReactNode }>).props.children);
  return "";
}

const named = (name: string) => (el: ReactElement) =>
  typeof el.type === "function" && (el.type as { name?: string }).name === name;

async function setup(units: Unit[]) {
  env = await setupTestEnv();
  fixtureContent(units);
  const me = await seedUser(env.db);
  env.signedInAs(asSessionUser(me));
  return { me };
}

async function renderPage(searchParams?: Record<string, string>) {
  const Page = (await import("@/app/page")).default;
  return Page({
    searchParams: Promise.resolve(searchParams ?? {}),
  });
}

/** The home page tree with every UnitCard rendered to real markup. */
async function renderCards(searchParams?: Record<string, string>) {
  const tree = await renderPage(searchParams);
  const { UnitCard } = await import("@/components/UnitCard");
  return {
    tree,
    cards: findAll(tree, named("UnitCard")).map((el) =>
      renderToStaticMarkup(createElement(UnitCard, el.props as never)),
    ),
  };
}

const cardFor = (cards: string[], unitId: string) =>
  cards.find((c) => c.includes(`/unit/${unitId}`)) ?? "";

const switchEls = (tree: ReactNode) =>
  findAll(tree, (el) =>
    el.type === "a" ? String((el.props as { className?: string }).className ?? "").includes("show-all-switch") : false,
  );

describe("home page unit archiving", () => {
  it("hides archived units by default and offers nothing on a too-young unit", async () => {
    const { me } = await setup(year12Units());
    await env.db.insert(unitArchives).values({ userId: me.id, unitId: OLD });

    const { tree, cards } = await renderCards();
    expect(cardFor(cards, OLD)).toBe(""); // archived → hidden
    expect(cardFor(cards, FRESH)).toContain("Fresh fixture");
    expect(cardFor(cards, FRESH)).not.toContain("Archive");

    // Something is archived, so the switch is worth showing.
    expect(switchEls(tree)).toHaveLength(1);
  });

  it("?all=1 shows archived units muted, with Unarchive instead of Archive", async () => {
    const { me } = await setup(year12Units());
    await env.db.insert(unitArchives).values({ userId: me.id, unitId: OLD });

    const { tree, cards } = await renderCards({ all: "1" });
    const oldCard = cardFor(cards, OLD);
    expect(oldCard).toContain("Old fixture");
    expect(oldCard).toContain("unit-card archived");
    expect(oldCard).toContain("Unarchive");
    expect(oldCard).not.toContain(">Archive<");

    // The too-young unit still gets no button.
    expect(cardFor(cards, FRESH)).not.toContain("Unarchive");

    // The switch reflects the on state.
    const [sw] = switchEls(tree);
    expect(sw.props).toMatchObject({ role: "switch", "aria-checked": true });
    expect(String((sw.props as { className?: string }).className)).toContain(" on");
  });

  it("a unit old enough to archive shows Archive while not archived", async () => {
    await setup(year12Units());

    const { tree, cards } = await renderCards();
    expect(cardFor(cards, OLD)).toContain(">Archive<");
    expect(cardFor(cards, FRESH)).not.toContain("Archive");
    expect(switchEls(tree)).toHaveLength(1); // OLD is archivable
  });

  it("hides the switch when nothing is archived and nothing is old enough", async () => {
    await setup([year12Units()[1]]); // only the too-young unit

    const { tree, cards } = await renderCards();
    expect(switchEls(tree)).toHaveLength(0);
    expect(cardFor(cards, FRESH)).not.toContain("Archive");
  });

  it("hides the whole group (no heading, no note) when every unit is archived, with one page-level line", async () => {
    const { me } = await setup(year12Units());
    await env.db.insert(unitArchives).values([
      { userId: me.id, unitId: OLD },
      { userId: me.id, unitId: FRESH },
    ]);

    const { tree, cards } = await renderCards();
    expect(cards).toHaveLength(0);
    // no year heading, no per-group note: the group is gone entirely
    expect(findAll(tree, (el) => el.type === "div" && String((el.props as { className?: string }).className ?? "").includes("eyebrow"))).toHaveLength(0);
    // one page-level line under the subtitle, and the switch is still there (units are archived)
    expect(textOf(tree)).toContain("All units archived. Turn on Show all to see them.");
    expect(switchEls(tree)).toHaveLength(1);

    // Show all on: the group renders as before, muted with Unarchive
    const all = await renderCards({ all: "1" });
    expect(cardFor(all.cards, OLD)).toContain("Unarchive");
    expect(cardFor(all.cards, FRESH)).toContain("Unarchive");
    expect(findAll(all.tree, (el) => el.type === "div" && String((el.props as { className?: string }).className ?? "").includes("eyebrow"))).toHaveLength(1);
  });

  it("a partly archived group still shows its heading and the remaining units", async () => {
    const { me } = await setup(year12Units());
    await env.db.insert(unitArchives).values({ userId: me.id, unitId: OLD });

    const { tree, cards } = await renderCards();
    expect(findAll(tree, (el) => el.type === "div" && String((el.props as { className?: string }).className ?? "").includes("eyebrow"))).toHaveLength(1);
    expect(cardFor(cards, FRESH)).toContain("Fresh fixture");
    expect(textOf(tree)).not.toContain("All units archived");
  });

  it("ignores other students' archives", async () => {
    const { me } = await setup(year12Units());
    const bob = await seedUser(env.db);
    await env.db.insert(unitArchives).values({ userId: bob.id, unitId: OLD });

    const { tree, cards } = await renderCards();
    expect(cardFor(cards, OLD)).toContain(">Archive<"); // still mine to archive
    expect(switchEls(tree)).toHaveLength(1);
    expect(me.id).not.toBe(bob.id);
  });

  it("degraded (database down) shows all units with no buttons, no switch and no error", async () => {
    const { me } = await setup(year12Units());
    await env.db.insert(unitArchives).values({ userId: me.id, unitId: OLD });
    env.databaseDown();

    const { tree, cards } = await renderCards();
    expect(cards).toHaveLength(2); // everything visible
    for (const card of cards) {
      expect(card).not.toContain("Archive");
      expect(card).not.toContain("Unarchive");
    }
    expect(switchEls(tree)).toHaveLength(0);
    expect(textOf(tree)).not.toContain("All units archived");
  });

  it("renders without archive actions, and does not throw, when only the archive load fails", async () => {
    await setup(year12Units());
    env.failAfterCalls(1); // the session lookup succeeds, the archive query fails

    const { tree, cards } = await renderCards();
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      expect(card).not.toContain("Archive");
      expect(card).not.toContain("Unarchive");
    }
    expect(switchEls(tree)).toHaveLength(0);
  });
});
