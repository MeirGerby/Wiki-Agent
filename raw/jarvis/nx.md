# Nx Workspace Configuration Reference

This document summarizes all Nx features and configurations used in the jarvis workspace.

## Overview

- **Nx Version**: 23.1.1
- **Package Manager**: pnpm 10.32.1
- **Cloud**: Disabled (`neverConnectToCloud: true`)
- **Analytics**: Disabled
- **Workspace Type**: Monorepo with multiple apps and libraries

---

## Workspace Structure

### Projects

| Project                            | Type        | Location                        | Tags                                       | Purpose                       |
| ---------------------------------- | ----------- | ------------------------------- | ------------------------------------------ | ----------------------------- |
| `@jarvis/model-catalog-web`      | Application | `apps/model-catalog/web`      | `type:web`, `scope:model-catalog`      | React frontend                |
| `@jarvis/model-catalog-bff`      | Application | `apps/model-catalog/bff`      | `type:bff`, `scope:model-catalog`      | Hono + tRPC backend           |
| `@jarvis/model-catalog-contract` | Library     | `apps/model-catalog/contract` | `type:contract`, `scope:model-catalog` | Shared Zod schemas            |
| `@jarvis/ui`                     | Library     | `libs/ui`                     | `type:ui`, `scope:shared`              | Shared React components       |
| `@jarvis/db`                     | Library     | `libs/db`                     | `type:data`, `scope:shared`            | Database schemas + migrations |
| `@jarvis/logging`                | Library     | `libs/logging`                | `type:util`, `scope:shared`            | Logging utilities             |
| `@jarvis/nx-plugin`              | Tool        | `tools/nx-plugin`             | `type:tooling`, `scope:tooling`        | Nx generators                 |

### Context Structure

The workspace uses a **multi-context pattern**:

- Each bounded context lives under `apps/<context>/`
- Each context contains: `web`, `bff`, `contract` subdirectories
- Shared libraries under `libs/` are context-agnostic
- Currently: one context = `model-catalog`

---

## Plugins

Nx plugins provide automatic task inference and workspace optimization.

### 1. @nx/js/typescript Plugin

**Purpose**: Infers TypeScript build and type-checking tasks

**Configuration**:

```json
{
  "typecheck": { "targetName": "typecheck" },
  "build": {
    "targetName": "build",
    "configName": "tsconfig.lib.json"
  }
}
```

**Inferred Targets**:

- `build` — Compiles TypeScript (libraries only)
- `typecheck` — Type-checks without emitting (all projects)
- `build-deps` — Builds dependencies first
- `watch-deps` — Watches and rebuilds dependencies

---

### 2. @nx/vite/plugin

**Purpose**: Infers Vite dev server, build, and preview tasks

**Configuration**:

```json
{
  "buildTargetName": "build",
  "serveTargetName": "serve",
  "devTargetName": "dev",
  "previewTargetName": "preview",
  "serveStaticTargetName": "serve-static",
  "typecheckTargetName": "typecheck"
}
```

**Inferred Targets**:

- `serve` — Starts dev server (port 3001 for BFF, 5173 for web)
- `build` — Bundles for production
- `preview` — Previews production build locally
- `dev` — Alternative dev command

**Projects**: BFF, Web

---

### 3. @nx/eslint/plugin

**Purpose**: Infers linting tasks for all file types

**Configuration**:

```json
{
  "targetName": "lint",
  "extensions": ["ts", "tsx", "js", "jsx", "html", "vue", "md"]
}
```

**Inferred Target**:

- `lint` — Lints all source files

**Coverage**: All projects

---

### 4. @nx/docker/plugin

**Purpose**: Infers Docker build and run tasks

**Configuration**:

```json
{
  "buildTarget": {
    "name": "docker:build",
    "args": ["--file {projectRoot}/Dockerfile", "--build-arg PROJECT={projectName}"]
  },
  "runTarget": {
    "name": "docker:run",
    "args": ["--rm", "-p 8080:8080"]
  }
}
```

**Inferred Targets**:

- `docker:build` — Builds Docker image
- `docker:run` — Runs container

**Projects**: BFF, Web (have Dockerfiles)

---

## Targets (Tasks)

### Automatically Inferred Targets

