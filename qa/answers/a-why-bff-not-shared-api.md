---
id: a-why-bff-not-shared-api
question: q-why-bff-not-shared-api
concepts:
  - bff-pattern
  - jarvis-bff
  - trpc
origin: generated
---

# It trades duplication for the freedom to change

## Short answer

A shared API has to satisfy every client at once, so it ends up serving the union of their needs and can change for none of them safely. A BFF is owned by one frontend and shaped for it.

## What the BFF buys you

- **Aggregation.** One call instead of five. The Jarvis BFF folds catalog,
  permissions, training and three external services into a single typed surface.
- **Shaping.** Return exactly what the screen renders, not the full database row.
- **Isolation.** Swapping Roberto or Picasso changes one service class; the
  frontend never learns about it.
- **A place to enforce.** Auth and permission checks sit in front of every
  procedure, not scattered across clients.

## The cost

Another deployable, and logic that can drift toward duplication if you add a
second BFF later. Worth it when one frontend dominates; less so when many clients
want the same thing.

## In Jarvis

The BFF is [[hono]] + [[trpc]], wired by [[awilix]]. Because the client imports the
router's **type**, shaping the API and keeping the client honest are the same act --
see [[jarvis-bff]].

## Sources

- [[raw/jarvis/BFF-ARCHITECTURE.md]]

## Question

- [[q-why-bff-not-shared-api]]

## Related Concepts

- [[bff-pattern]]
- [[jarvis-bff]]
- [[trpc]]
