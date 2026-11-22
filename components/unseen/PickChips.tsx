"use client";

import type { ComparativeChoice, UnseenText } from "@/lib/types";

// The pick on a comparative choice question (spec 009 FR-008 to FR-010, research R5): one toggle chip per text the
// student may choose from, named as on the paper; the fixed text is shown as already included and is not a chip.
// A chip's state is `aria-pressed` and a tick plus the word "Chosen", never colour alone. Every chip is at least
// 44 px. While the pick can still change it is a group of buttons; once the first try is submitted (or on the retry
// and the discussion) it is read-only text, because the pick is fixed from the first submission on.

export function PickChips({
  texts,
  choice,
  pick,
  locked,
  onChange,
}: {
  texts: readonly UnseenText[];
  choice: ComparativeChoice;
  pick: readonly string[];
  /** Read-only: the first try is submitted. */
  locked: boolean;
  onChange: (next: string[]) => void;
}) {
  const heading = (id: string) => texts.find((t) => t.id === id)?.heading ?? id;
  const fixed = choice.fixed.map(heading);
  const need = choice.pick;
  const label = `Choose ${need === 1 ? "one text" : `${need} texts`} to write about`;

  if (locked) {
    return (
      <section className="un-pick" aria-label="The texts you wrote about">
        <p className="un-pick-title">You wrote about</p>
        <ul className="un-pick-list">
          {[...choice.fixed, ...pick].map((id) => (
            <li key={id} className="un-chip chosen readonly">
              <span aria-hidden="true">✓ </span>
              {heading(id)}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  function toggle(id: string) {
    if (pick.includes(id)) onChange(pick.filter((p) => p !== id));
    else if (need === 1) onChange([id]);
    else if (pick.length < need) onChange([...pick, id]);
    else onChange([...pick.slice(1), id]); // at the limit, a new choice replaces the oldest
  }

  return (
    <section className="un-pick" aria-labelledby="un-pick-title">
      <p id="un-pick-title" className="un-pick-title">
        {label}
      </p>
      {fixed.length > 0 && <p className="un-pick-fixed">Always included: {fixed.join(" and ")}</p>}
      <div role="group" aria-labelledby="un-pick-title" className="un-pick-list">
        {choice.from.map((id) => {
          const on = pick.includes(id);
          return (
            <button key={id} type="button" className={`un-chip${on ? " chosen" : ""}`} aria-pressed={on} onClick={() => toggle(id)}>
              {on && <span aria-hidden="true">✓ </span>}
              {heading(id)}
              {on && <span className="un-chip-state"> · Chosen</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
