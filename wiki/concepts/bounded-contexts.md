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

## How a context documents itself

Each context is expected to carry its own glossary and its own architectural
decisions, and a workspace-level file points at where to find them:

```
/
├── CONTEXT-MAP.md                     ← one row per app, links to its glossary
├── docs/adr/                          ← system-wide decisions
└── apps/
    └── model-catalog/
        └── docs/
            ├── CONTEXT.md             ← this context's glossary
            └── adr/                   ← decisions scoped to this context
```

The rule that keeps this from sprawling: **one app has one glossary; a library has
none.** A library's vocabulary belongs to whichever context uses it — `@jarvis/db`
does not get its own `CONTEXT.md` because its tables are Model Catalog's
vocabulary, not a separate domain.

This convention exists specifically so that engineering skills exploring the
codebase read domain vocabulary before writing about it — an issue title, a refactor
proposal, a test name should use the term as `CONTEXT.md` defines it rather than a
synonym the glossary avoids. If a needed concept isn't in any glossary yet, that's a
signal: either the skill is inventing language the project doesn't use, or there is
a genuine gap worth flagging separately, not papering over with an invented name.

None of this is provisioned upfront — if `CONTEXT-MAP.md` or a context's `docs/adr/`
doesn't exist yet, the convention is to proceed silently rather than flag the
absence. These files get created lazily, the first time a term or a decision
actually needs recording, by a `/domain-modeling` skill reached through
`/grill-with-docs` or `/improve-codebase-architecture`. See
[[jarvis-agent-skills]] for how that skill relates to others configured the same
way.

**Contradicting an ADR is a flaggable event, not a silent override.** The convention
calls for surfacing it explicitly — "Contradicts ADR-0007, but worth reopening
because..." — rather than quietly proposing something that conflicts with a
recorded decision.

## Related Concepts

- [[nx-monorepo]]
- [[module-boundaries]]
- [[jarvis-agent-skills]] — Other skills that read repo-specific configuration this way

## Sources

- [[raw/jarvis/nx.md]]
- [[raw/jarvis/AGENTS.md]]
- [[raw/jarvis/docs/agents/domain.md]]
