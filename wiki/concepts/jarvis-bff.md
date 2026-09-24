# Jarvis Backend For Frontend (BFF)

## Definition

The Jarvis BFF is a [[bff-pattern]] built with [[hono]] + [[trpc]] that serves the Model Catalog web frontend. It aggregates model training, object detection, permissions, and external service integrations into a single type-safe API.

## Mental Model

A hotel concierge desk. The guest (the web app) never talks to housekeeping,
the kitchen or the laundry directly — they ask the concierge, who knows which
department handles what, checks whether the guest is allowed to ask, and returns
one coherent answer. Swap the kitchen supplier and the guest notices nothing.

## Architecture

```
HTTP Request
  ↓
Hono Middleware
  • Cookies (store JWT token)
  • Logging (structured logs)
  ↓
Request Context
  • user: AppUser | undefined
  • cradle: AwilixContainer (DI)
  • req: HonoRequest
  • res: HonoResponse
  ↓
tRPC Router
  • Dispatches to domain routers
  ↓
Domain Routers
  • catalog (models, objects, categories)
  • auth (sign in/out)
  • permissions (RBAC)
  • web-config (frontend settings)
  • logging (client logs)
  ↓
Services (Singletons)
  • CatalogService (models, objects)
  • AuthService (JWT, session)
  • UsersService (user data)
  • PermissionsService (RBAC checks)
  • RobertoService (model training)
  • PicassoService (image tagging)
  • TaskManagerService (job orchestration)
  ↓
Data Layer
  • Drizzle ORM + Neon Postgres
```

## Tech Stack

- **Framework**: [[hono]] (HTTP server)
- **API**: [[trpc]] (type-safe RPC)
- **Database**: [[drizzle-orm]] + [[neon-lakebase]] (Lakebase Postgres)
- **DI**: [[awilix]] (dependency injection)
- **Auth**: [[jwt-authentication]] + [[adfs-authentication]]
- **Validation**: Zod (schema validation)
- **Logging**: Structured JSON logs

## Entry Point (main.ts)

```typescript
import { Hono } from 'hono';
import { createContainer, asClass, asValue } from 'awilix';
import { trpcServer } from '@trpc/server/adapters/node-http';

// 1. Initialize DI container
const cradle = createContainer();
cradle.register({
  db: asClass(Database).singleton(),
  catalogService: asClass(CatalogService).singleton(),
  authService: asClass(AuthService).singleton(),
  usersService: asClass(UsersService).singleton(),
  permissionsService: asClass(PermissionsService).singleton(),
  robertoService: asClass(RobertoService).singleton(),
  picassoService: asClass(PicassoService).singleton(),
  taskManagerService: asClass(TaskManagerService).singleton(),
  logger: asValue(logger),
});

// 2. Set up Hono app
const app = new Hono();

// 3. Middleware
app.use(cookieMiddleware());
app.use(loggingMiddleware());

// 4. Health checks (Kubernetes)
app.get('/health', (c) => c.text('ok'));
app.get('/ready', async (c) => {
  try {
    await cradle.resolve('db').query('SELECT 1');
    return c.text('ready', 200);
  } catch {
    return c.text('not ready', 503);
  }
});

// 5. ADFS auth endpoint
app.post('/api/adfs/callback', authRouter.callback);

// 6. tRPC router
app.use('/trpc/*', trpcServer({
  router: appRouter,
  createContext: (req, res) => ({
    user: extractUserFromCookie(req),
    cradle,
    req,
    res,
  }),
}));

export default app;
```

## Request Flow Example: Create Model

```
1. Frontend: catalog.createModel.mutate({ objectId, sensorGroup, ... })
   ↓
2. HTTP: POST /trpc/catalog.createModel
   Body: { objectId, sensorGroup, geography, ... }
   Header: Cookie: jwt=<token>
   ↓
3. Hono Middleware:
   • Extract JWT from cookie
   • Decode and validate
   • Add user to context
   ↓
4. tRPC Router:
   • Validates input with Zod
   • Checks user is authenticated
   • Dispatches to catalogRouter.createModel
   ↓
5. CatalogRouter:
   • Checks user has 'create_model' permission
   • Calls catalogService.createModel(input, user)
   ↓
6. CatalogService:
   • Create model record in database (status: TRAINING)
   • Call robertoService.submit(modelConfig)
   ↓
7. RobertoService:
   • POST to Roberto API: /train
   • Roberto returns jobId
   • Save jobId to model record
   ↓
8. TaskManagerService:
   • Enqueue training job
   • Set timeout: 24 hours
   ↓
9. Service returns model ID to tRPC
   ↓
10. tRPC validates output with Zod
   ↓
11. Hono sends JSON response to client
   ↓
12. Frontend receives: { modelId, status: 'TRAINING' }
```