| Target           | Runs On              | Command                              |
| ---------------- | -------------------- | ------------------------------------ |
| `build`        | Libraries            | TypeScript compilation via`@nx/js` |
| `build`        | Apps                 | Vite bundling via`@nx/vite`        |
| `typecheck`    | All                  | `tsc --noEmit`                     |
| `lint`         | All                  | ESLint across all file types         |
| `serve`        | Apps                 | Vite dev server                      |
| `preview`      | Apps                 | Vite preview                         |
| `docker:build` | Apps with Dockerfile | Docker build                         |
| `docker:run`   | Apps with Dockerfile | Docker run                           |

### Custom Targets (Manual Definition)

**BFF**:

- `test` — Runs Vitest: `vitest run`

**Web**:

- `typecheck` — Custom `tsc --noEmit -p tsconfig.app.json`

---

## Target Defaults (Global Configuration)

These settings apply to all projects unless overridden:

### lint

```json
{
  "inputs": [
    "default",
    "^default",
    "{workspaceRoot}/eslint.config.mjs",
    "{workspaceRoot}/tools/eslint/**/*",
    { "externalDependencies": ["eslint"] }
  ]
}
```

- Depends on workspace lint config and tools
- Enables caching if inputs haven't changed

### build

```json
{
  "dependsOn": ["^build"]
}
```

- Always builds all dependencies first (`^` means transitive)
- Ensures correct order in monorepo

### typecheck

```json
{
  "dependsOn": ["^build"]
}
```

- Requires dependencies to be built first
- Allows type-checking against built output

### test

```json
{
  "dependsOn": ["^build"]
}
```

- Runs after dependency builds

### @nx/esbuild:esbuild (if used)

```json
{
  "cache": true,
  "dependsOn": ["^build"],
  "inputs": ["production", "^production", "{workspaceRoot}/tsconfig.json"]
}
```

- Optimized caching with production inputs
- Skips test files and dev-only code

---

## Named Inputs (Smart Caching)

Named inputs define what files matter for a task, enabling Nx to cache more accurately.

### default

```json
"default": ["{projectRoot}/**/*"]
```

- Includes all files in the project
- Used by most tasks

### production

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

