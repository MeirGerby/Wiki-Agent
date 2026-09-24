# tRPC

## Definition

An end-to-end type-safe RPC (remote procedure call) framework for TypeScript. The server defines procedures; the client imports the same types and calls them like local functions. There is no separate API documentation or manual typing of response bodies — the schema is one.

## Mental Model

Imagine a telephone where both ends have the same script. The caller (client) can see exactly what the receiver (server) expects to hear and what they'll say back — all enforced by TypeScript before the call even happens. If you change the script on one end, the compiler tells you immediately that the other end is now invalid.

## Example

**Server** (Hono + tRPC):
```typescript
import { z } from 'zod';
import { procedure, router } from '@trpc/server';

export const appRouter = router({
  models: {
    list: procedure.query(async () => {
      return await db.select().from(models);
    }),
    
    create: procedure
      .input(z.object({ name: z.string(), version: z.string() }))
      .mutation(async (opts) => {
        return await db.insert(models).values(opts.input);
      }),
  },
});

export type AppRouter = typeof appRouter;
```

**Client** (React):
```typescript
import { trpc } from './trpc'; // imports AppRouter types

// Full type safety — TS knows the shape of the response
const models = await trpc.models.list.query();

// Mutation with automatic validation
await trpc.models.create.mutate({ 
  name: 'yolov8', 
  version: '8.0' 
});
```

## In Jarvis

- **Server** — BFF (`apps/model-catalog/bff`) defines procedures with Hono
- **Client** — Web (`apps/model-catalog/web`) imports server types and calls procedures
- **Contract** — Shared types live in `apps/model-catalog/contract` (Zod schemas)
- **No API docs needed** — Types are the contract

## Request/Response Validation

tRPC uses Zod for input and output validation:
```typescript
catalog.mutation('createModel', {
  input: z.object({
    objectId: z.string(),
    sensorGroup: z.string(),
    geography: z.string(),
  }),
  output: z.object({
    modelId: z.string(),
    status: z.enum(['TRAINING', 'OPERATIONAL', 'FAILED']),
  }),
  resolve: async ({ input, ctx }) => {
    // Both input and output automatically validated
    // TypeScript enforces correct types
  },
});
```

## Procedure Types

tRPC procedures can require different authentication levels:
```typescript
// Public procedure (guest access)
procedure.query(...)

// Authenticated user required
authedProcedure.mutation(...)

// Specific role required
roleProcedure('admin').mutation(...)
```

## Client Type Safety

The client automatically gets the server's types:
```typescript
// Server defines this
export const appRouter = router({ /* ... */ });
export type AppRouter = typeof appRouter;

// Client imports and uses
import { trpc } from '@trpc/react';

// All operations type-checked against server
const result = await trpc.catalog.objects.query(filter);
// result type is inferred from server schema
```

## Related Concepts

- [[bff-pattern]] — tRPC as API layer for BFF
- [[hono]] — HTTP transport for tRPC
- [[jarvis-bff]] — tRPC implementation in Jarvis
- [[jarvis-frontend]] — tRPC client in React
- [[nx-monorepo]] — Monorepo organization
- [[bounded-contexts]] — Domain separation
- [[drizzle-orm]] — Supplies the database types tRPC exposes

## Sources

- [[raw/jarvis/nx.md]]
- [[raw/jarvis/package.json]]
- [[raw/jarvis/BFF-ARCHITECTURE.md]]
