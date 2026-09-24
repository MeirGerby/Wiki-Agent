# Drizzle ORM

## Definition

A TypeScript-first object-relational mapper (ORM) for SQL databases that generates type-safe queries from schema definitions. Unlike ORMs that hide SQL (e.g., Sequelize, TypeORM), Drizzle keeps you close to SQL while adding type safety and migrations.

## Mental Model

Think of a translator who knows SQL deeply. Instead of learning a new query language (ORM abstractions), you write SQL-like code and the translator ensures the types match your schema and generates the correct SQL behind the scenes.

## Example

```typescript
// Define schema (single source of truth)
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const models = pgTable('models', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  version: text('version').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type-safe queries with inferred types
import { db } from './db';

const allModels = await db.select().from(models);
// TypeScript knows allModels is Array<{ id: number; name: string; ... }>

const newModel = await db.insert(models).values({
  name: 'yolov8',
  version: '8.0',
});
// TypeScript error if you miss a required field
```

## In Jarvis

- **Location** — `libs/db/` package in the monorepo
- **Migrations** — Managed by `drizzle-kit` CLI
- **Seed script** — `libs/db/dist/seed.js` (built from TypeScript)
- **Commands**:
  ```bash
  pnpm db:generate  # generate SQL migration files
  pnpm db:migrate   # apply migrations to database
  pnpm db:seed      # run seed script (fresh data)
  ```

## Type System in Jarvis

Drizzle integrates with tRPC to create end-to-end type safety:

```typescript
// 1. Define database schema
export const models = pgTable('models', {
  id: text('id').primaryKey(),
  englishName: text('english_name').notNull(),
  operationalStatus: text('operational_status').notNull(),
  // ... more fields
});

// 2. Generate database type
const ModelRow = createSelectSchema(models);

// 3. Create API type (refined, fewer fields)
const Model = z.object({
  id: z.string(),
  englishName: z.string(),
  operationalStatus: OperationalStatus,
  // Only expose what frontend needs
});

// 4. Use in tRPC
catalog.query('getModel', {
  input: z.object({ id: z.string() }),
  output: Model,
  resolve: async ({ input }) => {
    const row = await db.query.models.findFirst({
      where: eq(models.id, input.id),
    });
    // row has all database fields
    // Return statement type-checked against Model output schema
    return { id: row.id, englishName: row.englishName, ... };
  },
});

// 5. Client gets full type
const model = await client.catalog.getModel.query({ id: 'model_123' });
// model is typed as Model (only the public fields)
```

## Migrations

Drizzle generates SQL migrations from schema changes:

```bash
# Generate migration from schema diff
pnpm db:generate

# Apply to database
pnpm db:migrate

# Run seed script
pnpm db:seed
```

Migrations are version-controlled. "No manual SQL needed" holds for schema changes,
but not universally — Jarvis's `0004_uppercase_operational_status` is hand-written
SQL that no schema diff would produce:

```sql
UPDATE "sqrules" SET "operational_status" = upper("operational_status")
WHERE "operational_status" != upper("operational_status");
```

`generate` diffs structure. Data fixes are still written by hand and dropped into
the same folder.

**Caveat on what `generate` diffs against.** It compares the database to
`schema.ts` — not to the migration history. In Jarvis those two have diverged, so
the next generated migration is computed from an introspected snapshot rather than
from the replayed history. See [[schema-source-of-truth]].

## The connection factory

`libs/db/src/index.ts` wires Drizzle to the `postgres` driver and returns both:

```ts
export const createDb = ({ connectionString, ssl, max = 10 }: CreateDbOptions) => {
  const client = postgres(connectionString, { max, ssl });
  const db = drizzle(client, { schema });
  return { db, client };
};

export type Db = ReturnType<typeof createDb>['db'];
```

Passing `{ schema }` into `drizzle()` is what enables the relational query builder
(`db.query.<table>.findFirst(...)`). Without it you still get the SQL-like builder,
but `db.query` is empty.

`Db` being *derived* from the return type rather than declared is what carries the
schema generic to every consumer. A hand-written `Db` interface would compile and
silently lose the table types.

## Inferred row types

Every table exports a select/insert pair:

```ts
export type ObjectRow    = typeof objects.$inferSelect;
export type NewObjectRow = typeof objects.$inferInsert;
```

They differ in the ways that matter: `$inferInsert` makes columns with defaults
optional and respects nullability, so an insert type is not just a partial of the
select type.

Note the naming workaround — `ObjectRow`, `PermissionRow`, `SpatialRefSysRow` carry
a `Row` suffix because `Object` and `Permission` collide with global names, and
`GeographyArea` avoids the same problem. Worth knowing before assuming a type is
missing.

Typing fixtures against the insert types (`SEED_USERS: readonly NewUser[]`) makes a
schema change break the seed at compile time rather than at runtime.

## Relations are not constraints

`relations.ts` declares associations separately from the table definitions:

```ts
export const rulesRelations = relations(rules, ({ one, many }) => ({
  detectingModelsRules: many(detectingModelsRules),
  geography: one(geographies, {
    fields: [rules.geographyName], references: [geographies.name],
  }),
}));
```

These drive `db.query.<table>.with(...)`. They are **application-level metadata, not
database constraints** — declaring a relation creates no foreign key, and Drizzle
will happily describe a relationship the database does not enforce. Jarvis has
several such cases; see [[jarvis-data-model]].

## Related Concepts

- [[jarvis-bff]] — BFF uses Drizzle for queries
- [[jarvis-data-model]] — Schema definition
- [[trpc]] — Type safety end-to-end
- [[neon-lakebase]] — Database provider
- [[postgres-connections]] — Connection management
- [[nx-monorepo]] — Monorepo organization
- [[jarvis-shared-libs]] — The `@jarvis/db` package around this
- [[schema-source-of-truth]] — What `generate` diffs against, and the drift

## Sources

- [[raw/jarvis/package.json]]
- [[raw/jarvis/libs/db/src/index.ts]]
- [[raw/jarvis/libs/db/src/schema.ts]]
- [[raw/jarvis/libs/db/src/relations.ts]]
- [[raw/jarvis/libs/db/src/seed-data.ts]]
- [[raw/jarvis/libs/db/migrations/0004_uppercase_operational_status.sql]]

The `models` table in the "Type System in Jarvis" example above is illustrative and
does not exist in the real schema — the catalog has four separate model tables. See
[[jarvis-data-model]].
- [[raw/jarvis/nx.md]]
- [[raw/jarvis/MODEL-CATALOG-DATA-MODEL.md]]
