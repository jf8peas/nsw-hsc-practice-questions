import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.doUnmock("next/server");
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("runInBackground", () => {
  it("hands the work to after() when there is a request scope", async () => {
    const afterSpy = vi.fn((cb: () => unknown) => void cb());
    vi.doMock("next/server", () => ({ after: afterSpy }));
    const { runInBackground } = await import("@/lib/background.server");

    const work = vi.fn(async () => {});
    runInBackground(work);

    expect(afterSpy).toHaveBeenCalledTimes(1);
    expect(work).toHaveBeenCalledTimes(1);
  });

  it("runs the work as a detached promise when after() has no request scope", async () => {
    vi.doMock("next/server", () => ({
      after: () => {
        throw new Error("`after` was called outside a request scope");
      },
    }));
    const { runInBackground, settleBackground } = await import("@/lib/background.server");

    let finished = false;
    runInBackground(async () => {
      await new Promise((r) => setTimeout(r, 5));
      finished = true;
    });
    expect(finished).toBe(false); // not awaited by the caller
    await settleBackground();
    expect(finished).toBe(true);
  });

  it("logs a rejection and never throws, in either path", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.doMock("next/server", () => ({
      after: () => {
        throw new Error("no scope");
      },
    }));
    const { runInBackground, settleBackground } = await import("@/lib/background.server");

    expect(() =>
      runInBackground(async () => {
        throw new Error("boom");
      }),
    ).not.toThrow();
    await settleBackground();
    expect(log).toHaveBeenCalled();

    vi.resetModules();
    log.mockClear();
    vi.doMock("next/server", () => ({ after: (cb: () => unknown) => void cb() }));
    const again = await import("@/lib/background.server");
    expect(() =>
      again.runInBackground(async () => {
        throw new Error("boom again");
      }),
    ).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
    expect(log).toHaveBeenCalled();
  });
});
