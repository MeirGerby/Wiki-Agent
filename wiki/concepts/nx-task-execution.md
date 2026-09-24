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

Real pipelines usually pick a mode rather than always using `affected`. Jarvis's
GitLab verify job branches on whether a diff base exists at all:

```bash
if [ -n "$CI_MERGE_REQUEST_DIFF_BASE_SHA" ]; then
  nx affected -t lint typecheck build test --base="$CI_MERGE_REQUEST_DIFF_BASE_SHA"
else
  nx run-many -t lint typecheck build test
fi
```

A merge request has a base to diff against, so `affected` is meaningful. A branch
or tag pipeline does not, so it runs everything. See [[ci-pipeline]] for the full
pipeline and [[q-nx-affected-vs-run-many]] for when the diff stops being the right
signal.

`affected` also needs real git history — a shallow CI clone gives it nothing to
diff. GitHub Actions pipelines pair `fetch-depth: 0` with `nrwl/nx-set-shas` to
supply the base commit.

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

## Why build always runs dependencies first

Target defaults in `nx.json` apply to every project unless overridden:

```json
"build":     { "dependsOn": ["^build"] },
"typecheck": { "dependsOn": ["^build"] },
"test":      { "dependsOn": ["^build"] }
```

The `^` means "this target, on every dependency, first." Run `nx build
@jarvis/model-catalog-bff` and Nx silently builds `@jarvis/db` and
`@jarvis/logging` first if they haven't been built yet — not because the BFF's own
task says so, but because the default does.

**The detail worth catching:** `typecheck` also depends on `^build`, not `^typecheck`.
A project type-checks *its own source* against its dependencies' **built output**
(`dist/*.d.ts`), not against their source directly. In the ordinary case this is
invisible — build output should match source. But paired with
[[conditional-exports]]'s `@jarvis/source` condition, which routes some tools
straight to `.ts` source instead, there are two different answers available to
"what type does this dependency have" depending on which resolution path a given
tool takes. Nx's own `typecheck` task takes the built-output path either way.

## Related Concepts

- [[nx-monorepo]] — Workspace architecture and caching
- [[module-boundaries]] — How projects relate (used by affected detection)
- [[ci-pipeline]] — Where these modes are chosen in practice
- [[pipeline-change-rules]] — Path-based gating, for stages that cannot run nx
- [[conditional-exports]] — The source-vs-built distinction `^build` sits on top of

## Sources

- [[raw/jarvis/agents/skills/nx-run-tasks/SKILL.md]]
- [[raw/jarvis/agents/skills/nx-workspace/SKILL.md]]
- [[raw/jarvis/agents/skills/nx-workspace/references/AFFECTED.md]]
- [[raw/jarvis/gitlab/ci/verify.yml]]
- [[raw/jarvis/github/workflows/ci.yml]]
- [[raw/docs/nx.md]]
