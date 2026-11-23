// A dependency-free port of CPython's `difflib.SequenceMatcher(None, a, b).ratio()` for strings (spec 011, research
// R10, contracts/quote-check.md §3). The quote check's near-match threshold was calibrated on the Python pilot, so
// this reproduces its arithmetic exactly: recursive longest matching blocks, `find_longest_match` with the
// "autojunk" popular-element rule for a second sequence of 200 or more elements, and `ratio = 2*M/T`. Strings are
// iterated by Unicode code point (as Python iterates a str), not by UTF-16 unit. Pure: no I/O, safe anywhere.
//
// Two implementations of find_longest_match give identical results. Below 200 elements in `b` (every quotation window in
// practice) no element is "popular", so CPython's b2j walk is equivalent to a plain longest-common-substring scan in the
// same i-then-j order with the same strict `>` update, which is much cheaper in JavaScript. From 200 elements the
// popular-element rule changes which matches are found, so the faithful b2j port is used.

type Seq = Int32Array;

const codePoints = (s: string): Seq => {
  const out: number[] = [];
  for (const ch of s) out.push(ch.codePointAt(0)!);
  return Int32Array.from(out);
};

type Longest = (alo: number, ahi: number, blo: number, bhi: number) => [number, number, number];

/** find_longest_match when no element of b is popular (b has fewer than 200 elements). */
function plainLongest(a: Seq, b: Seq): Longest {
  let prev = new Int32Array(b.length + 1);
  let cur = new Int32Array(b.length + 1);
  return (alo, ahi, blo, bhi) => {
    let besti = alo;
    let bestj = blo;
    let bestsize = 0;
    const width = bhi - blo;
    prev.fill(0, 0, width + 1);
    for (let i = alo; i < ahi; i++) {
      const ai = a[i]!;
      cur[0] = 0;
      for (let jj = 0; jj < width; jj++) {
        if (ai === b[blo + jj]) {
          const k = prev[jj]! + 1;
          cur[jj + 1] = k;
          if (k > bestsize) {
            besti = i - k + 1;
            bestj = blo + jj - k + 1;
            bestsize = k;
          }
        } else {
          cur[jj + 1] = 0;
        }
      }
      const t = prev;
      prev = cur;
      cur = t;
    }
    return [besti, bestj, bestsize];
  };
}

/** find_longest_match with the autojunk rule: popular elements are unindexed and only extend a found match. */
function indexedLongest(a: Seq, b: Seq): Longest {
  const b2j = new Map<number, number[]>();
  for (let j = 0; j < b.length; j++) {
    const list = b2j.get(b[j]!);
    if (list) list.push(j);
    else b2j.set(b[j]!, [j]);
  }
  if (b.length >= 200) {
    const ntest = Math.floor(b.length / 100) + 1;
    for (const [elt, idxs] of b2j) if (idxs.length > ntest) b2j.delete(elt);
  }
  return (alo, ahi, blo, bhi) => {
    let besti = alo;
    let bestj = blo;
    let bestsize = 0;
    let j2len = new Map<number, number>();
    for (let i = alo; i < ahi; i++) {
      const newj2len = new Map<number, number>();
      const idxs = b2j.get(a[i]!);
      if (idxs) {
        for (const j of idxs) {
          if (j < blo) continue;
          if (j >= bhi) break;
          const k = (j2len.get(j - 1) ?? 0) + 1;
          newj2len.set(j, k);
          if (k > bestsize) {
            besti = i - k + 1;
            bestj = j - k + 1;
            bestsize = k;
          }
        }
      }
      j2len = newj2len;
    }
    // Extend the match over equal neighbours (this is what lets popular elements join a match). There is no junk set.
    while (besti > alo && bestj > blo && a[besti - 1] === b[bestj - 1]) {
      besti--;
      bestj--;
      bestsize++;
    }
    while (besti + bestsize < ahi && bestj + bestsize < bhi && a[besti + bestsize] === b[bestj + bestsize]) bestsize++;
    return [besti, bestj, bestsize];
  };
}

/** The matching-block total M of a and b, as CPython's get_matching_blocks sums it. */
function matchedCount(a: Seq, b: Seq): number {
  const longest = b.length >= 200 ? indexedLongest(a, b) : plainLongest(a, b);
  let total = 0;
  const queue: Array<[number, number, number, number]> = [[0, a.length, 0, b.length]];
  while (queue.length > 0) {
    const [alo, ahi, blo, bhi] = queue.pop()!;
    const [i, j, k] = longest(alo, ahi, blo, bhi);
    if (k > 0) {
      total += k;
      if (alo < i && blo < j) queue.push([alo, i, blo, j]);
      if (i + k < ahi && j + k < bhi) queue.push([i + k, ahi, j + k, bhi]);
    }
  }
  return total;
}

/** `SequenceMatcher(None, a, b).ratio()`: 2*M/T, or 1 when both are empty. */
export function sequenceRatio(a: string, b: string): number {
  const x = codePoints(a);
  const y = codePoints(b);
  const t = x.length + y.length;
  if (t === 0) return 1;
  return (2 * matchedCount(x, y)) / t;
}
