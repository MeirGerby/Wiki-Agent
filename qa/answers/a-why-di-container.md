---
id: a-why-di-container
question: q-why-di-container
concepts:
  - awilix
  - jarvis-bff
  - request-context-pattern
origin: generated
---

# So construction is decided in one place, not at every import

## Short answer

A direct import hardcodes which implementation you get and when it is built. A container makes that a registration decision, which is what makes swapping and testing cheap.

## What Jarvis gets from it

`container.ts` registers every service once and declares its lifetime:

```typescript
container.register({
  config: asValue(config),
  logger: asFunction(() => createConsoleLogger(config.LOG_LEVEL)).singleton(),
  db: asFunction(() => createDb({ /* ... */ }).db).singleton(),
  catalogService: asClass(CatalogService).singleton(),
  robertoService: asClass(RobertoService).singleton(),
});
```

- **One place to read.** The `Cradle` interface is the list of what exists.
- **Lifetimes are explicit.** `.singleton()` states that one database pool is
  shared, rather than leaving it to module-load timing.
- **Tests substitute freely.** Register a fake `RobertoService` and nothing else
  changes.
- **The container rides the request.** It is put on the tRPC context, so every
  procedure reaches services through `ctx.cradle` -- see
  [[request-context-pattern]].

## The cost

Indirection. "Where does `catalogService` come from?" is answered by the
registration, not by an import line your editor can follow.

## Sources

- [[raw/jarvis/apps/model-catalog/bff/src/container.ts]]
- [[raw/jarvis/BFF-ARCHITECTURE.md]]

## Question

- [[q-why-di-container]]

## Related Concepts

- [[awilix]]
- [[jarvis-bff]]
- [[request-context-pattern]]
