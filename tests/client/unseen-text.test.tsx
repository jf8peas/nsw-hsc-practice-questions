// @vitest-environment jsdom
//
// How the unseen text is shown (spec 008 FR-002 to FR-004): the heading, title, author and source line
// first; a poem with its stanzas and line numbers only where the paper has them; prose paragraphs; the
// paper's footnotes; and a visual text as an image from the authenticated route with a zoom dialog.

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TextPanel } from "@/components/unseen/Text";
import type { UnseenText } from "@/lib/types";

afterEach(cleanup);

const base = { id: "t1", author: "A. Poet", sourceLine: "From a 2020 collection", hscChecked: "2026-11-19" } as const;
const poem = (lineNumbers?: { every: number }): UnseenText => ({
  ...base,
  form: "poem",
  heading: "Text 1 – Poem",
  title: "Platform",
  body: { kind: "poem", stanzas: [["one", "two", "three"], ["four", "five", "six", "seven"]], ...(lineNumbers ? { lineNumbers } : {}) },
  footnotes: [{ mark: "*", text: "tide: the sea" }],
});

describe("the heading block", () => {
  it("shows the heading, title, author and source line before the body", () => {
    const { container } = render(<TextPanel text={poem()} />);
    const order = ["Text 1 – Poem", "Platform", "A. Poet", "From a 2020 collection", "one"];
    const html = container.textContent ?? "";
    let last = -1;
    for (const part of order) {
      const at = html.indexOf(part);
      expect(at, part).toBeGreaterThan(last);
      last = at;
    }
    expect(screen.getByRole("heading", { name: "Platform" })).toBeTruthy();
  });
});

describe("a text the paper gives no title", () => {
  it("shows its heading once, as the title, with the author and source line", () => {
    const text: UnseenText = { ...base, form: "prose-fiction", heading: "Text 2 – Short Story Extract", title: "", body: { kind: "prose", paragraphs: ["A paragraph."] } };
    const { container } = render(<TextPanel text={text} />);
    expect(screen.getByRole("heading", { name: "Text 2 – Short Story Extract" })).toBeTruthy();
    expect(container.textContent!.split("Text 2 – Short Story Extract").length - 1).toBe(1);
    expect(container.textContent).toContain("A. Poet");
  });
});

describe("a poem", () => {
  it("keeps every line and stanza break", () => {
    const { container } = render(<TextPanel text={poem()} />);
    const stanzas = container.querySelectorAll(".un-stanza");
    expect(stanzas).toHaveLength(2);
    expect([...stanzas[0].querySelectorAll(".un-lt")].map((l) => l.textContent)).toEqual(["one", "two", "three"]);
    expect([...stanzas[1].querySelectorAll(".un-lt")].map((l) => l.textContent)).toEqual(["four", "five", "six", "seven"]);
  });

  it("shows no line numbers when the paper has none", () => {
    const { container } = render(<TextPanel text={poem()} />);
    expect([...container.querySelectorAll(".un-ln")].every((n) => n.textContent === "")).toBe(true);
  });

  it("shows the paper's line numbers (every 5th line, counting across stanzas) and hides them from assistive technology", () => {
    const { container } = render(<TextPanel text={poem({ every: 5 })} />);
    const nums = [...container.querySelectorAll(".un-ln")];
    expect(nums.map((n) => n.textContent)).toEqual(["", "", "", "", "5", "", ""]);
    expect(nums.every((n) => n.getAttribute("aria-hidden") === "true")).toBe(true);
  });
});

describe("prose and footnotes", () => {
  it("keeps paragraphs and shows the paper's footnotes", () => {
    const text: UnseenText = {
      ...base, form: "prose-fiction", heading: "Text 2 – Short Story Extract", title: "Harbour",
      body: { kind: "prose", paragraphs: ["First paragraph.", "Second paragraph."] },
      footnotes: [{ mark: "*", text: "tide: the sea" }],
    };
    const { container } = render(<TextPanel text={text} />);
    expect([...container.querySelectorAll(".un-prose p")].map((p) => p.textContent)).toEqual(["First paragraph.", "Second paragraph."]);
    expect(screen.getByLabelText("Notes from the paper").textContent).toContain("tide: the sea");
  });
});

describe("a visual text", () => {
  const visual: UnseenText = {
    ...base, form: "visual", heading: "Text 1 – Image", title: "Table", author: "B. Artist",
    body: { kind: "image", image: "vis-1", alt: "A black and white line drawing" },
  };

  it("shows the image from the authenticated route, with a neutral alt and a Zoom button", () => {
    render(<TextPanel text={visual} />);
    const img = screen.getByAltText("A black and white line drawing") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/api/unseen/image/vis-1");
    expect(screen.getByRole("button", { name: "Zoom" })).toBeTruthy();
  });

  it("opens a zoom dialog with Zoom in, Zoom out and Close, steps the size, and gives focus back on close", () => {
    render(<TextPanel text={visual} />);
    const zoom = screen.getByRole("button", { name: "Zoom" });
    zoom.focus();
    fireEvent.click(zoom);
    const dialog = document.querySelector("dialog.un-zoom-dialog") as HTMLDialogElement;
    expect(dialog.hasAttribute("open")).toBe(true);
    const inside = within(dialog);
    const big = dialog.querySelector(".un-zoom-image") as HTMLImageElement;
    expect(big.style.width).toBe("100%");
    expect((inside.getByRole("button", { name: "Zoom out" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(inside.getByRole("button", { name: "Zoom in" }));
    expect(big.style.width).toBe("150%");
    fireEvent.click(inside.getByRole("button", { name: "Zoom in" }));
    fireEvent.click(inside.getByRole("button", { name: "Zoom in" }));
    expect(big.style.width).toBe("300%");
    expect((inside.getByRole("button", { name: "Zoom in" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(inside.getByRole("button", { name: "Close" }));
    expect(dialog.hasAttribute("open")).toBe(false);
    expect(document.activeElement).toBe(zoom);
  });

  it("never carries a description anywhere in the page", () => {
    const { container } = render(<TextPanel text={visual} />);
    expect(container.innerHTML).not.toMatch(/description/i);
  });
});
