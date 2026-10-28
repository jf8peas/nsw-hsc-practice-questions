# NSW HSC Practice

Next.js 15 (App Router, React 19, TypeScript) practice-quiz app on Vercel. See `README.md` for how
the project is put together and `.specify/memory/constitution.md` for the rules every change must
respect (it overrides other docs).

<!-- SPECKIT START -->
Current feature plan: [specs/002-learn-from-mistakes/plan.md](specs/002-learn-from-mistakes/plan.md)
(spec, research, data model, contracts and quickstart live beside it).
<!-- SPECKIT END -->

## Shell

**Standing preference: run *all* shell commands through Git Bash, not just POSIX ones.** The user
reads bash more easily than PowerShell, so `git`, `npm`, `node`, `npx`, test and script invocations
should all be handed to Git Bash too, not only `grep`/`sed`/`find` pipelines. The concise version of
this rule lives in `.clinerules/shell.md`, which Cline loads automatically each session; keep the two
in sync.

The agent's command tool always spawns PowerShell, so Git Bash is reached by wrapping the payload:

```powershell
& 'C:\Program Files\Git\bin\bash.exe' -c 'git status --short; npm test 2>&1 | tail -20'
```

- **Always use the full path.** Bare `bash` resolves to `C:\Windows\System32\bash.exe`, which is the
  WSL launcher (`uname -s` → `Linux`, repo at `/mnt/c/Users/johnf/Git/...`), not Git Bash
  (`MINGW64_NT-10.0-26200`, repo at `/c/Users/johnf/Git/...`). It has its own git/node and runs as a
  different user, so results would not match the Windows checkout.
- Verified working through Git Bash: `node -v` (v24.14.0), `npm -v` (11.9.0), `npx`, `git`
  (2.53.0.windows.2), `npm test` (vitest 5.0.5), `npm run <script>`. npm itself shells out to
  `cmd.exe` internally, so npm scripts behave exactly as they do in a Git Bash window.
- `-c` is the default; `-lc` additionally sources `/etc/profile` (closer to a real Git Bash window,
  slower).
- Keep the payload in PowerShell **single** quotes and **never use inner double quotes** — they are
  stripped before bash sees them, truncating the command and leaking the remainder into the pipeline.
  Seen in practice: `grep -i -E "cline|rules" .gitignore` became `grep -i -E cline|rules .gitignore`
  and actually executed `rules`. Use separate `-e` flags, unquoted words, `$(...)`, or a script file.
  `$VAR` does survive and expands in bash (`-c 'X=42; echo val=$X'` → `val=42`).
- Nested quoting is fragile in general — for anything non-trivial write a script into the scratch
  folder and run `& 'C:\Program Files\Git\bin\bash.exe' -c 'bash .cline/tmp-script.sh'`, then delete
  it (verified).
- Each call is a fresh shell: no `cd`, exports or venv state carries over. Chain with `&&` / `;` in
  one payload, and remember the repo path is `/c/Users/johnf/Git/nsw-hsc-practice-questions`.

**Scratch space: `.cline/`.** Temporary working files — one-off `.sh`/`.mjs` scripts, diagnostic
dumps, log captures — go in `.cline/` at the repo root, never in the repo root itself or in a source
folder. Its contents are gitignored (`/.cline/*` with `!/.cline/README.md`), so nothing written there
can be committed by accident, and `git status` stays clean. Name them `tmp-<purpose>.<ext>` and delete
them once the task is done.
