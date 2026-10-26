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

## Offline by design

`nx.json` sets `neverConnectToCloud: true` and disables analytics. Nx Cloud's usual
selling points — remote caching shared across machines, distributed task execution
— are unavailable here; every cache hit is local to the machine that produced it.
Nx Cloud's CI-watching tooling is likewise not something this workspace's
`nx.json` opts into.

## How tasks get inferred, not declared

No `project.json` in Jarvis hand-writes a `build` or `lint` target. Plugins infer
them by recognising files:

| Plugin | Recognises | Infers |
|---|---|---|
| `@nx/js/typescript` | `tsconfig.lib.json` | `build`, `typecheck`, `build-deps`, `watch-deps` |
| `@nx/vite/plugin` | a Vite config | `serve`, `build`, `preview`, `dev` |
| `@nx/eslint/plugin` | `eslint.config.mjs` | `lint`, across `ts`, `tsx`, `js`, `jsx`, `html`, `vue`, `md` |
| `@nx/docker/plugin` | a `Dockerfile` | `docker:build`, `docker:run` |

A project's targets are a *consequence* of which files it has, not a list someone
maintains. Add a `Dockerfile` to a new app and `docker:build` appears with no
config change. The BFF and web app each layer a custom target on top where
inference isn't enough — the BFF hand-defines `test` (`vitest run`), the web app
hand-defines `typecheck` (`tsc --noEmit -p tsconfig.app.json`).

## Named inputs: why editing a test doesn't invalidate a build

Nx's cache key is a hash of a task's declared inputs. `production` is `default`
minus test files, test config and lint config:

```json
"production": [
  "default",
  "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
  "!{projectRoot}/tsconfig.spec.json",
  "!{projectRoot}/src/test-setup.[jt]s",
  "!{projectRoot}/.eslintrc.json",
  "!{projectRoot}/eslint.config.mjs",
  "!{projectRoot}/vitest.config.*",
  "!{projectRoot}/test-setup.[jt]s"
]
```

`build` depends on `production` inputs, so changing a `.spec.ts` file does not
change the hash `build` keys off — the previous build result is still valid and
gets served from cache. `lint` and `test` still key off broader inputs, so they do
rerun. Named inputs are what make the cache key precise enough for this to work.

## All projects in Jarvis

| Project | Type | Location | Tags | Purpose |
|---------|------|----------|------|---------|
| `@jarvis/model-catalog-web` | Application | `apps/model-catalog/web` | `type:web`, `scope:model-catalog` | React frontend |
| `@jarvis/model-catalog-bff` | Application | `apps/model-catalog/bff` | `type:bff`, `scope:model-catalog` | Hono + tRPC backend |
| `@jarvis/model-catalog-contract` | Library | `apps/model-catalog/contract` | `type:contract`, `scope:model-catalog` | Shared Zod schemas |
| `@jarvis/ui` | Library | `libs/ui` | `type:ui`, `scope:shared` | Shared React components |
| `@jarvis/db` | Library | `libs/db` | `type:data`, `scope:shared` | Database schemas + migrations |
| `@jarvis/logging` | Library | `libs/logging` | `type:util`, `scope:shared` | Logging utilities |
| `@jarvis/nx-plugin` | Tool | `tools/nx-plugin` | `type:tooling`, `scope:tooling` | Nx generators |

## Module boundary rules (enforced by ESLint)

Dependency constraints by layer:

```
type:web      → can use: contract, ui, util
type:bff      → can use: contract, data, util
type:contract → can use: data, util
type:ui       → can use: util
type:data     → can use: util
type:util     → can use: nothing (leaf layer)
type:tooling  → can use: tooling only
```

Scope constraints:
- `scope:model-catalog` projects → only other `model-catalog` + `scope:shared`
- `scope:shared` projects → only other `shared` (isolated leaf)
- `scope:tooling` projects → only `tooling` (isolated)

Violation is caught by `nx lint` via `@nx/enforce-module-boundaries` ESLint rule.

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Module boundary error | Dependency violates eslint rule | Check `depConstraints` in `eslint.config.mjs` |
| Task not found | Plugin didn't infer it | Check project.json has correct `projectType` |
| Cache miss when nothing changed | Stale input filter | Check `namedInputs` includes correct files |
| Circular dependency | Two projects depend on each other | Use project references or shared lib |
| Build fails but lint passes | Different input filters | `build` uses `production` inputs (excludes tests) |

## Related Concepts

- [[bounded-contexts]]
- [[module-boundaries]]
- [[drizzle-orm]]
- [[trpc]]

## Sources

- [[raw/jarvis/nx.md]]
- [[raw/jarvis/nx.json]]
- [[raw/jarvis/AGENTS.md]]
- [[raw/docs/nx.md]]
