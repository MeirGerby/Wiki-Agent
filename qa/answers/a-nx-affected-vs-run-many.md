---
id: a-nx-affected-vs-run-many
question: q-nx-affected-vs-run-many
concepts:
  - nx-task-execution
  - nx-monorepo
  - module-boundaries
origin: generated
---

# Use affected when the git diff defines the work

## Short answer

`run-many` runs on the projects you name. `affected` works out that set from the git diff -- changed projects plus everything depending on them.

## When each fits

**`nx affected`** -- CI on a pull request, and pre-push checks locally. The diff
already says what could have broken, so running anything else is wasted time.

```bash
nx affected -t lint typecheck build test
nx affected -t test --base=origin/main
nx affected -t test --uncommitted   # include working-tree changes
```

**`nx run-many`** -- when the diff is the wrong signal. A release build, a
dependency bump that touches nothing but changes everything, or a first run on a
cold cache.

```bash
nx run-many -t build            # everything
nx run-many -t test -p api web  # a named subset
```

## The part that is easy to miss

`affected` includes **dependents**, not just changed projects. Edit `libs/ui` and
every app importing it is in the set. That is why the dependency graph and
[[module-boundaries]] matter: they decide how far a change propagates.

## Sources

- [[raw/jarvis/agents/skills/nx-run-tasks/SKILL.md]]
- [[raw/jarvis/agents/skills/nx-workspace/references/AFFECTED.md]]

## Question

- [[q-nx-affected-vs-run-many]]

## Related Concepts

- [[nx-task-execution]]
- [[nx-monorepo]]
- [[module-boundaries]]
