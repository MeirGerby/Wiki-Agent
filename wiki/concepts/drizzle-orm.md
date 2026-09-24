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

Migrations are version-controlled; no manual SQL needed.

## Related Concepts

- [[jarvis-bff]] — BFF uses Drizzle for queries
- [[jarvis-data-model]] — Schema definition
- [[trpc]] — Type safety end-to-end
- [[neon-lakebase]] — Database provider
- [[postgres-connections]] — Connection management
- [[nx-monorepo]] — Monorepo organization

## Sources

- [[raw/jarvis/package.json]]
- [[raw/jarvis/nx.md]]
- [[raw/jarvis/MODEL-CATALOG-DATA-MODEL.md]]
