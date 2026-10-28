// @vitest-environment jsdom
//
// ConceptLive: asks the server to start preparing content once, then checks cheaply until
// nothing is running, and refreshes the page once per change (spec 002 FR-021, research R6).

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConceptLive } from "@/components/ConceptLive";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

const fetchMock = vi.fn();
let hidden = false;

type Reply = { pending: boolean; version: string } | "fail";
let replies: Record<string, Reply[]> = {};

function reply(url: string): Response {
  const key = url.includes("/ensure") ? "ensure" : "status";
  const next = replies[key]?.shift();
  if (next === undefined || next === "fail") return new Response("{}", { status: 503 });
  return new Response(JSON.stringify(next), { status: 200 });
}

beforeEach(() => {
  vi.useFakeTimers();
  refresh.mockClear();
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string) => reply(url));
  vi.stubGlobal("fetch", fetchMock);
  hidden = false;
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  replies = {};
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const props = { unitId: "u1", needsContent: true, initialPending: false, initialVersion: "0" };
const calls = (what: string) => fetchMock.mock.calls.filter((c) => String(c[0]).includes(what));
const tick = (ms: number) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)));

describe("ConceptLive", () => {
  it("renders nothing visible", () => {
    replies.ensure = [{ pending: false, version: "0" }];
    const { container } = render(<ConceptLive {...props} />);
    expect(container.innerHTML).toBe("");
  });

  it("asks the server to start once on mount, only when content is needed", async () => {
    replies.ensure = [{ pending: false, version: "0" }];
    render(<ConceptLive {...props} />);
    await tick(0);
    expect(calls("/ensure")).toHaveLength(1);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST" });
    expect(String(fetchMock.mock.calls[0][0])).toBe("/api/units/u1/concepts/ensure");
  });

  it("does nothing at all when no content is needed and nothing is running", async () => {
    render(<ConceptLive {...props} needsContent={false} />);
    await tick(60_000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("polls without starting anything when work was already running", async () => {
    replies.status = [{ pending: false, version: "0" }];
    render(<ConceptLive {...props} needsContent={false} initialPending />);
    await tick(5_000);
    expect(calls("/ensure")).toHaveLength(0);
    expect(calls("/status")).toHaveLength(1);
  });

  it("polls every 5 seconds, easing to 15, while work is pending", async () => {
    replies.ensure = [{ pending: true, version: "0" }];
    replies.status = Array.from({ length: 12 }, () => ({ pending: true, version: "0" }));
    render(<ConceptLive {...props} />);
    await tick(0);
    expect(calls("/status")).toHaveLength(0);
    await tick(5_000);
    expect(calls("/status")).toHaveLength(1);
    await tick(7_500); // second poll after 1.5 x 5 s
    expect(calls("/status")).toHaveLength(2);
    await tick(11_250); // third after 1.5 x 7.5 s
    expect(calls("/status")).toHaveLength(3);
    // eventually the gap is capped at 15 s
    await tick(15_000 * 4);
    expect(calls("/status").length).toBeGreaterThanOrEqual(6);
  });

  it("stops polling as soon as the server says nothing is running", async () => {
    replies.ensure = [{ pending: true, version: "0" }];
    replies.status = [{ pending: false, version: "0" }];
    render(<ConceptLive {...props} />);
    await tick(5_000);
    expect(calls("/status")).toHaveLength(1);
    await tick(120_000);
    expect(calls("/status")).toHaveLength(1);
  });

  it("gives up after 3 minutes even if work is still pending", async () => {
    replies.ensure = [{ pending: true, version: "0" }];
    replies.status = Array.from({ length: 100 }, () => ({ pending: true, version: "0" }));
    render(<ConceptLive {...props} />);
    await tick(3 * 60_000 + 20_000);
    const seen = calls("/status").length;
    expect(seen).toBeGreaterThan(3);
    await tick(10 * 60_000);
    expect(calls("/status").length).toBe(seen);
  });

  it("does not poll while the tab is hidden, and resumes when it is visible again", async () => {
    replies.ensure = [{ pending: true, version: "0" }];
    replies.status = Array.from({ length: 20 }, () => ({ pending: true, version: "0" }));
    hidden = true;
    render(<ConceptLive {...props} />);
    await tick(40_000);
    expect(calls("/status")).toHaveLength(0);
    hidden = false;
    await tick(16_000);
    expect(calls("/status").length).toBeGreaterThanOrEqual(1);
  });

  it("refreshes the page exactly once per change of version, and not when it is unchanged", async () => {
    replies.ensure = [{ pending: true, version: "0" }];
    replies.status = [
      { pending: true, version: "0" }, // unchanged
      { pending: true, version: "abc" }, // changed -> refresh
      { pending: true, version: "abc" }, // same again -> no second refresh
      { pending: false, version: "def" }, // changed again -> refresh, then stop
    ];
    render(<ConceptLive {...props} />);
    await tick(5_000);
    expect(refresh).not.toHaveBeenCalled();
    await tick(7_500);
    expect(refresh).toHaveBeenCalledTimes(1);
    await tick(11_250);
    expect(refresh).toHaveBeenCalledTimes(1);
    await tick(15_000);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("refreshes straight away if the first answer already shows new content", async () => {
    replies.ensure = [{ pending: false, version: "xyz" }];
    render(<ConceptLive {...props} />);
    await tick(0);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("copes with a failing server: no refresh, no crash, and it keeps trying then stops", async () => {
    replies.ensure = ["fail"];
    render(<ConceptLive {...props} initialPending />);
    await tick(60_000);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("stops everything when the page is left", async () => {
    replies.ensure = [{ pending: true, version: "0" }];
    replies.status = Array.from({ length: 20 }, () => ({ pending: true, version: "0" }));
    const { unmount } = render(<ConceptLive {...props} />);
    await tick(5_000);
    const seen = calls("/status").length;
    unmount();
    await tick(60_000);
    expect(calls("/status").length).toBe(seen);
  });
});
