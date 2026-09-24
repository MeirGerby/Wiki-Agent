# Nx Task Execution

## Definition

Running build, test, lint, serve, and other tasks on projects in an Nx monorepo using deterministic commands that leverage caching, dependency ordering, and intelligent parallelization. Three execution modes exist: single-project, multi-project, and affected-only.

## Mental Model

Think of a factory assembly line. Single-project execution is running one station. Multi-project execution is running all stations in parallel. Affected execution is smart: run only the stations where materials changed and all downstream stations that depend on them.

## Three Execution Modes

### Single Project

```bash
nx run <project>:<task>
# or shorthand
nx <task> <project>
```

Example:
```bash
nx run my-app:build
nx build my-app
nx test my-lib
```

**Use for**: Running a specific task on one project.

### Multi-Project (run-many)

```bash
nx run-many -t <task1> <task2> ...
```

Without filtering, runs on all projects. With `-p`, filters to specific projects:

```bash
# Run tests on all projects
nx run-many -t test

# Run build and test on specific projects
nx run-many -t build test -p proj1 proj2

# Run test on projects matching a glob pattern
nx run-many -t test --projects="*-app"

# Run test on projects with a specific tag
nx run-many -t test --projects="tag:api-*"

# Run test on all projects except excluded ones
nx run-many -t test --exclude="*-e2e" --exclude=internal-lib

# Control parallelization (default: 3)
nx run-many -t build --parallel=8
```

**Use for**: Running tasks on multiple projects (often in CI).

### Affected Projects (Smart Filtering)

```bash
nx affected -t <task>
```

Runs tasks only on projects changed in the current branch and all projects that depend on them:

```bash
# Default: compares against detected base branch
nx affected -t build test lint

# Explicit base branch
nx affected -t test --base=main
nx affected -t test --base=origin/main

# Between two commits
nx affected -t test --base=abc123 --head=def456

# Filter affected results by type or tag
nx affected --type app
nx affected --type lib

# Include uncommitted/untracked changes
nx affected -t test --uncommitted
nx affected -t test --untracked

# Exclude e2e projects
nx affected -t test --exclude="*-e2e"
```

**Use for**: CI pipelines, local development pre-commit checks. Eliminates unnecessary task runs.

## Project Filtering

All three execution modes support the same filtering syntax:

| Filter | Example |
|--------|---------|
| **Explicit names** | `-p proj1 proj2` |
| **Glob patterns** | `--projects="libs/*"` or `--projects="shared-*"` |
| **Tag filters** | `--projects="tag:api"` or `--projects="tag:scope:shared"` |
| **Multiple tags** | `--projects="tag:publishable,tag:scope:shared"` |
| **Negation** | `--projects="!tag:private"` or `--projects="!*-e2e"` |
| **Directory** | `--projects="@myorg/api"` |
| **By target** | `--withTarget build` (projects that have a build target) |
| **Combined** | `--projects="tag:scope:client,packages/*"` |

## Useful Flags

Available on `nx run`, `nx run-many`, and `nx affected`:

| Flag | Purpose |
|------|---------|
| `--skipNxCache` | Rerun tasks even when cached |
| `--verbose` | Print stack traces and detailed output |
| `--nxBail` | Stop after first failed task |
| `--configuration=<name>` | Use specific config (e.g., `production`) |
| `--parallel=<n>` | Control concurrent tasks (default: 3) |

## Discovering Available Tasks

```bash
# List all available targets on a project
nx show project <project> --json | jq '.targets | keys'

# List all projects with a specific target
nx show projects --withTarget serve
nx show projects --withTarget test

# Get full target configuration
nx show project <project> --json | jq '.targets.build'
```

## Common Workflows

### CI Pipeline

```bash
# Run affected projects after a change
nx affected -t lint typecheck build test

# Control parallelization for stability
nx affected -t test --parallel=2
```

### Local Development

```bash
# Build all dependencies before testing
nx build @myorg/shared-utils
nx test my-app

# Run all tests in affected area
nx affected -t test

# Full build before push
nx run-many -t build lint typecheck test
```

### Feature Development

```bash
# Create feature branch, make changes
git checkout -b feat/new-feature

# Only run affected checks
nx affected -t typecheck lint

# Before pushing, run all tasks
nx run-many -t build test lint
```

## Related Concepts

- [[nx-monorepo]] — Workspace architecture and caching
- [[module-boundaries]] — How projects relate (used by affected detection)

## Sources

- [[raw/jarvis/agents/skills/nx-run-tasks/SKILL.md]]
- [[raw/jarvis/agents/skills/nx-workspace/SKILL.md]]
- [[raw/jarvis/agents/skills/nx-workspace/references/AFFECTED.md]]
