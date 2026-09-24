---
id: a-neon-branch-copies-what
question: q-neon-branch-copies-what
concepts:
  - neon-lakebase
  - postgres-connections
origin: generated
---

# Nothing, until you write

## Short answer

A branch is a copy-on-write clone. It shares storage with its parent and only stores what diverges, so creating one is near-instant regardless of database size.

## What you get

- An isolated clone taken from the current state, or from any past point inside
  the retained history window
- Its own compute endpoint, and its own pooled and direct connection strings
- Freedom to modify or drop it without touching the parent

Writes are stored independently as deltas. Until you write, the branch is
effectively a pointer.

## Why this changes the workflow

It makes a database branch as cheap as a git branch, which is the premise of the
branch-first loop:

```bash
neon link                     # once per project
neon checkout dev-add-search  # per feature; also pulls that branch's env
neon diff                     # schema delta against the parent
```

The practical payoff is testing a migration against production-like data before
it reaches production -- see [[postgres-connections]].

## Sources

- [[raw/jarvis/agents/skills/neon/SKILL.md]]
- [[raw/jarvis/agents/skills/neon-postgres/SKILL.md]]

## Question

- [[q-neon-branch-copies-what]]

## Related Concepts

- [[neon-lakebase]]
- [[postgres-connections]]
