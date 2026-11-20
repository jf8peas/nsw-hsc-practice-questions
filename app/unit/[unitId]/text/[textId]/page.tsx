import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Shell } from "@/components/Shell";
import { TextPanel } from "@/components/unseen/Text";
import { getUnit } from "@/content";
import { requirePageUser } from "@/lib/auth.server";
import { load } from "@/lib/db/queries/history.server";
import { attemptUsesText, hasStartedText } from "@/lib/db/queries/unseen-progress.server";

// The text of an unseen-text question on its own page, opened in a new tab from the quiz so the student can
// put it beside the answer (spec 008 FR-006, research R12). It shows ONLY the public text: heading, title,
// author, source line, the body (poem, prose or the zoomable image from the authenticated image route) and the
// footnotes. It carries no question, answer box, description, criteria, notes or model answer.
//
// Access (constitution Principles I and II): sign-in is required (requirePageUser redirects), and the text
// renders only if the student has an attempt on a question that uses it. Anything else is the same 404, so
// the page never reveals whether a text exists.

const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function publicText(unitId: string, textId: string) {
  if (!ID_RE.test(textId)) return null;
  return getUnit(unitId)?.texts?.find((t) => t.id === textId) ?? null;
}

/** The tab title is only the heading and title of a text the student may open; anyone else gets a neutral title. */
export async function generateMetadata({ params }: { params: Promise<{ unitId: string; textId: string }> }): Promise<Metadata> {
  const { unitId, textId } = await params;
  const { user, degraded } = await requirePageUser();
  const text = publicText(unitId, textId);
  const unit = getUnit(unitId);
  if (!text || !unit || degraded) return { title: "Text", robots: { index: false } };
  const started = await load((db) => hasStartedText(db, user.id, unit, textId));
  if (started.status !== "ok" || !started.data) return { title: "Text", robots: { index: false } };
  return { title: text.title ? `${text.heading} – ${text.title}` : text.heading, robots: { index: false } };
}

export default async function TextPage({
  params,
  searchParams,
}: {
  params: Promise<{ unitId: string; textId: string }>;
  searchParams?: Promise<{ attempt?: string | string[] }>;
}) {
  const { user, degraded } = await requirePageUser();
  const { unitId, textId } = await params;
  const unit = getUnit(unitId);
  const text = publicText(unitId, textId);
  if (!unit || !text) notFound();
  if (degraded) return <TextUnavailable />;
  const started = await load((db) => hasStartedText(db, user.id, unit, textId));
  if (started.status === "unavailable") return <TextUnavailable />;
  if (!started.data) notFound();
  // Highlights are kept per attempt: the quiz puts its attempt id in the link. Without a valid one (the id is not
  // this student's, or does not hold a question on this text) the text still shows, with highlighting off.
  const raw = (await searchParams)?.attempt;
  const attemptId = typeof raw === "string" && UUID_RE.test(raw) ? raw : null;
  const linked = attemptId ? await load((db) => attemptUsesText(db, user.id, unit, attemptId, textId)) : null;
  const attemptOk = Boolean(attemptId && linked?.status === "ok" && linked.data);
  return (
    <Shell>
      <div className="un-textpage">
        <TextPanel
          text={text}
          highlight={attemptOk && attemptId ? { userId: user.id, attemptId } : null}
          highlightNote="Highlighting is off here: open this text from its quiz (the link there carries your attempt)."
        />
      </div>
    </Shell>
  );
}

function TextUnavailable() {
  return (
    <Shell>
      <p className="pg-notice" role="status">
        The text can&apos;t be loaded right now. Close this tab and try again in a moment.
      </p>
    </Shell>
  );
}
