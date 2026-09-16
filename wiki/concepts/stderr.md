# Standard Error (stderr)

## Definition
The default stream where a program writes its error logs or diagnostic messages, decoupled from the standard output stream.

## Mental Model
Think of it as a secondary, emergency exhaust pipe next to your main speaker system. If something blows up internally, the smoke exits through the emergency pipe so it doesn't pollute your clean audio output stream.

## Example
```bash
# Redirects stderr (2) to stdout (1) to let it pass through a pipe
ls nonexistent_folder 2>&1 | grep "No such"
```

## Related Concepts
- [[stdin]]
- [[stdout]]
- [[pipes]]

## Sources
- [[raw/linux/pipes.md]]
