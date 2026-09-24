# Request Context Pattern

## Definition

The Request Context Pattern is an architectural approach where each HTTP request carries a context object containing request-scoped data (authenticated user, dependency container, raw request/response objects, etc.). This context flows through middleware, routers, and services without needing explicit parameter passing.

## Mental Model

Imagine each HTTP request is like a delivery truck:
- **The truck arrives** with a payload (HTTP request, headers, body)
- **Along the journey** (through middleware), add more info to the truck (authenticated user, logging context, DI container)
- **Every stop** (middleware, router, service) can read/write context without needing to pass parameters
- **At the destination** (the actual handler), context is fully prepared

Without context, you'd need to pass `(user, logger, db, config)` to every function. With context, you pass one object.

## Example

```typescript
// Define context shape
type RequestContext = {
  user: AppUser | undefined;      // From auth middleware
  cradle: AwilixContainer;          // From DI setup
  req: HonoRequest;                 // Raw HTTP request
  res: HonoResponse;                // Raw HTTP response
};

// Middleware populates context
app.use(async (c, next) => {
  // Extract JWT from cookie
  const token = c.req.cookie('jwt');
  const user = token ? validateJWT(token) : undefined;
  
  // Attach to context
  c.set('user', user);
  c.set('cradle', globalCradle);
  
  await next();
});

// Services access context
catalogRouter.query('objects', {
  input: z.object({ categoryId: z.string() }),
  resolve({ input, ctx }) {
    // ctx has user, cradle, req, res
    const catalogService = ctx.cradle.resolve('catalogService');
    return catalogService.listObjects(input.categoryId, ctx.user);
  },
});
```

## Key Components

### 1. Context Definition
```typescript
interface AppContext {
  user: AppUser | undefined;
  cradle: AwilixContainer;
  req: HonoRequest;
  res: HonoResponse;
}
```

### 2. Context Population
Each middleware step adds to the context:
- **Auth middleware**: Extracts and validates JWT, adds `user`
- **Setup middleware**: Initializes `cradle`, `req`, `res`
- **Logging middleware**: May add request ID or tracing context

### 3. Context Access
```typescript
// In tRPC procedures
const ctx = procedure.ctx; // Context passed through
const user = ctx.user;     // Authenticated user
const db = ctx.cradle.resolve('db'); // Services

// In services
function query(params, ctx) {
  const user = ctx.user;   // May be undefined
  if (!user) throw new Error('Not authenticated');
}
```

## Benefits

- **No parameter drilling**: Don't pass 5+ parameters through 10 function calls
- **Request isolation**: Each request has its own context (thread-local in other languages)
- **Middleware composition**: Middleware can enrich context before handlers see it
- **Cleaner APIs**: Services take data + context, not individual dependencies
- **Easier testing**: Mock the context once, not every dependency

## Gotchas

### Context Not Thread-Local
In async/concurrent scenarios, context isn't truly thread-local:
```typescript
// WRONG: Context may leak between requests
app.use((c, next) => {
  c.set('user', user); // Global state! Race condition!
  return next();
});

// RIGHT: Set context per-request
app.use((c, next) => {
  c.set('user', user); // Hono handles per-request isolation
  return next();
});
```

### Undefined User
Always check for `ctx.user`:
```typescript
// WRONG
const userId = ctx.user.id; // Crashes if not authenticated

// RIGHT
if (!ctx.user) throw new AuthError();
const userId = ctx.user.id;
```

## In Jarvis BFF

```typescript
// context.ts
export function createContext({ req, res, user, cradle }) {
  return { user, cradle, req, res };
}

// In routers
catalog.query('objects', {
  input: z.object({ categoryId: z.string() }),
  resolve({ input, ctx }) {
    // Use context without explicit parameters
    return ctx.cradle.resolve('catalogService')
      .query(input, ctx.user);
  },
});
```

## Related Concepts

- [[awilix]] — Dependency container in context
- [[trpc]] — tRPC passes context to procedures
- [[hono]] — Hono middleware populates context
- [[jwt-authentication]] — Auth middleware adds user to context
- [[jarvis-bff]] — Implementation in Jarvis
- [[bff-pattern]] — Where request context is typically assembled

## Sources

- [[raw/jarvis/BFF-ARCHITECTURE.md]]
- [[raw/jarvis/apps/model-catalog/bff/src/context.ts]]
