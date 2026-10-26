# Step 5 (שלב 5) — Bash and Shell Scripting

Stage A. Goal: turn repeated command work into a script that finds failed logins in a log.

Use a sample log file, not a production log.

## Learn

- Variables and quoting: `name="x"`, `"$name"`, `${name:-default}`
- Conditions: `if [[ -f "$file" ]]; then ... fi`, `&&`, `||`
- Loops: `for f in *.log; do ...; done`, `while read -r line; do ...; done < file`
- Exit codes: `$?`, `exit 1`, `set -euo pipefail`
- Pipes and redirection: `|`, `>`, `>>`, `2>&1`, `<<<`

## Guided exercise

1. Make a sample log:
   ```bash
   cat > sample.log <<'LOG'
   Oct 25 10:01:01 host sshd[1]: Failed password for root from 10.0.0.5 port 22 ssh2
   Oct 25 10:01:03 host sshd[1]: Failed password for admin from 10.0.0.5 port 22 ssh2
   Oct 25 10:02:10 host sshd[1]: Accepted password for alice from 10.0.0.9 port 22 ssh2
   Oct 25 10:03:44 host sshd[1]: Failed password for root from 10.0.0.7 port 22 ssh2
   LOG
   ```
2. Write `failed.sh` that takes the log as `$1` and prints a count per source IP:
   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   log=${1:?usage: failed.sh LOGFILE}
   grep "Failed password" "$log" | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn
   ```
3. `chmod +x failed.sh && ./failed.sh sample.log`. Expected: `2 10.0.0.5` then `1 10.0.0.7`.
4. Extend it: exit with code 1 if any IP has 3 or more failures, and print a warning.

## What good looks like

- Prints a usage message if no argument is given.
- Fails loudly on a missing file.
- Every variable is quoted.

## Pitfalls

- `$(NF-3)` depends on the log format; check one line before trusting it.
- Without `set -u`, a typo in a variable name silently becomes an empty string.
- `[ ]` and `[[ ]]` differ; prefer `[[ ]]` in bash.

## Daily summary prompts

What does `set -euo pipefail` do? Why quote variables? What is the exit code of a pipeline?

## Review questions

1. What does `2>&1` do?
2. Why is `while read -r` safer than `for line in $(cat file)`?
3. How do you make a script stop at the first error?
