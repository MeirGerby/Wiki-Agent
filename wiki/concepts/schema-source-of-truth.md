# Schema Source of Truth

## Definition

Whether the database schema is defined in code and pushed to the database
(code-first) or read out of the database into code (database-first). The choice
determines which artifact wins when the two disagree — and disagreement is the
normal state, not the exception.

## Mental Model

Two directions, and a migration history that means something different in each:

```
code-first                    database-first
──────────                    ──────────────
schema.ts   (authored)        database   (authored, by whatever means)
    │                             │
    │ generate                    │ introspect / pull
    ▼                             ▼
migrations/ (derived)         schema.ts  (derived, overwritten each pull)
    │                             │
    │ apply                       │ consumed by
    ▼                             ▼
database    (derived)         application code
```

In code-first, `migrations/` is the *output* and the database is downstream of it.
In database-first, `schema.ts` is the *output* and gets regenerated.

The trap is running both. Then `migrations/` describes one history, `schema.ts`
describes a snapshot of a live database, and nothing reconciles them. Each looks
authoritative on its own.

## Recognising an introspected schema

Generated schema files have a distinctive smell. `@jarvis/db`'s `schema.ts` has all
of it:

**A placeholder type for what the generator could not parse.**

```ts
const unknown = customType<{ data: string }>({ dataType: () => 'name' });
// TODO: failed to parse database type 'name'
```

Nobody writes that by hand. It is a tool leaving a note.

**Things nobody would choose to model.** The file exports PostGIS system views,
with their internal SQL inlined:

```ts
export const geometryColumns = pgView('geometry_columns', { ... })
  .as(sql`SELECT current_database()::character varying(256) AS f_table_catalog, ...`);
```

Also `spatial_ref_sys`, and `deep_wisdom_models_backup` — a backup table, exported
as a first-class entity. Introspection sweeps up everything in the database; an
author picks.

**Defaults written the long way.**

```ts
id: integer().default(sql`nextval('deep_wisdom_models_id_seq'::regclass)`)
```

An author writes `serial()`. A generator reads the column's actual default and
prints what it found.

**Fossils of past renames.** Two sequences for one table —
`DeepWisdomModels_Id_seq` (PascalCase) and `deep_wisdom_models_id_seq` (snake_case)
— both still declared, because both still exist in the database.

## Example: a schema that disagrees with its own migrations

Jarvis's `libs/db` has five migrations and a `schema.ts` that does not match what
they produce:

| | `migrations/` says | `schema.ts` says |
|---|---|---|
| `objects.file_url` nullability | nullable — migration `0002_object_file_url_nullable` drops NOT NULL | `.notNull()` |
| timestamp column | `creation_time` | `create_time` |
| JSON columns | `jsonb` | `json()` |
| `objects.file_url` type | `text` | `varchar` |
| varchar length | `varchar(255)` | unbounded `varchar()` |

The nullability row is the sharpest. Migration `0002` exists for the sole purpose of
dropping that constraint, and the schema still declares it.

Why this matters in practice: `drizzle-kit generate` diffs the database against
**`schema.ts`**, not against the migration history. So the next generated migration
is computed from the introspected snapshot. Where `schema.ts` claims `notNull` and
the database does not have it, a generated migration may try to re-add the very
constraint migration `0002` removed.

This wiki records the divergence rather than picking a winner. Which artifact is
authoritative here is not stated anywhere in the sources.

## Reading the signal

If you find both a populated `migrations/` directory and a schema file with the
introspection markers above, the useful questions are:

- Which command does the team actually run — `generate` (code-first) or `pull`
  (database-first)?
- Was the database ever changed by hand, or by another service that owns some of
  these tables?
- Do the migrations replay cleanly onto an empty database, and does the result match
  `schema.ts`?

The presence of a `_backup` table and legacy PascalCase sequences suggests this
database predates the TypeScript code and was adopted rather than created by it —
which would make database-first the honest description, and the migrations folder a
partial record started later. That is inference from the artifacts, not something
the sources say.

## Related Concepts

- [[drizzle-orm]] — The ORM whose `generate` / `pull` commands this is about
- [[jarvis-data-model]] — The schema in question
- [[postgres-connections]] — Why migrations need a direct, unpooled connection
- [[jarvis-shared-libs]] — The library holding both artifacts

## Sources

- [[raw/jarvis/libs/db/src/schema.ts]]
- [[raw/jarvis/libs/db/migrations/0001_rapid_shinobi_shaw.sql]]
- [[raw/jarvis/libs/db/migrations/0002_object_file_url_nullable.sql]]
- [[raw/jarvis/libs/db/migrations/meta/_journal.json]]
- [[raw/jarvis/libs/DB-SCHEMA-MAP.md]]

The code-first/database-first framing and the `drizzle-kit generate` diff behaviour
are general knowledge. The column-level disagreements were read directly from the
files. That `schema.ts` was produced by introspection is **inference** — strongly
supported by the markers listed above, but stated nowhere in the sources.
`DB-SCHEMA-MAP.md` is a map derived from the same code files, not an independent
source.
