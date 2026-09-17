# sed

## Definition
Stream Editor. A command-line utility used to parse and transform text within an input stream or file line-by-line, most commonly for text substitution.

## Mental Model
Think of it as a conveyor belt moving text lines one by one under an automated stamp. Whenever a line matches a rule, the stamp instantly modifies it (e.g., swapping words) before it drops out the other side.

## Example
```bash
# Substitutes 'apple' with 'orange' globally in the file
sed 's/apple/orange/g' fruit.txt
```

## Related Concepts
- [[../concepts/regex]]
- [[../concepts/stdin]]
- [[../concepts/stdout]]
- [[../concepts/pipes]]
- [[awk]] — Another text processing tool

## Sources
- [[raw/linux/sed.md]]
