# Bounded Contexts

## Definition

In domain-driven design (DDD), a bounded context is a clear boundary around a cohesive set of concepts in business logic. Each context owns its own data models, business rules, and API contract, and communicates with other contexts through well-defined interfaces. In Nx monorepos, each context is a folder (`apps/<name>/`) containing web, backend (bff), and contract (schemas) packages.

## Mental Model

Think of different departments in a bank. Lending has its own definition of "account"; Payments has its own. They call each other only through formal channels (an API contract), not by reaching into each other's filing cabinets. If Lending changes how it tracks balances, Payments doesn't break — it just receives the update through the agreed-upon protocol.

## Example

Jarvis has one bounded context: `model-catalog`.

```
apps/model-catalog/
├── contract/        # Zod schemas (the published interface)
│   └── src/index.ts → {DetectedObject, Model, ...}
├── bff/             # Backend (Hono + tRPC)
│   └── src/
│       ├── router.ts         # tRPC procedures
│       └── services/...      # domain logic
└── web/             # Frontend (React + TanStack Router)
    └── src/routes/...       # pages, components
```

To add a second context (e.g., `analytics`):
```bash
pnpm nx g @jarvis/nx-plugin:context --name=analytics
```

Contexts can share code only through the `libs/` layer (ui, db, logging, etc.). A `model-catalog` component cannot import from `analytics` directly.

## In Nx

- **Scope tag** — Each context gets `scope:model-catalog`, `scope:analytics`, etc.
- **Dependency rule** — A project in one scope can only depend on projects in the same scope + `scope:shared`
- **Enforced by** — ESLint rule `@nx/enforce-module-boundaries`

## Related Concepts

- [[nx-monorepo]]
- [[module-boundaries]]

## Sources

- [[raw/jarvis/nx.md]]
- [[raw/jarvis/AGENTS.md]]
