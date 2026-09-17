# awk

## Definition
A powerful pattern scanning and processing language designed for manipulating data and generating reports by treating files as structured columns and rows.

## Mental Model
Think of it as a text-based Excel grid processor. It cuts every line into separate cells automatically based on spaces, allowing you to easily target, compute, or print specific vertical columns.

## Example
```bash
# Prints only the first and third columns of a data file
awk '{print \$1, \$3}' data.txt
```

## Related Concepts
- [[../concepts/stdin]]
- [[../concepts/stdout]]
- [[../concepts/regex]]
- [[../concepts/pipes]]
- [[sed]] — Another text processing tool

## Sources
- [[raw/linux/awk.md]]
