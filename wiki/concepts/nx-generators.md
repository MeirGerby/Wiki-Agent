# Nx Generators

## Definition

Automated code scaffolding tools in Nx that create new projects, libraries, or features while ensuring consistency with existing workspace patterns. Generators can be provided by Nx plugins (e.g., `@nx/react:library`) or custom-written for a specific monorepo (workspace generators).

## Mental Model

Think of them as starter templates with intelligence — instead of copying a folder and manually editing 10 files, you run a command and the generator understands your workspace's conventions (naming, folder structure, testing setup, etc.) and generates code that already fits.

## Example

**Create a new React library in Jarvis**:
```bash
nx g @nx/react:library --name=components --directory=libs/ui/components
```

**Create a context using Jarvis's custom generator**:
```bash
nx g @jarvis/nx-plugin:context --name=payments
```

This generates a full three-package context, not just three empty folders:

```
apps/payments/
├── contract/
│   ├── src/index.ts          # Zod schemas — the published interface
│   ├── tsconfig.json
│   └── tsconfig.lib.json
├── bff/
│   ├── src/
│   │   ├── router.ts         # tRPC procedures
│   │   ├── container.ts      # DI container wiring — see [[awilix]]
│   │   ├── server.ts         # Hono app entry point
│   │   └── ...routers
│   ├── Dockerfile
│   ├── vite.config.mts
│   └── project.json
└── web/
    ├── src/
    │   ├── router-context.ts # TanStack Router context
    │   ├── main.tsx
    │   └── routes/
    ├── index.html
    ├── Dockerfile
    └── vite.config.mts
```

All with correct TypeScript configs, project.json, and import paths, plus the tags
that put the new context under [[module-boundaries]]'s enforcement
(`scope:payments`, `type:{contract,bff,web}`) and wire it into `tsconfig.json`
references — see [[typescript-project-references]] for what that reference does.

The alternative, adding a context by hand, is documented but explicitly the second
choice: create the three `project.json` files, apply the tags yourself, add the
`tsconfig.json` reference, then run `nx sync` to reconcile workspace config with
what you just wrote. Every step the generator does automatically is a step manual
setup can get subtly wrong — a missed tag is a module-boundary violation that
doesn't surface until someone tries to import across it.

## Buildable vs Non-Buildable Libraries

**Non-buildable** (default for internal libs):
- Export `.ts`/`.tsx` source directly
- Consumer's bundler compiles them
- Faster dev experience, simpler setup
- Good for: UI components, utilities consumed by apps in the same repo

**Buildable**:
- Have their own build target (`nx build @lib/name`)
- Compiled output can be published to npm
- Better caching (stable libs rarely rebuild)
- Good for: Published packages, cross-repo sharing, stable utilities

## Key Principles

1. **Prefer workspace generators** — Custom generators beat plugin generators because they know your repo's patterns
2. **Always dry-run first** — Use `--dry-run` to verify file placement before committing
3. **Read the source code** — Schema alone doesn't show side effects or hidden behaviors
4. **Match existing patterns** — Study similar artifacts in the repo before running the generator
5. **Verify output** — Run `lint`, `test`, `build`, `typecheck` on generated code

## Related Concepts

- [[nx-monorepo]]
- [[bounded-contexts]]
- [[nx-import]] — Bringing in existing code instead of generating new
- [[typescript-project-references]] — What the generated tsconfig reference does
- [[module-boundaries]] — The tags this generator assigns automatically
- [[awilix]] — What `container.ts` wires up in a generated BFF

## Sources

- [[raw/jarvis/agents/skills/nx-generate/SKILL.md]]
- [[raw/docs/nx.md]]