## Domain Routers

### Catalog Router
Operations for managing the model catalog:
```typescript
catalog.objects()              // List objects (with filters)
catalog.categories()           // List categories
catalog.geographies()          // List geographies
catalog.sensorGroups()         // List sensor groups
catalog.taggingClasses()       // List tagging classes
catalog.objectModels()         // Get models for object
catalog.createObject()         // Add new object
catalog.createModel()          // Start training
catalog.updateModel()          // Update metadata
catalog.cloneModel()           // Clone with new settings
catalog.retryTraining()        // Retry failed training
catalog.abortTraining()        // Cancel training
```

### Auth Router
```typescript
auth.signin()                  // Sign in via ADFS
auth.signout()                 // Sign out
auth.refreshToken()            // Refresh JWT
auth.getCurrentUser()          // Get authenticated user
```

### Permissions Router
```typescript
permissions.check()            // Check user permission
permissions.grant()            // Grant permission to user
permissions.revoke()           // Revoke permission
permissions.listAvailable()    // List all permissions
```

### Web Config Router
Configuration for frontend:
```typescript
webConfig.get()                // Get labels, options, settings
```

### Logger Router
Client-side logging:
```typescript
logger.log()                   // Send client logs to server
```

## Services

### CatalogService
- Query objects, categories, geographies, sensor groups
- Visibility filtering (which objects user can see)
- Model management (create, update, clone)
- Training state transitions

### AuthService
- Generate/validate JWT tokens
- Create/update users on signin
- Manage sessions

### PermissionsService
- Check if user has permission for action
- Role-based access (guest, user, admin)

### External Services
- [[jarvis-external-integrations]]: Roberto, Picasso, Task Manager

## Authentication Flow

1. User visits app (not authenticated)
2. Frontend detects no JWT cookie
3. Frontend redirects to `/api/adfs`
4. BFF redirects to ADFS login
5. User enters credentials in ADFS
6. ADFS redirects back to `/api/adfs/callback` with code
7. AuthService exchanges code for ADFS token (server-to-server)
8. AuthService creates/updates user in database
9. AuthService generates JWT
10. BFF sets HTTP-only cookie: `jwt=<token>`
11. BFF redirects to frontend: `/dashboard`
12. Frontend sees cookie, authenticated
13. All subsequent requests include cookie

See [[jwt-authentication]] and [[adfs-authentication]].

## Type Safety

End-to-end type safety from database to frontend:

```typescript
// Database type (Drizzle)
const ModelRow = createSelectSchema(deepWisdomModels);

// API type (Zod schema)
const Model = z.object({
  id: ModelId,
  englishName: string,
  hebrewName: string | null,
  operationalStatus: OperationalStatus,
  performance: ModelPerformance,
  // ... 10+ more fields
});

// Input type
const CreateModelInput = z.object({
  objectId: z.string(),
  sensorGroup: z.string(),
  geography: z.string(),
  datasetUrl: z.string(),
});

// tRPC procedure
catalog.mutation('createModel', {
  input: CreateModelInput,
  output: CreateModelOutput,
  resolve({ input, ctx }) {
    // input is typed
    return ctx.cradle.resolve('catalogService')
      .createModel(input);
    // output must match CreateModelOutput type
  },
});

// Frontend client
const response = await client.catalog.createModel.mutate({
  objectId: 'car', // type-checked
  sensorGroup: 'RGB',
  geography: 'israel',
  datasetUrl: 'https://...',
});
// response is fully typed as CreateModelOutput
```

## Related Concepts

- [[jarvis]] — Project overview
- [[hono]] — HTTP framework
- [[trpc]] — Type-safe RPC
- [[bff-pattern]] — Architecture pattern
- [[jwt-authentication]] — Auth tokens
- [[adfs-authentication]] — Enterprise auth
- [[awilix]] — Dependency injection
- [[request-context-pattern]] — Context passing
- [[jarvis-external-integrations]] — Roberto, Picasso, Task Manager
- [[jarvis-data-model]] — Data entities
- [[jarvis-frontend]] — The client this backend serves
- [[jarvis-permissions]] — Checks the BFF enforces
- [[jarvis-model-training]] — Flow the BFF orchestrates

## Sources

- [[raw/jarvis/BFF-ARCHITECTURE.md]]
