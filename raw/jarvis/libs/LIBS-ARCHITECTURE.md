# Jarvis Shared Libraries — Architecture Map

> **Derived document.** Written by reading the source files listed under *Files read*
> at the bottom. It is not an independently authored spec. Statements of fact are
> quoted or traceable to those files; statements of intent are marked as inference.

## The three libraries

| Package | nx tags | Runtime deps | Purpose |
|---|---|---|---|
| `@jarvis/db` | `type:data`, `scope:shared` | `drizzle-orm`, `postgres` | Schema, relations, connection factory, seed |
| `@jarvis/logging` | `type:util`, `scope:shared` | `zod` | Structured console logger, error serialization, log wire schema |
| `@jarvis/ui` | `type:ui`, `scope:shared` | `radix-ui`, `cva`, `clsx`, `tailwind-merge`, `lucide-react`, `sonner` | shadcn/ui component library |

All three are `"private": true`, `"type": "module"`, version `0.0.1`. None is
published; they exist only inside the workspace.

Every tag is `scope:shared`. There is no per-context library — the shared tier is
flat, and the only bounded context consuming it is `model-catalog`.

## The convention that ties them together

Each package declares a custom export condition, `@jarvis/source`, ahead of the
standard ones:

```json
".": {
  "@jarvis/source": "./src/index.ts",
  "types": "./dist/index.d.ts",
  "import": "./dist/index.js",
  "default": "./dist/index.js"
}
```

A consumer configured to resolve `@jarvis/source` gets **TypeScript source**.
Anything else gets **compiled `dist/`**. One package.json therefore serves two
different consumers, and the first needs no build step in between.

*Inference:* this is the usual way to let in-workspace tooling type-check against
live source (no stale `dist/`, no watch-rebuild chain) while production builds
consume compiled output. The files declare the condition but do not explain it, and
the tsconfig/bundler setting that actually activates `@jarvis/source` is **not in
this directory** — it lives in workspace root config, outside the files read here.

`@jarvis/ui` extends the same pattern to wildcard subpaths:

```json
"./components/*": { "@jarvis/source": "./src/components/*.tsx", ... },
"./lib/*":        { "@jarvis/source": "./src/lib/*.ts", ... },
"./hooks/*":      { "@jarvis/source": "./src/hooks/*.ts", ... }
```

Note: `src/hooks/` **does not exist**. The export path is declared for a directory
that has not been created.

`./globals.css` is exported straight from `src/` with no dist variant — CSS is not
compiled by this pipeline.

## Dependency direction

```
        @jarvis/ui  ──────┐   (peer: react 19)
                          │
     @jarvis/logging ─────┼──▶  apps/model-catalog/{web,bff}
                          │
        @jarvis/db  ──────┘   (bff only — web never imports it)
```

No library imports another. They are three independent leaves, not a layered stack.
`@jarvis/ui` takes `react` as a **peer** dependency, so the app controls the React
version rather than the library pinning it.

## @jarvis/db

`createDb` is a factory, not a singleton:

```ts
export const createDb = ({ connectionString, ssl, max = 10 }: CreateDbOptions) => {
  const client = postgres(connectionString, { max, ssl });
  const db = drizzle(client, { schema });
  return { db, client };
};
export type Db = ReturnType<typeof createDb>['db'];
```

It returns both `db` and the raw `client`. The pool defaults to `max: 10`.

`Db` is *derived* from the return type rather than declared. That is what carries
the schema generic into every consumer, and is why `db.query.<table>` is typed
downstream without anyone restating the schema.

Two export paths: `.` (connection plus everything re-exported from schema) and
`./schema` (schema only, so a consumer that just needs types does not pull in the
`postgres` driver).

### drizzle.config.ts carries a load-bearing comment

```
// `generate` needs no database and ignores the URL below. `migrate`, `push` and
// `studio` do connect. They read the BFF's .env, and use the direct (unpooled)
// Neon connection — pooled connections break migrations.
```

`migrationUrl` resolves `DATABASE_URL_UNPOOLED ?? DATABASE_URL ?? ''`, and the
config reaches **up out of the library** into `apps/model-catalog/bff/.env` to get
it. The library is not self-contained for migration purposes; it borrows the app's
environment.

