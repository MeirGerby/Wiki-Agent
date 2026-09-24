# Workspace Linking

## Definition

In a monorepo, the process of declaring dependencies between packages so the package manager creates symlinks in `node_modules/`. This allows one package to import from a sibling package without publishing to npm. Each package manager uses different syntax to achieve this.

## Mental Model

Imagine a shared library section in a mall. Instead of copying the entire library to each store, you create a symbolic pointer to the shared library. When a store needs something, it follows the pointer to get it directly. Workspace linking is that pointer system for packages.

## Example

**Scenario**: You have a React app (`@jarvis/web`) that needs to import from a UI library (`@jarvis/ui`) in the same monorepo.

**With pnpm** (Jarvis uses this):
```bash
pnpm add @jarvis/ui --filter @jarvis/web --workspace
```

Result in `apps/model-catalog/web/package.json`:
```json
{ "dependencies": { "@jarvis/ui": "workspace:*" } }
```

This creates a symlink: `apps/model-catalog/web/node_modules/@jarvis/ui` → `libs/ui`

**With npm**:
```bash
npm install @jarvis/ui --workspace @jarvis/web
```

Result in `package.json`:
```json
{ "dependencies": { "@jarvis/ui": "*" } }
```

npm auto-symlinks because it knows about workspaces.

## Package Manager Differences

| Package Manager | Protocol     | Hoisting | Symlink Behavior |
|-----------------|--------------|----------|------------------|
| **pnpm**        | `workspace:` | None (strict isolation) | Explicit declaration creates symlink |
| **npm**         | None needed  | Hoists to root | Auto-symlinks workspace packages |
| **yarn v2+**    | `workspace:` | Plug'n'Play | No `node_modules` by default |
| **bun**         | `workspace:` | Hoists | Auto-symlinks |

**pnpm's "strict isolation"** prevents phantom dependencies—you can only use packages you've explicitly declared.

## Common Errors & Solutions

- **"Cannot find module @jarvis/ui"** → Dependency not declared; add with workspace command
- **"TS2307: Cannot find module"** → TypeScript can't resolve; check `tsconfig.json` paths and workspace declaration
- **Symlink not in `node_modules/`** → Run `pnpm install` / `npm install` after declaring the dependency

## Related Concepts

- [[nx-monorepo]]
- [[bounded-contexts]]

## Sources

- [[raw/jarvis/agents/skills/link-workspace-packages/SKILL.md]]
