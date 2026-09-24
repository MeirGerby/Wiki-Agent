# Jarvis Shared Libraries

## Definition

Three libraries under `libs/` that both Jarvis applications draw on: `@jarvis/db`
(schema and connections), `@jarvis/logging` (structured logs) and `@jarvis/ui`
(React components). All are private to the workspace and none is published.

## Mental Model

The instinct with shared code is to build a stack — a base layer, then something on
top of it, then the app. Jarvis does not do that. The three libraries are **leaves,
not layers**:

```
        @jarvis/ui  ──────┐   (peer: react 19)
                          │
     @jarvis/logging ─────┼──▶  apps/model-catalog/{web,bff}
                          │
        @jarvis/db  ──────┘   (bff only)
```

No library imports another. Their `tsconfig.lib.json` files all carry
`"references": []`, which is the compiler-level statement of the same fact.

The payoff is that each can be understood, built and changed on its own. The cost
is that anything genuinely common between them has nowhere to live — so far nothing
has needed to.

## Shared conventions

Every package agrees on:

| | |
|---|---|
| `"private": true` | never published |
| `"type": "module"` | ESM only, `.js` extensions in relative imports |
| version `0.0.1` | versions are not used; the workspace is the unit |
| nx tags | `scope:shared` on all three, plus a `type:` tag |
| export condition | `@jarvis/source` before the standard ones — see [[conditional-exports]] |

The `type:` tags — `type:data` on db, `type:util` on logging, `type:ui` on ui — are
what [[module-boundaries]] lint rules key off. Every library is `scope:shared`;
there is no per-context library, because `model-catalog` is currently the only
bounded context consuming them.

## @jarvis/db

Exposes a **factory**, not a shared singleton:

```ts
export const createDb = ({ connectionString, ssl, max = 10 }: CreateDbOptions) => {
  const client = postgres(connectionString, { max, ssl });
  const db = drizzle(client, { schema });
  return { db, client };
};

export type Db = ReturnType<typeof createDb>['db'];
```

Two details do real work here:

**It returns the raw `client` alongside `db`.** Drizzle covers queries; the client
is still needed for shutdown and for anything Drizzle does not model — a `LISTEN`
subscription, for instance (see [[postgres-listen-notify]]).

**`Db` is derived, not declared.** Writing `ReturnType<typeof createDb>['db']`
rather than a hand-written interface carries the schema generic into every
consumer, which is what makes `db.query.<table>` typed downstream without anyone
restating the schema. Declaring `Db` by hand would break that link silently.

The package offers two entry points: `.` for connection plus schema, and `./schema`
for schema alone — so a consumer that only needs types does not pull the `postgres`
driver into its bundle.

See [[drizzle-orm]] for the ORM itself and [[jarvis-data-model]] for the tables.

## @jarvis/logging

Covered in [[logging]]. In short: a Zod-validated wire schema shared by frontend and
backend, a severity-gated JSON-line console logger, and error serialization.

## @jarvis/ui

A vendored shadcn/ui component set — see [[shadcn-ui]]. It is the only library
taking a **peer** dependency (`react ^19.0.0`), so the app controls the React
version rather than the library pinning it.

It is also the only one with no committed `dist/`. The web app compiles the
components through its own bundler.

## Example: what "shared" costs

`libs/db/drizzle.config.ts` reaches out of the library to find its database URL:

```ts
config({
  path: fileURLToPath(
    new URL('../../apps/model-catalog/bff/.env', import.meta.url),
  ),
});
```

The library owns the schema but not the credentials, so for migrations it borrows
the BFF's environment. That is a deliberate trade — one `.env` instead of two that
can disagree — but it means `@jarvis/db` is not self-contained: running its
migration commands depends on an application directory existing at a fixed relative
path.

## Related Concepts

- [[conditional-exports]] — The `@jarvis/source` condition all three use
- [[drizzle-orm]] — The ORM behind `@jarvis/db`
- [[jarvis-data-model]] — The schema `@jarvis/db` defines
- [[logging]] — What `@jarvis/logging` provides
- [[shadcn-ui]] — What `@jarvis/ui` is built from
- [[module-boundaries]] — The tags that constrain who may import these
- [[nx-monorepo]] — The workspace holding them
- [[jarvis]] — The project

## Sources

- [[raw/jarvis/libs/db/package.json]]
- [[raw/jarvis/libs/db/src/index.ts]]
- [[raw/jarvis/libs/db/drizzle.config.ts]]
- [[raw/jarvis/libs/db/tsconfig.lib.json]]
- [[raw/jarvis/libs/logging/package.json]]
- [[raw/jarvis/libs/ui/package.json]]
- [[raw/jarvis/libs/LIBS-ARCHITECTURE.md]]

The reading of `createDb` returning the client "for what Drizzle does not model" is
inference from the return shape; the source states neither a reason nor a consumer.
`LIBS-ARCHITECTURE.md` is a map derived from the code files above, not an
independent source.
