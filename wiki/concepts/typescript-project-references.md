# TypeScript Project References

## Definition

A TypeScript feature (`composite` + `references`) that splits one large compile into
many small ones, one per project, each cached independently. In an Nx monorepo it
is the mechanism underneath incremental builds: editing one library does not
retype-check the whole workspace.

## Mental Model

A monorepo with one flat `tsconfig.json` compiles as a single unit — touch any file,
recheck everything. Project references break that unit into a dependency graph of
smaller compiles:

```
root tsconfig.json (files: [], references: [...])
        │
        ├─▶ libs/db/tsconfig.json      ──▶ composite build, own .tsbuildinfo
        ├─▶ libs/logging/tsconfig.json ──▶ composite build, own .tsbuildinfo
        └─▶ apps/.../bff/tsconfig.json ──▶ not composite (nothing consumes its output)
```

TypeScript uses each project's `.tsbuildinfo` to know what changed and rechecks only
the affected slice of the graph — the same incremental idea [[nx-task-execution]]'s
`affected` applies at the task level, one layer down at the compiler level.

## The hierarchy in Jarvis

Three tiers, each extending the one above:

```
tsconfig.base.json          — the real settings: strict, target, module, lib
        │
        ├─ tsconfig.json (per project)  — files: [], references: [{ path: tsconfig.lib.json }]
        │        │
        │        └─ tsconfig.lib.json / tsconfig.app.json  — rootDir, outDir, the real include list
```

The per-project `tsconfig.json` is a router, not a config:

```json
{
  "extends": "../../../tsconfig.base.json",
  "files": [],
  "include": [],
  "references": [{ "path": "./tsconfig.lib.json" }],
  "compilerOptions": { "composite": false }
}
```

Empty `files`/`include` means this file compiles nothing itself — it exists so
`nx sync` has one stable entry point per project to point references at, while the
actual compiler options live in `tsconfig.lib.json` or `tsconfig.app.json`.

## What differs between an app, a library, and a tool

The same base config produces different behaviour depending on one flag:

| | Libraries (`db`, `logging`, `ui`) | Apps (`web`, `bff`) | Tooling (`nx-plugin`) |
|---|---|---|---|
| `composite` | inherited `true` | `false` | `false` |
| `emitDeclarationOnly` | `false` (emits `.d.ts` **and** `.js`) | `false` | `false`, plus `noEmit: true` |
| `declaration` / `declarationMap` | inherited `true` | `false` | `false` |
| `moduleResolution` | inherited `bundler` | `bundler` (web explicit) | `node10` |
| `customConditions` | inherited `["@jarvis/source"]` | inherited | `[]` (cleared) |
| `types` | none, or `["react"]` for ui | `["node"]` / Vite + node | `["node"]` |

**Why apps set `composite: false`.** Composite is for projects *other projects
import*. Nothing imports an app, so there is nothing to declare and no reason to pay
for `.d.ts` generation.

**Why the base sets `emitDeclarationOnly: true` but every concrete lib config
overrides it to `false`.** The base is a shared default; every real library needs
runtime `.js` output, not just types, so each one flips the flag back. This is worth
noticing precisely because it looks redundant until you read the base file and see
what it's overriding.

**Why `tools/nx-plugin` clears `customConditions`.** It sets `moduleResolution:
"node10"` and `module: "commonjs"`, because Nx runs generators directly under
Node, not through a bundler. `node10` resolution does not support conditional
exports at all, so declaring `@jarvis/source` there would do nothing — clearing it
just makes that explicit. See [[conditional-exports]] for what the condition does
where it *is* active.

## `customConditions` — where `@jarvis/source` actually lives

```json
// tsconfig.base.json
"moduleResolution": "bundler",
"customConditions": ["@jarvis/source"]
```

This is the piece [[conditional-exports]] and [[jarvis-shared-libs]] flagged as an
open question — the library `package.json` files declare the `@jarvis/source`
export condition, but nothing in `libs/` says who resolves it. The answer is here:
every project's tsconfig inherits it from `tsconfig.base.json`, so the TypeScript
language service and any bundler reading the same tsconfig resolve workspace
packages straight to `.ts` source. Runtime `node` resolution does not know about
custom conditions at all, which is why the resolved-and-built code that actually
ships still needs the standard `import`/`default` conditions in each package's
`exports` map.

## Emit shapes, one per project kind

| Kind | `emitDeclarationOnly` | `declaration` | Emits |
|---|---|---|---|
| Library | `false` | `true` | `.js` + `.d.ts` + `.d.ts.map` |
| App | `false` | `false` | `.js` only |
| Tooling | `false`, plus `noEmit: true` | `false` | nothing — type-check only |

Tooling's `noEmit: true` exists because Nx's own build system produces the output
for generators; the tsconfig here is purely a type-checking gate.

## `forceConsistentCasingInFileNames`

Set on every library and on the contract package, absent from the base config —
each one opts in individually. It errors on an import whose casing does not match
the file on disk. On a case-insensitive filesystem (macOS, Windows — [[node-env]]
territory) that mismatch compiles locally and breaks in CI on Linux, so the check
exists specifically to catch a class of bug that a same-OS dev loop cannot surface.

## Related Concepts

- [[conditional-exports]] — What `customConditions` activates, and where the switch actually lives
- [[jarvis-shared-libs]] — The libraries whose `tsconfig.lib.json` this generalizes
- [[nx-monorepo]] — The workspace this hierarchy spans
- [[nx-task-execution]] — Incremental task caching, one layer above incremental compiling
- [[workspace-linking]] — How a workspace package resolves before TypeScript is even involved

## Sources

- [[raw/docs/tsconfig.md]]

This is a consolidated reference document, not application source — it summarizes
`tsconfig.json` files across the workspace rather than being one itself. Project
references and composite-build mechanics in general are standard TypeScript
behaviour (general knowledge); the specific per-tier settings and the
`customConditions` clearing in `tools/nx-plugin` are read directly from the source.
The reasoning given for `forceConsistentCasingInFileNames` (cross-platform CI
breakage) is general knowledge applied to what the flag does, not stated in the
source.
