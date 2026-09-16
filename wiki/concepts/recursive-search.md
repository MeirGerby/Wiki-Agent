# Recursive Search

## Definition
A search method that traverses through a directory and all of its subdirectories automatically.

## Mental Model
Unfolding nested Russian dolls. You check the outer box, open every box inside it, and check everything inside those too.

## Example
```bash
grep -r "critical" ./logs/
```

## Related Concepts
- [[../commands/grep]]

## Sources
- [[raw/linux/grep.md]]
