# Nx Monorepo

## Definition

A workspace where multiple related applications and libraries live in a single Git repository, managed by Nx to automatically infer build tasks, enforce dependency rules, and optimize incremental builds through intelligent caching and task ordering.

## Mental Model

Think of a shopping mall. Individual stores (projects) are independent businesses but share common infrastructure (plumbing, electricity, security). The mall's management (Nx) knows which stores depend on which utilities, can close/rebuild one store without affecting others, and can run announcements (tasks) efficiently because it understands the dependencies.

## Example

```
jarvis/                          # one repository
├── apps/model-catalog/
│   ├── web/                     # React frontend (port 5173)
│   ├── bff/                     # Hono + tRPC backend (port 3001)
│   └── contract/                # Shared Zod schemas
├── libs/
│   ├── ui/                      # Shared React components
│   ├── db/                      # Drizzle ORM + migrations
│   └── logging/                 # Logging utilities
├── tools/
│   └── nx-plugin/               # Custom Nx generators
└── nx.json                       # Workspace config
```

Tasks run through Nx instead of directly:
```bash
pnpm nx build @jarvis/db         # builds the db library
pnpm nx serve @jarvis/model-catalog-bff  # starts backend dev server
pnpm nx affected -t build        # only rebuilds changed projects + dependents
```

## Key Features

- **Auto-inferred tasks** — Plugins detect TypeScript, Vite, ESLint, Docker and generate `build`, `lint`, `serve` targets
- **Deterministic caching** — Same inputs = cache hit; skips redundant work across CI runs
- **Dependency graph** — Nx understands project relationships and orders tasks correctly
- **Module boundaries** — ESLint enforces that projects only depend on allowed layers (web → contract, bff → data)
- **Generators** — Scaffolds new projects following workspace conventions (e.g., `nx g context --name=payments`)

## Related Concepts

- [[bounded-contexts]]
- [[module-boundaries]]
- [[drizzle-orm]]
- [[trpc]]

## Sources

- [[raw/jarvis/nx.md]]
- [[raw/jarvis/nx.json]]
- [[raw/jarvis/AGENTS.md]]