- **Includes**: Source code only
- **Excludes**: Test files, test config, lint config
- **Use**: Build tasks (changes to tests don't invalidate cache)
- **Benefit**: Same source code build hits cache even if tests change

---

## Module Boundaries & Project Tags

Nx enforces dependency rules using **tags**. Each project has two tags:

1. **scope** — Bounded context (e.g., `model-catalog`, `shared`, `tooling`)
2. **type** — Layer/kind (e.g., `web`, `bff`, `contract`, `data`, `ui`, `util`, `tooling`)

### Dependency Rules

```
default:     * → only type:*           (all projects depend only on layers)
scope:*:     * → same scope + shared   (context boundary)
scope:shared: * → only shared          (shared libs are isolated)
scope:tool:  * → only tooling          (tools are isolated)
```

### Layer Rules

```
type:web      → can use: contract, ui, util
type:bff      → can use: contract, data, util
type:contract → can use: data, util
type:ui       → can use: util
type:data     → can use: util
type:util     → can use: nothing (leaf layer)
type:tooling  → can use: tooling only
```

### Tag Assignments

| Project                | scope         | type     | Allowed deps         |
| ---------------------- | ------------- | -------- | -------------------- |
| model-catalog-web      | model-catalog | web      | contract, ui, util   |
| model-catalog-bff      | model-catalog | bff      | contract, data, util |
| model-catalog-contract | model-catalog | contract | data, util           |
| ui                     | shared        | ui       | util                 |
| db                     | shared        | data     | util                 |
| logging                | shared        | util     | (none)               |
| nx-plugin              | tooling       | tooling  | (tooling)            |

### Enforced By

- **ESLint Rule**: `@nx/enforce-module-boundaries` in `eslint.config.mjs`
- **Blocks**: Circular dependencies, layer violations, scope crossing

---

## Generators

Nx generators scaffold new code following workspace patterns.

### context Generator

**Location**: `tools/nx-plugin/src/generators/context/`

**Purpose**: Generate a complete new bounded context (app + libs)

**What it creates**:

1. `apps/<name>/contract` — Zod schemas (type:contract)
2. `apps/<name>/bff` — Hono + tRPC backend (type:bff)
3. `apps/<name>/web` — React + TanStack Router frontend (type:web)

**Template files**: `tools/nx-plugin/src/generators/context/files/`

**Usage**:

```bash
pnpm nx g @jarvis/nx-plugin:context --name=my-context
```

**Generated structure**:

```
apps/my-context/
├── contract/
│   ├── src/index.ts
│   ├── tsconfig.json
│   └── tsconfig.lib.json
├── bff/
│   ├── src/
│   │   ├── router.ts
│   │   ├── container.ts
│   │   ├── server.ts
│   │   └── ...routers
│   ├── Dockerfile
│   ├── vite.config.mts
│   └── project.json
└── web/
    ├── src/
    │   ├── router-context.ts
    │   ├── main.tsx
    │   └── routes/
    ├── index.html
    ├── Dockerfile
    └── vite.config.mts
```

---

## Common Commands

### Running Tasks

```bash
# Single project
pnpm nx run @jarvis/db:build
pnpm nx build @jarvis/db                   # shorthand

# Multiple projects (target)
pnpm nx run-many -t build -p @jarvis/db @jarvis/logging

# All affected by changes
pnpm nx affected -t lint typecheck build test

# Watch mode
pnpm nx watch -- nx run {projectName}:build
```

### Development

```bash
# Start BFF dev server (port 3001)
pnpm nx serve @jarvis/model-catalog-bff

# Start web dev server (port 5173)
pnpm nx serve @jarvis/model-catalog-web

# Type-check all
pnpm nx affected -t typecheck

# Lint all
pnpm nx affected -t lint
```

### CI/Build

```bash
# Check workspace is in sync
pnpm nx sync:check

# Format check
pnpm format:check

# Full CI pipeline (what GitHub Actions runs)
pnpm format:check
pnpm nx affected -t lint typecheck build test
```

### Graph & Analysis

```bash
# Show dependency graph
pnpm nx dep-graph

# Show project details
pnpm nx show project @jarvis/db

# Show all projects
pnpm nx show projects

# List all available targets
pnpm nx show project @jarvis/model-catalog-bff
```

### Generators

```bash
# List available generators
pnpm nx list @jarvis/nx-plugin

# Generate a new context
pnpm nx g @jarvis/nx-plugin:context --name=new-context
```

---

## Workspace Configuration Summary

### nx.json Key Settings

| Setting                 | Value     | Meaning                             |
| ----------------------- | --------- | ----------------------------------- |
| `analytics`           | `false` | No telemetry sent to Nx Cloud       |
| `neverConnectToCloud` | `true`  | Offline-only, no cloud features     |
| `sync.applyChanges`   | `true`  | Auto-apply workspace config changes |

### Nx Workspace Features Used

✅ **Project References** — TypeScript composite projects for incremental builds
✅ **Caching** — Deterministic task caching via inputs/outputs
✅ **Dependency Graph** — Automatic task ordering based on dependencies
✅ **Module Boundaries** — Enforced via ESLint + project tags
✅ **Generators** — Workspace-level code generation
✅ **Plugins** — Auto-infer tasks from tooling (Vite, TypeScript, ESLint, Docker)
✅ **Named Inputs** — Smart caching (production inputs exclude tests)
✅ **Affected** — Only run tasks on changed projects + dependents

### Nx Features NOT Used

❌ Cloud — Disabled (offline monorepo)
❌ Nx Console — Not required (pnpm nx CLI is sufficient)
❌ E2E Test Plugins — No dedicated e2e framework
❌ API Mocking — No MSW or mock setup

---

## Adding a New Project

To scaffold a new bounded context:

```bash
pnpm nx g @jarvis/nx-plugin:context --name=my-context
```

The generator will:

1. Create the folder structure (`apps/my-context/`)
2. Configure project.json with inferred targets
3. Add appropriate tags (`scope:my-context`)
4. Add to workspace tsconfig.json references

To manually add:

1. Create `apps/<name>/{contract,bff,web}/project.json`
2. Apply tags: `scope:<name>`, `type:{web|bff|contract}`
3. Add to `tsconfig.json` references
4. Run `pnpm nx sync` to update workspace config

---

## Troubleshooting

| Issue                           | Cause                             | Fix                                                   |
| ------------------------------- | --------------------------------- | ----------------------------------------------------- |
| Module boundary error           | Dependency violates eslint rule   | Check`depConstraints` in `eslint.config.mjs`      |
| Task not found                  | Plugin didn't infer it            | Check project.json has correct`projectType`         |
| Cache miss when nothing changed | Stale input filter                | Check`namedInputs` includes correct files           |
| Circular dependency             | Two projects depend on each other | Use project references or shared lib                  |
| Build fails but lint passes     | Different input filters           | `build` uses `production` inputs (excludes tests) |
