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

## Related Concepts

- [[nx-monorepo]]
- [[postgres-listen-notify]]

## Sources

- [[raw/jarvis/package.json]]
- [[raw/jarvis/nx.md]]
