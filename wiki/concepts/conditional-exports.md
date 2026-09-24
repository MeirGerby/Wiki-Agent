# Conditional Exports

## Definition

The `exports` field in `package.json` maps an import specifier to different files
depending on **conditions** the resolver declares. A custom condition lets one
package serve TypeScript source to some consumers and compiled JavaScript to
others, from a single manifest.

## Mental Model

A normal package answers "where is `@jarvis/db`?" with one file. A package with
conditional exports answers with a **decision tree**, and the resolver walks it top
to bottom taking the first branch whose condition is active:

```
import '@jarvis/db'
        │
        ├─ is "@jarvis/source" active? ──▶ ./src/index.ts      (TypeScript)
        ├─ asking for types?           ──▶ ./dist/index.d.ts
        ├─ an ESM import?              ──▶ ./dist/index.js
        └─ otherwise                   ──▶ ./dist/index.js
```

Order matters and is the author's, not the resolver's. The first match wins, so the
most specific condition goes first.

The idea to hold onto: **the same import line means different things to different
tools, on purpose.**

## The problem it solves in a monorepo

A library that ships compiled output creates a build step between "I edited the
library" and "the app sees my edit". That gives you the stale-`dist/` problem: the
editor reports errors against yesterday's build, and you fix code that is already
correct. The usual escape is a watch-rebuild chain, which is machinery to maintain
and a race to lose.

A custom condition removes the middle step for in-workspace consumers only. Tooling
inside the workspace resolves to `src/*.ts` and type-checks against live source.
The production build resolves the same specifier to `dist/`.

## Example

All three Jarvis libraries declare the condition the same way:

```json
{
  "exports": {
    "./package.json": "./package.json",
    ".": {
      "@jarvis/source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./schema": {
      "@jarvis/source": "./src/schema.ts",
      "types": "./dist/schema.d.ts",
      "import": "./dist/schema.js",
      "default": "./dist/schema.js"
    }
  }
}
```

Two things beyond the condition itself:

**Subpath exports are an API boundary.** `@jarvis/db` exposes `.` and `./schema`
and nothing else. A consumer cannot reach into `@jarvis/db/src/seed.js` — the
exports map makes anything unlisted unreachable, which turns "internal" from a
convention into something the resolver enforces.

**`./package.json` is listed explicitly.** Once an `exports` map exists, every
unlisted path is blocked, including the manifest that tooling often wants to read.

`@jarvis/ui` extends the pattern to wildcards, so one entry covers every component:

```json
"./components/*": {
  "@jarvis/source": "./src/components/*.tsx",
  "types": "./dist/components/*.d.ts",
  "import": "./dist/components/*.js",
  "default": "./dist/components/*.js"
}
```

`import { Button } from '@jarvis/ui/components/ui/button'` resolves to the `.tsx`
under the source condition and to built `.js` otherwise. Note the extension differs
between branches — `.tsx` on the left, `.js` on the right — which a wildcard handles
and a plain path alias could not.

CSS opts out entirely: `"./globals.css": "./src/styles/globals.css"` is a plain
string with no conditions, because there is no compiled variant.

## Gotchas

**The condition has to be switched on somewhere — and now this page can say where.**
A custom name means nothing by itself; a bundler or tsconfig has to declare it
active. `tsconfig.base.json` does exactly that:

```json
"moduleResolution": "bundler",
"customConditions": ["@jarvis/source"]
```

Every project's tsconfig inherits it, so TypeScript's language service and any
bundler reading the same config resolve workspace imports straight to `.ts` source.
One project opts back out: `tools/nx-plugin` sets `customConditions: []` and
`moduleResolution: "node10"`, because Nx generators run directly under Node, and
`node10` resolution predates conditional exports entirely — declaring the condition
there would do nothing, so the config clears it explicitly rather than leaving a
dead setting. See [[typescript-project-references]] for the full tier-by-tier
breakdown.

**Declared paths are not checked against disk.** `@jarvis/ui` exports `./hooks/*`,
but `src/hooks/` does not exist. Nothing errors until someone imports from it.

**A missing `dist/` makes the fallback unreachable.** `@jarvis/ui` has no committed
`dist/`, so every non-source branch of its map points at files that are not there.
It works because the only consumer resolves through the source condition — but the
map claims a capability the package does not have.

## Related Concepts

- [[jarvis-shared-libs]] — The three libraries using this
- [[typescript-project-references]] — Where `customConditions` is declared and why one project clears it
- [[workspace-linking]] — How workspace packages resolve to each other
- [[nx-monorepo]] — The workspace context
- [[module-boundaries]] — The other mechanism restricting what may import what

## Sources

- [[raw/jarvis/libs/db/package.json]]
- [[raw/jarvis/libs/logging/package.json]]
- [[raw/jarvis/libs/ui/package.json]]
- [[raw/jarvis/libs/LIBS-ARCHITECTURE.md]]
- [[raw/docs/tsconfig.md]]

Node's `exports` resolution rules and the stale-`dist/` problem are general
knowledge. The Jarvis files declare `@jarvis/source` without stating its purpose, so
the rationale above is inference. The configuration that activates the condition —
previously an open question on this page — was found in `raw/docs/tsconfig.md` and
is now documented above.
