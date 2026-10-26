# Pipes

## Definition
A redirection operator (`|`) used to send the standard output (stdout) of one command directly into the standard input (stdin) of another command as a continuous data stream.

## Mental Model
Think of assembly line pipes connecting manufacturing stations. Instead of putting a finished component in a temporary box on the floor (temporary files), you pipe it straight onto the intake conveyor belt of the next machine.

## Example
```bash
cat raw/linux/pipes.md | grep "stderr"
```

## Guided Practice
- Build the answer one stage at a time and check each stage's output.
- Rank the top items in a log: `awk '{print $1}' access.log | sort | uniq -c | sort -rn`. Read it aloud: take field 1, sort, count duplicates, rank.
- `uniq` merges only adjacent lines, so `sort` first. `>` overwrites silently; `>>` appends.

## Related Concepts
- [[stdin]]
- [[stdout]]
- [[stderr]]
- [[../commands/grep]]
- [[log-investigation]]
- [[../commands/git]]
- [[../commands/gh]]
- [[bash-scripting]]
- [[cyber-command-reference]]

## Sources
- [[raw/linux/pipes.md]]
- [[raw/learn/cyber-linux/steps/step-02-files-and-text.md]]
