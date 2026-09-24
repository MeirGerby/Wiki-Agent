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
This is why [[ci-monitoring]] (Nx Cloud's polling agent) is documented separately
from this page: it describes tooling built to *watch* CI, not a feature this
workspace's `nx.json` opts into.

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
  "!{projectRoot}/vitest.config.*",
  "!{projectRoot}/eslint.config.mjs"
]
```

`build` depends on `production` inputs, so changing a `.spec.ts` file does not
change the hash `build` keys off — the previous build result is still valid and
gets served from cache. `lint` and `test` still key off broader inputs, so they do
rerun. This is the same caching principle [[nx-task-execution]] exploits at the
task level; named inputs are what make the cache key precise enough for it to work.

## Related Concepts

- [[bounded-contexts]]
- [[module-boundaries]]
- [[drizzle-orm]]
- [[trpc]]
- [[nx-task-execution]] — Running build, test and lint across the workspace
- [[ci-monitoring]] — Nx Cloud's CI-watching agent, unrelated to this workspace's caching
- [[nx-generators]] — The context generator mentioned above, in full

## Sources

- [[raw/jarvis/nx.md]]
- [[raw/jarvis/nx.json]]
- [[raw/jarvis/AGENTS.md]]
- [[raw/docs/nx.md]]
