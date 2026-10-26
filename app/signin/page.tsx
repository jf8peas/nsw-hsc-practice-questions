import { redirect } from "next/navigation";

import { safeCallbackUrl } from "@/lib/access";
import { auth, signIn } from "@/lib/auth.server";

// Public page (see the reviewed allowlist in tests/auth/route-guard.test.ts).
// It deliberately has no Shell: a visitor who is not signed in sees only this.

const SHOW_DEV_LOGIN = process.env.NODE_ENV !== "production";

async function googleSignIn(formData: FormData) {
  "use server";
  await signIn("google", { redirectTo: safeCallbackUrl(String(formData.get("callbackUrl") ?? "")) });
}

async function devSignIn(formData: FormData) {
  "use server";
  if (process.env.NODE_ENV === "production") return;
  await signIn("dev-login", {
    name: String(formData.get("name") ?? ""),
    redirectTo: safeCallbackUrl(String(formData.get("callbackUrl") ?? "")),
  });
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);

  const session = await auth();
  if (session?.user) redirect(callbackUrl);

  return (
    <main className="signin-page">
      <div className="signin-card rd-card">
        <div className="signin-logo" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="22" height="22">
            <path
              d="M9 16.5 L14 21.5 L23.5 10"
              fill="none"
              stroke="#fff"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="page-h1">NSW HSC Practice</h1>
        <p className="page-sub" style={{ marginBottom: 16 }}>
          Practice quizzes for NSW HSC students: multiple choice and short answer, marked
          against a rubric. Sign in once and your results follow you to any device.
        </p>

        <form action={googleSignIn}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <button type="submit" className="rd-btn primary xl signin-btn">
            Sign in with Google
          </button>
        </form>

        {params.error && (
          <p className="signin-error" role="alert">
            Sign-in did not work. Please try again.
          </p>
        )}

        {SHOW_DEV_LOGIN && (
          <form action={devSignIn} className="signin-dev">
            <div className="eyebrow">Development only</div>
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <input className="rd-input" name="name" placeholder="Dev student name" aria-label="Dev student name" />
            <button type="submit" className="rd-btn signin-btn">
              Dev login
            </button>
          </form>
        )}

        <section className="signin-notice" aria-labelledby="signin-notice-title">
          <h2 id="signin-notice-title" className="eyebrow">
            What we keep
          </h2>
          <ul>
            <li>Your name and email address, from your Google account.</li>
            <li>Your quiz results: each answer, the marks you got and the feedback you saw.</li>
            <li>
              All of it is deleted automatically 2 years after you last used the site, and
              earlier if you ask your teacher.
            </li>
            <li>It is stored in Australia (Sydney) and is not shared.</li>
            <li>
              Short answers are marked by an AI service: the text you type for a short answer is
              sent to a third-party AI provider (OpenRouter) to be marked.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
