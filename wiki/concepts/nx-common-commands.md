# Nx Common Commands

## Definition

A reference guide for day-to-day commands when working in the Jarvis monorepo — tasks
that developers run frequently, organized by purpose rather than appearing scattered
across project documentation.

## Mental Model

Every monorepo has a handful of commands that everyone runs repeatedly: "show me
what's here," "build what changed," "check before I push." When they're scattered
across docs or tribal knowledge, new developers waste time rediscovering them. This
page collects them in one place, organized by use case.

## Exploration & Discovery

```bash
# Sync workspace configuration with reality
pnpm nx sync:check                    # Verify workspace is in sync with git

# What projects exist and what can they do?
pnpm nx show projects                 # List all projects
pnpm nx show project @jarvis/db --json   # Full config + inferred targets

# Visualize the dependency graph
pnpm nx dep-graph                     # Interactive graph (opens in browser)
pnpm nx dep-graph --filter=@jarvis/db   # Filter to one project + its deps
```

## Daily Development

### Format & Lint

```bash
# Check and fix formatting
pnpm format:check                     # Check formatting only
pnpm format:write                     # Fix formatting in place

# Lint everything
pnpm nx affected -t lint              # Only projects that changed
pnpm nx run-many -t lint              # All projects
```

### Type-Checking

```bash
# Type-check changed projects
pnpm nx affected -t typecheck

# Type-check everything
pnpm nx run-many -t typecheck

# Type-check one project
pnpm nx typecheck @jarvis/db
```

### Build & Test

```bash
# Build only affected
pnpm nx affected -t build

# Build with full dependency chain
pnpm nx build @jarvis/model-catalog-bff   # Builds deps first (see [[nx-task-execution]])

# Run tests
pnpm nx affected -t test
pnpm nx run-many -t test
pnpm nx test @jarvis/model-catalog-bff
```

### Watch Mode (Development)

```bash
# Watch and rebuild on changes
pnpm nx watch -- nx run @jarvis/db:build

# Watch a specific app
pnpm nx watch -- nx serve @jarvis/model-catalog-web
```

## Pre-Push Quality Gate

```bash
# Full pipeline before pushing (what CI runs)
pnpm format:check
pnpm nx affected -t lint typecheck build test

# Or run on everything if you're confident
pnpm nx run-many -t lint typecheck build test
```

## Generators & Scaffolding

### Explore Generators

```bash
# List available workspace generators
pnpm nx list @jarvis/nx-plugin

# Show generator options and schema
pnpm nx g @jarvis/nx-plugin:context --help
```

### Create a New Context

```bash
# Dry run first (preview without committing)
pnpm nx g @jarvis/nx-plugin:context --name=my-context --dry-run

# Actually generate
pnpm nx g @jarvis/nx-plugin:context --name=my-context

# Updates after generation:
# - Creates apps/my-context/{contract,bff,web}
# - Adds tsconfig.json references (run `pnpm nx sync` to reconcile)
# - Applies tags: scope:my-context, type:{contract,bff,web}
```

## Debugging & Inspection

### Why Is a Task Running (or Cached)?

```bash
# Verbose output to see why task ran/didn't run
pnpm nx build @jarvis/db --verbose

# See what inputs the cache key depends on
pnpm nx show project @jarvis/db --json | jq '.targets.build'
```

### Inspect Task Dependencies

```bash
# What tasks run before this one?
pnpm nx show project @jarvis/model-catalog-bff --json | jq '.targets.build.dependsOn'

# See the full dependency chain
pnpm nx dep-graph --filter=@jarvis/model-catalog-bff
```

### Check Module Boundary Violations

```bash
# Run the eslint rule that enforces boundaries
pnpm nx lint @jarvis/model-catalog-web

# Look for @nx/enforce-module-boundaries errors
pnpm nx lint @jarvis/model-catalog-web 2>&1 | grep -i "boundary\|module"
```

## CI/Build Simulation (Local)

```bash
# Simulate what GitHub Actions / GitLab CI runs on a branch
pnpm format:check
pnpm nx affected -t lint typecheck build test --base=origin/main

# Simulate main-branch build (everything)
pnpm nx run-many -t lint typecheck build test
```

## Container Operations (If Using Docker)

```bash
# Build container for a project with Dockerfile
pnpm nx docker:build @jarvis/model-catalog-bff

# Run the container
pnpm nx docker:run @jarvis/model-catalog-bff
```

## Tips & Patterns

### Affected vs Run-Many

See [[nx-task-execution]] for the full explanation. Quick version:

```bash
# Use on feature branches (has a diff base)
pnpm nx affected -t build

# Use on main/release (no meaningful diff base, or you want everything)
pnpm nx run-many -t build
```

### Parallelization

By default, Nx parallelizes across 3 workers. Control it:

```bash
# Serial (one at a time, slow)
pnpm nx run-many -t build --parallel=1

# Aggressive (8 workers, may exceed machine limits)
pnpm nx run-many -t build --parallel=8

# Max available (uses all cores)
pnpm nx run-many -t build --parallel=max
```

### Filtering Projects

```bash
# By explicit names
pnpm nx run-many -t build -p @jarvis/db @jarvis/logging

# By glob pattern
pnpm nx run-many -t build --projects="libs/*"

# By tag
pnpm nx run-many -t build --projects="tag:scope:shared"

# Exclude a project
pnpm nx run-many -t build --exclude="*-e2e"
```

## Related Concepts

- [[nx-monorepo]] — How the workspace is organized
- [[nx-task-execution]] — Affected vs run-many explained
- [[nx-generators]] — Scaffolding templates
- [[module-boundaries]] — Why `nx lint` checks matter
- [[typescript-project-references]] — Why `^build` dependencies matter

## Sources

- [[raw/docs/nx.md]]
- [[raw/jarvis/nx.json]]

These are collected from workspace convention and Nx documentation; no single
authoritative source file captures all the common patterns. The commands assume
`pnpm` as the package manager and `@jarvis/nx-plugin` as the workspace generator
name, both reflecting the workspace's actual setup.
