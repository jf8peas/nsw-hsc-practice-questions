# Agent scratch space

Throwaway files written while working — temporary shell scripts, one-off diagnostic scripts, log
dumps. **Everything in here except this README is gitignored**, so nothing started here can be
committed by accident.

Rules:

- Name files by purpose and prefix with `tmp`: `tmp-shell-check.sh`, `tmp-count-users.mjs`.
- Delete them when the task is done (or leave them if the work is still in progress, then clean up).
- Never put secrets here — it is inside the repo and may be synced or copied.
- Not a place for real code, fixtures or tests. Those belong in `scripts/`, `tests/` or `lib/`.

Why a folder at all: commands run through Git Bash, and writing a script file avoids the fragile
inner-double-quote handling of inline `bash -c` payloads. See `.clinerules/shell.md` and
`CLAUDE.md` → `## Shell`.