See `DB-SCHEMA-MAP.md` for the tables, and for the drift between the migration
history and `schema.ts`.

## @jarvis/logging

Three concerns in roughly 110 lines of source.

### 1. The wire schema (`index.ts`)

What a log looks like when it crosses a network boundary:

```ts
export const logSchema = z.looseObject({
  level: z.enum(LogLevel),      // info | warn | error | debug
  project: z.enum(Project),     // model-catalog-web | model-catalog-bff
  event: z.string(),
  message: z.string(),
  ts: z.string(),
  error: z.unknown().optional(),
});
export const logBatchSchema = z.array(logSchema);
```

`Project` includes **both** the web and the bff. Combined with `logBatchSchema`
being an array and `SESSION_ID_HEADER = 'x-session-id'`, this says the browser
batches its own logs and ships them to the backend, tagged with a session id so a
single user's frontend and backend logs can be stitched together.

*Inference:* the receiving endpoint lives in the BFF and is not in this directory.

`z.looseObject` means unknown extra fields survive validation instead of being
stripped, so arbitrary structured context can ride along on a log line.

### 2. The logger (`console-logger.ts`)

A severity-gated JSON-line writer:

```ts
const SEVERITY = { debug: 10, info: 20, warn: 30, error: 40 };
```

`createConsoleLogger(level)` closes over a threshold and returns one `LogFn` per
level. Output is a single `JSON.stringify` line. `error` goes to `console.error`,
`warn` to `console.warn`, everything else to `console.log`.

Field order is `level`, `time`, then caller fields spread in, then `msg` last.
Because the caller's fields are spread in the middle, **a caller field named
`level` or `time` silently overwrites the built-in, and a caller field named `msg`
is silently overwritten by the message argument.**

### 3. A cycle-avoidance note worth keeping

```ts
// Type-only, so this erases at runtime and creates no cycle with index.ts.
import type { LogFieldValue, LogLevel } from './index.js';
```

`index.ts` re-exports from `console-logger.ts`, which imports back from `index.ts`.
The `import type` form erases at compile time, so no runtime cycle exists. Changing
it to a value import would reintroduce one.

### Two error serializers that are not the same

| | `serializeError` (`error.utils.ts`) | `toLogError` (`console-logger.ts`) |
|---|---|---|
| Non-`Error` input | returned **unchanged** | wrapped as `{ name: 'NonError', message: String(error) }` |
| Return type | `T \| SerializedError` | always `SerializedError` |

Both are exported from the package index. The source does not say which to prefer
and marks neither as deprecated. **Recorded as an unresolved duplication, not
resolved here.**

## @jarvis/ui

See `UI-INVENTORY.md`.

## Build setup (all three)

`tsconfig.lib.json` extends `../../tsconfig.base.json` with `rootDir: src`,
`outDir: dist`, incremental builds via `tsBuildInfoFile`, and `"references": []` —
no TypeScript project references between the libraries, which is consistent with
them having no dependencies on each other.

`@jarvis/db` and `@jarvis/logging` have committed `dist/` output alongside `src/`.
`@jarvis/ui` has **no** `dist/` — only source. *Inference:* the web app compiles UI
components through its own bundler, which makes the `dist/*` targets in the ui
exports map unreachable in practice.

## Open questions these files do not answer

- Where `@jarvis/source` is activated (workspace root config, not read here).
- Which endpoint receives `logBatchSchema` batches.
- Whether `serializeError` or `toLogError` is the intended one.
- Why `./hooks/*` is exported when `src/hooks/` does not exist.

## Files read

- `libs/db/package.json`, `libs/db/drizzle.config.ts`, `libs/db/src/index.ts`,
  `libs/db/tsconfig.lib.json`
- `libs/logging/package.json`, `libs/logging/src/index.ts`,
  `libs/logging/src/console-logger.ts`, `libs/logging/src/error.utils.ts`
- `libs/ui/package.json`, `libs/ui/components.json`, `libs/ui/src/lib/utils.ts`
