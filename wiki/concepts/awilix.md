# Awilix

## Definition

Awilix is a lightweight dependency injection (DI) container for JavaScript/TypeScript. It manages object creation, dependency resolution, and lifecycle (singleton, transient, scoped instances).

## Mental Model

Awilix is a service container that answers the question: "Where do I get a fully-initialized instance of this service?" Rather than manually wiring up dependencies, you register services with the container and ask for them by name. The container handles:
- **Creating instances** with all their dependencies
- **Reusing instances** (singleton pattern)
- **Injecting dependencies** automatically
- **Isolating scopes** (per-request instances)

Think of it as a factory that knows how to build complex objects.

## Example

```typescript
import { createContainer, asClass, asValue } from 'awilix';

// 1. Create container
const cradle = createContainer();

// 2. Register services
cradle.register({
  // Singleton (created once, reused)
  db: asClass(Database).singleton(),
  
  // Per-request (new instance each call)
  authService: asClass(AuthService).scoped(),
  
  // Constant value
  config: asValue({ apiUrl: 'https://api.example.com' }),
});

// 3. Use it
const auth = cradle.resolve('authService');
const db = cradle.resolve('db'); // Same instance every time
```

## Lifecycle Modes

- **Singleton**: One instance for the app's lifetime (good for db, logger)
- **Scoped**: One instance per scope (e.g., per HTTP request)
- **Transient**: New instance every time (rarely used)

## In Jarvis BFF

```typescript
// main.ts
const cradle = createContainer();

cradle.register({
  db: asClass(Database).singleton(),
  catalogService: asClass(CatalogService).singleton(),
  authService: asClass(AuthService).singleton(),
  usersService: asClass(UsersService).singleton(),
  permissionsService: asClass(PermissionsService).singleton(),
  // External services
  robertoService: asClass(RobertoService).singleton(),
  picassoService: asClass(PicassoService).singleton(),
  taskManagerService: asClass(TaskManagerService).singleton(),
});

// tRPC context passes the entire container
export function createContext(req, res) {
  return { cradle, req, res, user };
}
```

## Benefits in tRPC + Hono

- **No manual wiring**: Services declare their dependencies, container injects them
- **Testability**: Mock services by registering fakes
- **Centralized config**: All service dependencies defined in one place
- **Scoped requests**: Per-request instances for database connections, logging context

## Related Concepts

- [[bff-pattern]] — Why BFFs need DI containers
- [[request-context-pattern]] — Passing container through request context
- [[jarvis-bff]] — Awilix usage in Jarvis Model Catalog

## Sources

- [[raw/jarvis/BFF-ARCHITECTURE.md]]
- [[raw/jarvis/apps/model-catalog/bff/src/container.ts]]

Awilix API details beyond the registration style used in Jarvis
(`asClass`/`asFunction`/`asValue`, PROXY injection, singleton scope) are general knowledge.
