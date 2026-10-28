# Shell: use Git Bash for every command

The user reads bash more easily than PowerShell. Run **all** shell commands — `git`, `npm`, `node`,
`npx`, tests, scripts, and POSIX pipelines — through Git Bash, not PowerShell.

The command tool always spawns PowerShell, so wrap the payload:

```powershell
& 'C:\Program Files\Git\bin\bash.exe' -c 'git status --short; npm test 2>&1 | tail -20'
```

Rules that matter (details in `CLAUDE.md` → `## Shell`):

1. **Full path required.** Bare `bash` is WSL (`Linux`, `/mnt/c/...`, its own git/node), not Git
   Bash (`MINGW64_NT-10.0-26200`, `/c/Users/johnf/Git/...`).
2. **Never put double quotes inside the payload** — Windows argv parsing consumes them when bash.exe
   is spawned, so bash gets a truncated command and the remainder leaks into the pipeline
   (`grep -E "a|b" file` becomes `grep -E a|b file` → runs `b file` as a command). A truncated
   `grep` with no file argument then **hangs on stdin**, which jams the terminal until the process is
   killed. Use separate `-e` flags, unquoted words, `$(...)`, or a script file.
3. Passing test: `-c 'X=42; echo val=$X'` → `val=42`.
4. Each call is a fresh shell — no `cd` or exports carry over; chain with `&&` / `;`.
5. For anything non-trivial, write a script into **`.cline/`**, run `-c 'bash .cline/tmp-<purpose>.sh'`,
   then delete it.
6. **All temporary working files go in `.cline/`** — never the repo root or a source folder. Its
   contents are gitignored (`/.cline/*`, keeping `README.md`), so scratch files cannot be committed.
   Name them `tmp-<purpose>.<ext>` and clean up when the task is done.
