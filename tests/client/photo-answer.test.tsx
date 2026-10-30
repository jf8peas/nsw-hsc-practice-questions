// @vitest-environment jsdom
//
// The photo answer flow in the quiz: Photo mode toggle, capture, read-back,
// accept/retake, and reload survival (specs/004-photo-answers, TASK-203).

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Quiz } from "@/components/Quiz";
import { savePhotoDraft, type AttemptPayload } from "@/lib/drafts";
import type { Question } from "@/lib/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));
vi.mock("@/lib/navigation", () => ({ reloadPage: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const UID = "6f0b6a53-3a39-4a3e-8d5b-0b2f6f3c9d11";
const ATTEMPT = "22222222-3a39-4a3e-8d5b-0b2f6f3c9d11";
const UNIT = "y11-physics-preliminary";

const SHORT: Question = {
  id: `${UNIT}.s01`,
  type: "short",
  prompt: "State Newton's second law.",
  maxMarks: 2,
};

const payload = (over: Partial<AttemptPayload> = {}): AttemptPayload => ({
  attemptToken: "TOKEN-1",
  unitId: UNIT,
  passMark: 70,
  questions: [SHORT],
  answered: {},
  ...over,
});

type FetchCall = { url: string; body: unknown };
let calls: FetchCall[];
let responder: (url: string, body: unknown) => Response | Promise<Response>;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
  calls = [];
  responder = () => json({});
  push.mockClear();
  window.sessionStorage.clear();
  window.localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const body =
        init?.body instanceof FormData ? init.body : init?.body ? JSON.parse(String(init.body)) : {};
      calls.push({ url: String(url), body });
      return responder(String(url), body);
    }),
  );
  // Photo resize stubs: jsdom has no canvas or createImageBitmap.
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(async () => ({ width: 100, height: 100, close: () => {} })),
  );
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    value: () => ({ drawImage: () => {} }),
    configurable: true,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
    value: () => "data:image/jpeg;base64,QUJD",
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const mount = (initial: AttemptPayload | null = payload()) =>
  render(<Quiz uid={UID} attemptId={ATTEMPT} unitId={UNIT} initial={initial} />);

const pickPhoto = async () => {
  const input = screen.getByTestId("photo-input");
  const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "photo.jpg", { type: "image/jpeg" });
  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } });
  });
};

describe("photo answer flow", () => {
  it("offers Type and Photo modes on a short-answer question", () => {
    mount();
    expect(screen.getByRole("tab", { name: "Type" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Photo" })).toBeTruthy();
    expect(screen.getByPlaceholderText("Type your answer here...")).toBeTruthy();
  });

  it("captures a photo, shows a thumbnail, and checks the answer through /api/transcribe", async () => {
    responder = (url) => {
      if (url === "/api/transcribe") {
        return json({
          transcription: "F = ma",
          transcriptionHtml: "F = ma",
          transcriptionToken: "TX-1",
          readCount: 1,
          reservedSlot: { userId: UID, sydneyDate: "2026-10-29" },
        });
      }
      return json({});
    };
    mount();
    fireEvent.click(screen.getByRole("tab", { name: "Photo" }));
    await pickPhoto();

    await waitFor(() => expect(screen.getByText(/Add another photo/)).toBeTruthy());
    fireEvent.click(screen.getByTestId("check-answer"));

    await waitFor(() => expect(screen.getByText("What we read from your photos")).toBeTruthy());
    expect(screen.getByText("F = ma")).toBeTruthy();
    const transcribeCall = calls.find((c) => c.url === "/api/transcribe");
    expect(transcribeCall).toBeTruthy();
    expect(transcribeCall!.body).toBeInstanceOf(FormData);
  });

  it("accepts the read-back and grades with the transcription token", async () => {
    responder = (url) => {
      if (url === "/api/transcribe") {
        return json({
          transcription: "F = ma",
          transcriptionHtml: "F = ma",
          transcriptionToken: "TX-1",
          readCount: 1,
        });
      }
      if (url === "/api/grade") {
        return json({
          result: {
            questionId: SHORT.id,
            type: "short",
            maxMarks: 2,
            marksAwarded: 2,
            feedback: "Good working.",
            needsSelfMark: false,
          },
          saved: true,
          attemptCompleted: true,
        });
      }
      return json({});
    };
    mount();
    fireEvent.click(screen.getByRole("tab", { name: "Photo" }));
    await pickPhoto();
    fireEvent.click(screen.getByTestId("check-answer"));
    await waitFor(() => expect(screen.getByTestId("accept-readback")).toBeTruthy());

    fireEvent.click(screen.getByTestId("accept-readback"));
    await waitFor(() => expect(screen.getByText("2 / 2 marks")).toBeTruthy());

    const gradeCall = calls.find((c) => c.url === "/api/grade");
    const body = gradeCall!.body as Record<string, unknown>;
    expect(body.transcriptionToken).toBe("TX-1");
    expect(String(body.answer)).toContain("<<<TRANSCRIPTION>>>");
  });

  it("retake clears the read-back and shows the photo panel again", async () => {
    responder = (url) => {
      if (url === "/api/transcribe") {
        return json({
          transcription: "F = ma",
          transcriptionHtml: "F = ma",
          transcriptionToken: "TX-1",
          readCount: 1,
        });
      }
      return json({});
    };
    mount();
    fireEvent.click(screen.getByRole("tab", { name: "Photo" }));
    await pickPhoto();
    fireEvent.click(screen.getByTestId("check-answer"));
    await waitFor(() => expect(screen.getByTestId("retake-readback")).toBeTruthy());

    fireEvent.click(screen.getByTestId("retake-readback"));
    await waitFor(() => expect(screen.getByTestId("check-answer")).toBeTruthy());
    expect(screen.queryByText("What we read from your photos")).toBeNull();
  });

  it("restores a saved read-back on reload without another transcribe call", async () => {
    savePhotoDraft(ATTEMPT, SHORT.id, {
      attemptId: ATTEMPT,
      questionId: SHORT.id,
      transcription: "F = ma",
      transcriptionHtml: "F = ma",
      transcriptionToken: "TX-1",
      readCount: 1,
    });
    mount();
    await waitFor(() => expect(screen.getByText("What we read from your photos")).toBeTruthy());
    expect(calls.some((c) => c.url === "/api/transcribe")).toBe(false);
  });

  it("shows a retake prompt when the read is illegible", async () => {
    responder = (url) => {
      if (url === "/api/transcribe") {
        return json({ error: "illegible" }, 400);
      }
      return json({});
    };
    mount();
    fireEvent.click(screen.getByRole("tab", { name: "Photo" }));
    await pickPhoto();
    fireEvent.click(screen.getByTestId("check-answer"));
    await waitFor(() =>
      expect(screen.getByText("We couldn't read this clearly. Please retake the photo.")).toBeTruthy(),
    );
  });
});