# Bash Scripting

## Definition
Writing shell scripts that combine commands with variables, conditions, loops, exit codes and pipes.

## Mental Model
A script is a saved pipeline. `set -euo pipefail` makes it stop at the first error, on unset variables and on failures inside pipes; quoting variables (`"$x"`) prevents word splitting.

## Example
```bash
#!/usr/bin/env bash
set -euo pipefail
log=${1:?usage: failed.sh LOGFILE}
grep "Failed password" "$log" | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn
```
Extend it to exit with code 1 when any IP has 3 or more failures. Use a sample log, not a production one.

## Related Concepts
- [[pipes]]
- [[stdin]]
- [[stdout]]
- [[stderr]]
- [[grep]]
- [[awk]]
- [[log-investigation]]
- [[cyber-learning-path]]
- [[cyber-command-reference]]

## Sources
- [[raw/learn/cyber-linux/steps/step-05-bash-scripting.md]]
