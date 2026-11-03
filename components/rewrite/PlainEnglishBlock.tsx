/**
 * The PLAIN ENGLISH block (spec 006 FR-003): a surface-50 panel with a mono uppercase label and
 * the sentence at 19 px / 1.55. The component accepts only the sentence string, so it can never
 * highlight, underline or bold any word of the plain-English sentence in any state.
 */
export function PlainEnglishBlock({ sentence }: { sentence: string }) {
  return (
    <div className="rw-plain">
      <span className="rw-plain-label">Plain English</span>
      <p className="rw-plain-text">{sentence}</p>
    </div>
  );
}