---
id: a-module-boundary-violation
question: q-module-boundary-violation
concepts:
  - module-boundaries
  - bounded-contexts
  - nx-monorepo
origin: generated
---

# Layer rules forbid it, and the contract is the way across

## Short answer

`type:web` may depend on `contract`, `ui` and `util` -- not on `type:bff`. The shared `contract` package exists precisely to carry types across that line.

## The rules

Every project carries two tags: a **scope** (bounded context) and a **type** (layer).

```
type:web      -> contract, ui, util
type:bff      -> contract, data, util
type:contract -> data, util
type:ui       -> util
type:data     -> (nothing)
```

Scope rules run alongside: a project may depend on its own scope plus
`scope:shared`, nothing else.

## What to do instead

Put the shared shape in `apps/model-catalog/contract` and import it from both
sides. In Jarvis the web app imports `AppRouter` from the bff **as a type only** --
which is why [[trpc]] gives end-to-end safety without a runtime dependency.

## Why the rule earns its keep

It is enforced by `@nx/enforce-module-boundaries` in `eslint.config.mjs`, and it
blocks circular dependencies and silent scope creep. Without it, "just this one
import" is how a monorepo turns into a single tangled package.

## Sources

- [[raw/jarvis/nx.md]]

## Question

- [[q-module-boundary-violation]]

## Related Concepts

- [[module-boundaries]]
- [[bounded-contexts]]
- [[nx-monorepo]]
