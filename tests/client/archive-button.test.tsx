// @vitest-environment jsdom
//
// The Archive / Unarchive button on a home-page unit card: label follows the archived flag,
// the request method matches (POST to archive, DELETE to unarchive), and the page refreshes
// only on success.

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: navigation.refresh }),
}));

const UNIT = "y11-physics-preliminary";

let fetchMock: ReturnType<typeof vi.fn>;

function setup(overrides: { ok?: boolean } = {}) {
  const { ok = true } = overrides;
  fetchMock = vi.fn(async () => ({ ok }));
  vi.stubGlobal("fetch", fetchMock);
  navigation.refresh.mockClear();
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function renderButton(archived: boolean) {
  const { ArchiveButton } = await import("@/components/ArchiveButton");
  return render(<ArchiveButton unitId={UNIT} archived={archived} />).getByRole("button");
}

describe("ArchiveButton", () => {
  it("offers Archive on a live unit and Unarchive on an archived one", async () => {
    setup();
    expect((await renderButton(false)).textContent).toBe("Archive");
    cleanup();
    expect((await renderButton(true)).textContent).toBe("Unarchive");
  });

  it("archives with POST and refreshes the page on success", async () => {
    setup();
    const button = await renderButton(false);
    fireEvent.click(button);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(`/api/units/${UNIT}/archive`, { method: "POST" }),
    );
    await waitFor(() => expect(navigation.refresh).toHaveBeenCalledTimes(1));
  });

  it("unarchives with DELETE", async () => {
    setup();
    const button = await renderButton(true);
    fireEvent.click(button);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(`/api/units/${UNIT}/archive`, { method: "DELETE" }),
    );
    await waitFor(() => expect(navigation.refresh).toHaveBeenCalledTimes(1));
  });

  it("does not refresh when the request fails", async () => {
    setup({ ok: false });
    const button = await renderButton(false);
    fireEvent.click(button);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(navigation.refresh).not.toHaveBeenCalled();
  });
});
