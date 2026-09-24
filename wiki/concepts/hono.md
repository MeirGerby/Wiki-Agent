# Hono

## Definition

Hono is a lightweight, fast web framework for TypeScript/JavaScript that runs on any JavaScript runtime (Node.js, Bun, Deno, Cloudflare Workers, etc.). It provides HTTP routing, middleware, and request/response handling with minimal overhead.

## Mental Model

Hono is like Express but designed for modern runtimes. Think of it as a thin wrapper around HTTP that lets you:
1. Define routes (GET /api/users)
2. Stack middleware (logging, auth, cookies)
3. Handle requests and responses
4. Return typed data (JSON, HTML, etc.)

It's particularly useful when paired with [[trpc]] for a type-safe API layer, where Hono handles the HTTP transport and tRPC handles the RPC semantics.

## Example

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/middleware';

const app = new Hono();

// Middleware
app.use(cors());
app.use(logger());

// Routes
app.get('/', (c) => c.text('Hello, world!'));
app.get('/users/:id', (c) => {
  const id = c.req.param('id');
  return c.json({ userId: id });
});

// With tRPC
app.use('/trpc/*', trpcHandler);

export default app;
```

## Key Characteristics

- **Fast**: Minimal overhead, zero dependencies by default
- **Runtime-agnostic**: Works on Node, Bun, Deno, Workers, etc.
- **Middleware-based**: Built-in middleware for cookies, CORS, auth, logging
- **TypeScript first**: Full type inference for requests/responses
- **Composable**: Easy to mount sub-applications and middleware

## Common Patterns

### Middleware Stack
```typescript
app.use(cookieMiddleware());
app.use(loggerMiddleware());
app.use(authMiddleware());

app.get('/api/protected', (c) => {
  // All middleware ran before this handler
});
```

### Combining with tRPC
Hono often serves as the HTTP layer for a [[trpc]] backend:
- Hono handles middleware (cookies, logging, auth)
- tRPC router mounts at `/trpc/*` and dispatches to domain routers
- Request context flows through both layers

## Related Concepts

- [[trpc]] — API layer on top of Hono
- [[bff-pattern]] — Using Hono as BFF HTTP server
- [[request-context-pattern]] — Passing context through middleware and handlers
- [[jarvis-bff]] — Hono + tRPC used in Jarvis

## Sources

- [[raw/jarvis/BFF-ARCHITECTURE.md]]
- [[raw/jarvis/apps/model-catalog/bff/src/main.ts]]

General framework behaviour beyond the Jarvis usage above (full routing API,
adapter list, performance claims) is general knowledge, not drawn from these sources.
