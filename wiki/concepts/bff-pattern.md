# Backend For Frontend (BFF) Pattern

## Definition

Backend For Frontend (BFF) is an architectural pattern where a separate backend service acts as an intermediary between frontend clients and business logic services. The BFF is optimized specifically for the frontend's needs rather than being a general-purpose backend.

## Mental Model

Instead of the frontend talking directly to multiple backend services:
```
Frontend → [Auth Service] [Catalog Service] [Training Service] ...
                ↓              ↓                    ↓
           Chaos and complexity
```

Use a BFF to aggregate and adapt:
```
Frontend → BFF (tailored API)
           ↓ ↓ ↓ ↓
        [Auth] [Catalog] [Training] [External Services]
```

The BFF:
- **Aggregates** data from multiple sources
- **Adapts** response shapes for frontend convenience
- **Handles** frontend-specific concerns (auth, cookies, logging)
- **Shields** frontend from backend complexity
- **Provides** type-safe contracts via [[trpc]]

## Why BFF?

**Without BFF**:
- Frontend talks to 10 different services
- Each service has different auth, error formats, response shapes
- Frontend must handle orchestration, error handling, caching
- Changes to backend require frontend changes

**With BFF**:
- Single entry point for frontend
- BFF orchestrates backend services
- Frontend gets one consistent API contract
- Backend refactoring doesn't touch frontend

## Typical BFF Architecture

```
Hono HTTP Server (lightweight, middleware-based)
  ↓
Middleware Layer (cookies, logging, auth)
  ↓
tRPC Router (type-safe RPC)
  ↓
Domain Routers (catalog, auth, permissions)
  ↓
Services (business logic)
  ↓
Data Sources (database, external APIs)
```

## Layered Structure

### 1. HTTP Layer (Hono)
- Request/response handling
- Middleware (cookies, CORS, logging)
- Route mounting

### 2. RPC Layer (tRPC)
- Type-safe procedure definitions
- Input/output validation (Zod)
- Procedure types (public, authed, admin-only)

### 3. Domain Routers
- Organize by domain (catalog, auth, permissions)
- Each router has multiple related procedures
- Call services for business logic

### 4. Services
- Business logic (queries, mutations, orchestration)
- Database access (Drizzle ORM)
- Integration with external systems
- Dependency injection

## Key Characteristics

- **Type-safe contracts**: Frontend imports tRPC types from BFF contract package
- **Single deployment**: BFF is one service
- **Aggregation**: Combines data from multiple sources
- **Frontend-focused**: API shaped for frontend UX
- **Simplified frontend**: Less state management, networking, error handling

## Example Data Flow

```typescript
// Frontend calls BFF via tRPC (type-safe)
const newModel = await client.catalog.createModel.mutate({
  objectId: 'car',
  sensorGroup: 'RGB',
  geography: 'israel',
});

// BFF receives request
// 1. Validates user is authenticated (middleware)
// 2. Checks permission (permissionsService)
// 3. Creates model record (catalogService → database)
// 4. Submits training job (robertoService → external API)
// 5. Returns model ID to frontend

// Frontend receives fully-typed response
// Can immediately show model in list with no type casting
```

## Benefits

- **Type safety end-to-end** from database to frontend
- **Frontend simplicity** - no multi-service orchestration
- **Single error format** - consistent error handling
- **Easy versioning** - change BFF contract, update frontend
- **Performance** - aggregate data server-side, send once
- **Security** - auth, validation, secrets all server-side

## When to Use

- Multiple frontend clients (web, mobile, desktop)
- Multiple backend services to orchestrate
- Frontend needs aggregated/adapted data
- Type-safe contracts important
- Clear separation between frontend and backend teams

## Related Concepts

- [[hono]] — HTTP framework for BFF
- [[trpc]] — Type-safe RPC protocol
- [[request-context-pattern]] — Passing auth/user through BFF
- [[awilix]] — Dependency injection for services
- [[jarvis-bff]] — BFF implementation in Jarvis

## Sources

- [[raw/jarvis/BFF-ARCHITECTURE.md]]

The BFF pattern itself (origin, trade-offs versus a shared API gateway) is
general knowledge; only the Jarvis application of it comes from the source above.
