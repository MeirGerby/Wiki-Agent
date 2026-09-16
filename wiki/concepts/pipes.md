# Pipes

## Definition
A redirection operator (`|`) used to send the standard output (stdout) of one command directly into the standard input (stdin) of another command as a continuous data stream.

## Mental Model
Think of assembly line pipes connecting manufacturing stations. Instead of putting a finished component in a temporary box on the floor (temporary files), you pipe it straight onto the intake conveyor belt of the next machine.

## Example
```bash
cat raw/linux/pipes.md | grep "stderr"
```

## Related Concepts
- [[stdin]]
- [[stdout]]
- [[stderr]]
- [[../commands/grep]]

## Sources
- [[raw/linux/pipes.md]]
