# Repository Import into Nx

## Definition

The process of bringing code from a source repository (or subdirectory) into an Nx workspace, preserving commit history and merging build configuration, dependencies, and project metadata. Two strategies exist: subdirectory-at-a-time (preferred for monorepos) or whole-repo (for single projects).

## Mental Model

Think of merging libraries from separate buildings into one large campus. If the library (source) was a standalone building, you move the whole thing. If it's a wing from a larger library, you move just that wing and connect it to the campus infrastructure rather than recreating walls and wiring.

## Import Strategies

### Subdirectory-at-a-Time (Recommended)

Import one directory at a time from a monorepo source:

```bash
nx import <source-repo> apps/imported-app --source=apps/my-app
nx import <source-repo> libs/utils --source=libs/utils
```

**Advantages**:
- Files land at top level with no redundant nesting
- Respects destination conventions (apps vs libs vs packages)
- Cleaner file structure

**Caveats**:
- Multiple import commands (separate merge commits)
- Destination directory must be empty (avoid conflicts)
- Root config **not imported**: dependencies, `targetDefaults`, `namedInputs`, plugins
- Source root ESLint config and Jest preset don't come over

### Whole-Repo (Single Projects Only)

Import an entire non-monorepo source:

```bash
nx import <source-repo> imported --source=.
```

**Use only for**: Single-project repos (CRA app, NestJS server, etc.)

**Avoid for**: Monorepos — creates messy nested config (`imported/nx.json`, `imported/tsconfig.base.json`).

## Application vs Library Detection

Before importing, identify the source to choose the right destination directory:

### Applications
Deployable end products:
- **Frontend**: `next.config.*`, `vite.config.*`, CRA scaffolding, etc.
- **Backend**: Express/Fastify/NestJS entrypoint, no `"exports"` in package.json
- **JVM**: Maven `pom.xml` with `<packaging>jar</packaging>` or Gradle `application` plugin
- **General indicators**: Dockerfile, runnable entrypoint, not intended for import by other projects

→ Destination: **`apps/<name>`** (add `apps/*` to workspace globs if missing)

### Libraries
Reusable packages consumed by other projects:
- **JS/TS**: `"main"` and `"exports"` in package.json
- **JVM**: Maven/Gradle packaging as library jar
- **General indicators**: Public API for import by other packages

→ Destination: Follow destination convention (`packages/`, `libs/`, etc.)

## Critical Issues & Fixes

### 1. Missing Root Config (Subdirectory Import)

`nx import` does **NOT** merge:
- `dependencies` / `devDependencies` from source `package.json`
- `targetDefaults` from `nx.json` (critical for build ordering)
- `namedInputs` from `nx.json` (production input exclusion patterns)
- Plugin configurations

**Fix**: Diff source and destination `package.json` + `nx.json`. Add missing deps and `targetDefaults` manually.

### 2. pnpm Workspace Globs

`nx import` adds the directory itself to `pnpm-workspace.yaml`, **NOT** glob patterns.

```yaml
# Wrong (what nx import does)
- apps
- libs

# Right (what's needed)
- apps/*
- libs/**/*
```

**Fix**: Replace with proper globs from source config, then `pnpm install`.

### 3. TypeScript Project References

After import, `nx sync` may not detect all references.

**Fix**: `nx reset` first, then `nx sync --yes`.

### 4. Frontend TypeScript Config

Destination's `tsconfig.base.json` defaults (`module: "nodenext"`, `moduleResolution: "nodenext"`) break frontend projects.

**For frontend**: Override with:
```json
{
  "module": "esnext",
  "moduleResolution": "bundler",
  "lib": ["es2022", "dom", "dom.iterable"]
}
```

**Gotcha**: TypeScript does NOT merge `lib` arrays — project overrides **replace** the base, so always include all needed entries.

### 5. ESLint Root Config Missing (Subdirectory Import)

Source project configs reference `../../eslint.config.mjs` which doesn't exist.

**Fix order**:
1. Install deps: `pnpm add -wD eslint@^9 @nx/eslint-plugin typescript-eslint`
2. Create root `eslint.config.mjs`
3. Run `npx nx add @nx/eslint`

**Pin ESLint to v9** — v10 breaks `@nx/eslint` with cryptic errors.

### 6. Jest Preset Missing (Subdirectory Import)

Source configs reference `../../jest.preset.js` which doesn't exist.

**Fix**:
1. Run `npx nx add @nx/jest`
2. Manually create `jest.preset.js` at workspace root
3. Install deps: `pnpm add -wD jest jest-environment-jsdom ts-jest`

### 7. Explicit Executor Path Fixups

Inferred targets (via plugins) auto-resolve relative to project. Explicit targets (e.g., `@nx/esbuild:esbuild`) have workspace-root-relative paths that need prefixing with the import destination.

### 8. Module Boundaries

Imported projects may lack tags. Add `scope` and `type` tags or update `@nx/enforce-module-boundaries` rules.

### 9. Project Name Collisions

Same `name` in `package.json` across source and destination causes errors.

**Fix**: Rename (e.g., `@org/api` → `@org/team-api`), update all imports, `pnpm install`.

## Related Concepts

- [[nx-monorepo]] — Overview of Nx workspaces
- [[nx-generators]] — Scaffolding new projects (alternative to importing)
- [[module-boundaries]] — Dependency rules after import

## Sources

- [[raw/jarvis/agents/skills/nx-import/SKILL.md]]
- [[raw/jarvis/agents/skills/nx-import/references/JEST.md]]
- [[raw/jarvis/agents/skills/nx-import/references/ESLINT.md]]
- [[raw/jarvis/agents/skills/nx-import/references/NEXT.md]]
- [[raw/jarvis/agents/skills/nx-import/references/VITE.md]]
