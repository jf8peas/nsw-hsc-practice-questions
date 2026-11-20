// The highlight model (spec 008 FR-006a): word snapping, merging, connected highlights across blocks,
// removal, normalisation and the string splitting. Pure; no DOM.

import { describe, expect, it } from "vitest";

import { addHighlight, blockLengths, normalise, parseRanges, removeHighlight, segments, snapToWords, type HlRange } from "@/lib/unseen/highlights";

const L = [20, 12, 30]; // three blocks

describe("snapToWords", () => {
  const s = "The quick brown fox";
  it("moves both ends out to whole words", () => expect(snapToWords(s, 6, 13)).toEqual({ start: 4, end: 15 }));
  it("trims selected spaces before snapping", () => expect(snapToWords(s, 3, 10)).toEqual({ start: 4, end: 9 }));
  it("keeps punctuation with its word", () => expect(snapToWords("Hello, world!", 2, 3)).toEqual({ start: 0, end: 6 }));
  it("gives nothing for an empty or all-space selection", () => {
    expect(snapToWords(s, 5, 5)).toBeNull();
    expect(snapToWords("a   b", 1, 4)).toBeNull();
  });
  it("clips to the string", () => expect(snapToWords(s, -5, 99)).toEqual({ start: 0, end: 19 }));
});

describe("addHighlight", () => {
  it("adds a separate highlight with its own id", () => {
    const a = addHighlight([], [{ block: 0, start: 0, end: 3 }], "a", L);
    const b = addHighlight(a, [{ block: 0, start: 10, end: 14 }], "b", L);
    expect(b).toEqual([
      { id: "a", block: 0, start: 0, end: 3 },
      { id: "b", block: 0, start: 10, end: 14 },
    ]);
  });

  it("merges an overlapping selection into one highlight", () => {
    const a = addHighlight([], [{ block: 0, start: 2, end: 8 }], "a", L);
    expect(addHighlight(a, [{ block: 0, start: 6, end: 12 }], "b", L)).toEqual([{ id: "b", block: 0, start: 2, end: 12 }]);
  });

  it("merges a touching selection (end meets start) into one highlight", () => {
    const a = addHighlight([], [{ block: 0, start: 2, end: 8 }], "a", L);
    expect(addHighlight(a, [{ block: 0, start: 8, end: 12 }], "b", L)).toEqual([{ id: "b", block: 0, start: 2, end: 12 }]);
  });

  it("one new selection can join several existing highlights into one", () => {
    let r: HlRange[] = addHighlight([], [{ block: 0, start: 0, end: 3 }], "a", L);
    r = addHighlight(r, [{ block: 0, start: 10, end: 13 }], "b", L);
    r = addHighlight(r, [{ block: 0, start: 2, end: 11 }], "c", L);
    expect(r).toEqual([{ id: "c", block: 0, start: 0, end: 13 }]);
  });

  it("a selection over two blocks is one connected highlight (one range per block, one id)", () => {
    const r = addHighlight([], [{ block: 0, start: 15, end: 20 }, { block: 1, start: 0, end: 5 }], "x", L);
    expect(r).toEqual([
      { id: "x", block: 0, start: 15, end: 20 },
      { id: "x", block: 1, start: 0, end: 5 },
    ]);
  });

  it("joining a cross-block highlight at one end brings the whole highlight along", () => {
    const first = addHighlight([], [{ block: 0, start: 15, end: 20 }, { block: 1, start: 0, end: 5 }], "x", L);
    const next = addHighlight(first, [{ block: 1, start: 4, end: 9 }], "y", L);
    expect(next).toEqual([
      { id: "y", block: 0, start: 15, end: 20 },
      { id: "y", block: 1, start: 0, end: 9 },
    ]);
  });

  it("does not merge highlights in different blocks that merely sit next to each other", () => {
    const a = addHighlight([], [{ block: 0, start: 15, end: 20 }], "a", L);
    expect(addHighlight(a, [{ block: 1, start: 0, end: 5 }], "b", L).map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("removeHighlight", () => {
  it("removes every range of the connected highlight and leaves the others", () => {
    let r = addHighlight([], [{ block: 0, start: 15, end: 20 }, { block: 1, start: 0, end: 5 }], "x", L);
    r = addHighlight(r, [{ block: 2, start: 3, end: 7 }], "z", L);
    expect(removeHighlight(r, "x")).toEqual([{ id: "z", block: 2, start: 3, end: 7 }]);
  });
  it("an unknown id changes nothing", () => {
    const r = addHighlight([], [{ block: 0, start: 1, end: 4 }], "a", L);
    expect(removeHighlight(r, "nope")).toEqual(r);
  });
});

describe("normalise and parseRanges", () => {
  it("sorts, clips to the block length and drops empty or unknown-block ranges", () => {
    const out = normalise(
      [
        { id: "b", block: 1, start: 5, end: 99 },
        { id: "a", block: 0, start: -4, end: 3 },
        { id: "c", block: 0, start: 7, end: 7 },
        { id: "d", block: 9, start: 0, end: 4 },
      ],
      L,
    );
    expect(out).toEqual([
      { id: "a", block: 0, start: 0, end: 3 },
      { id: "b", block: 1, start: 5, end: 12 },
    ]);
  });
  it("reads back only well-formed entries", () => {
    expect(parseRanges("nope", L)).toEqual([]);
    expect(parseRanges([{ id: "a", block: 0, start: 1, end: 2 }, { id: 7 }, null, { id: "b", block: 0, start: "1", end: 2 }], L)).toEqual([{ id: "a", block: 0, start: 1, end: 2 }]);
  });
});

describe("segments and blockLengths", () => {
  it("cuts a block's string into plain and highlighted segments", () => {
    expect(segments("abcdefghij", [{ id: "a", block: 0, start: 2, end: 4 }, { id: "b", block: 0, start: 7, end: 9 }])).toEqual([
      { text: "ab" },
      { text: "cd", id: "a" },
      { text: "efg" },
      { text: "hi", id: "b" },
      { text: "j" },
    ]);
  });
  it("is the whole string when there are no highlights", () => expect(segments("abc", [])).toEqual([{ text: "abc" }]));
  it("numbers the body's blocks first and the footnotes after them", () => {
    expect(blockLengths({ body: { kind: "poem", stanzas: [["ab", "cde"], ["f"]] }, footnotes: [{ text: "xyz" }] })).toEqual([2, 3, 1, 3]);
    expect(blockLengths({ body: { kind: "prose", paragraphs: ["abcd"] } })).toEqual([4]);
    expect(blockLengths({ body: { kind: "image" } })).toEqual([]);
  });
});
