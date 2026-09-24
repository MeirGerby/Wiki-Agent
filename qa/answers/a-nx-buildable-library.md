---
id: a-nx-buildable-library
question: q-nx-buildable-library
concepts:
  - nx-generators
  - nx-monorepo
origin: generated
---

# Non-buildable unless you have a reason

## Short answer

Default to non-buildable. Reach for buildable only when publishing to npm, sharing across repos, or when a stable library is worth its own cache entry.

## The difference

**Non-buildable** exports `.ts`/`.tsx` source directly and lets the consumer's
bundler compile it. Less config, faster dev loop.

**Buildable** gets its own `build` target and emits compiled output. Required for
npm publishing, and useful for libraries that rarely change -- the build result
caches, so dependents skip work.

```bash
nx g @nx/react:library --directory=libs/ui                 # non-buildable
nx g @nx/react:library --directory=libs/ui --bundler=vite   # buildable
```

## Watch the --directory flag

It takes the library's **full path**, not the parent directory:

```bash
nx g @nx/react:library --directory=libs/my-lib          # correct
nx g @nx/react:library --name=my-lib --directory=libs   # wrong: writes libs/package.json
```

## Sources

- [[raw/jarvis/agents/skills/nx-generate/SKILL.md]]

## Question

- [[q-nx-buildable-library]]

## Related Concepts

- [[nx-generators]]
- [[nx-monorepo]]
