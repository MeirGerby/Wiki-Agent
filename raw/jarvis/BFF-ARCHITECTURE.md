# Jarvis Model Catalog BFF Architecture

## Overview

The Backend For Frontend (BFF) is the central API service for the Jarvis Model Catalog application. It's a **tRPC + Hono** backend that manages:

- **Models**: Deep learning models for object detection
- **Objects**: Physical objects the models can detect (e.g., vehicles, buildings)
- **Catalog**: Metadata about objects, geographies, sensor types, and detection rules
- **Users & Permissions**: Authentication and role-based access control
- **Integrations**: External services for model training, image tagging, and task management

## Technology Stack

- **Framework**: Hono (lightweight web server)
- **API**: tRPC (end-to-end type-safe RPC)
- **Database**: Lakebase Postgres (via Drizzle ORM)
- **DI**: Awilix (dependency injection container)
- **Auth**: JWT tokens (stored in secure cookies)
- **Logging**: Structured logging via @jarvis/logging

## Architecture Pattern

The BFF follows a **layered architecture** with clear separation of concerns:

```
Request
  ↓
Hono Middleware (cookies, logging)
  ↓
tRPC Router (routes to domain routers)
  ↓
Domain Routers (auth, catalog, permissions, etc.)
  ↓
Services (business logic)
  ↓
Database (Drizzle ORM)
```

## Entry Point

**main.ts** initializes the app:

1. Creates dependency injection container (Awilix)
2. Registers all services
3. Sets up Hono middleware
  - Cookie jar middleware
  - Request logging middleware
4. Mounts health checks (`/health`, `/ready`)
5. Mounts ADFS authentication endpoint (`/api/adfs`)
6. Mounts tRPC router at `/trpc/*`

## Request Flow

1. **Client** → sends tRPC call via HTTP POST to `/trpc/*`
2. **Hono** → logs request, maintains cookies, routes to tRPC
3. **tRPC Router** → dispatches to domain router (catalog, auth, permissions)
4. **Domain Router** → validates input, checks permissions, calls service
5. **Service** → executes business logic, queries database
6. **Database** → returns data via Drizzle ORM
7. **Service** → returns result
8. **tRPC** → validates output type
9. **Client** → receives fully typed response

## Domain Routers

The main router (`router.ts`) composes 5 domain routers:

### 1. **Catalog Router** (`catalog/`)
Operations for managing the model catalog:
- List objects, categories, geographies, sensor groups, tagging classes
- Query objects with filters
- Create/update/delete objects
- Manage models (create, clone, update, train, abort training)
- Get model details and performance metrics

### 2. **Auth Router** (`auth/`)
Authentication and session management:
- Sign in (with user creation/update)
- Sign out
- Refresh token
- Get current user

### 3. **Permissions Router** (`permissions/`)
Role-based access control:
- Check user permissions
- Grant/revoke permissions
- List available permissions

### 4. **Web Config Router** (`web-config/`)
Configuration for the frontend:
- Geography labels and options
- Sensor group labels
- ADFS authentication settings
- Resolution options and units

### 5. **Logger Router** (`logging/`)
Logging operations from the client:
- Send client logs to server for aggregation

## Key Services

All services are singleton-scoped (created once, reused):

### CatalogService
Manages catalog data (objects, models, categories, etc.)
- Queries database via Drizzle ORM
- Handles visibility rules (which objects a user can see)
- Manages model metadata and training state

### AuthService
Handles authentication:
- Generates/validates JWT tokens
- Creates/updates users on signin
- Manages sessions via HTTP-only cookies

### UsersService
User data management:
- Fetch user by ID
- Upsert user (update or insert)

### PermissionsService
Authorization checks:
- Check if user has permission for an action
- Enforces role-based access (guest, user, admin)

### ExternalServices
Integrate with external systems:
- **RobertoService**: Model training service
- **PicassoService**: Image tagging service
- **TaskManagerService**: Long-running task management

## Request Context

Every tRPC request has a **context** (created by `context.ts`):

```typescript
{
  user: AppUser | undefined,        // Authenticated user or undefined
  cradle: Cradle,                    // Dependency injection container
  req: HonoRequest,                  // Raw Hono request
  res: HonoResponse,                 // Raw Hono response
}
```

Context includes the entire DI container, so services can access logger, database, config, etc.

## Procedure Types

tRPC defines 3 procedure types for different auth requirements:

1. **authedProcedure** - User must be authenticated
2. **roleProcedure('role')** - User must have specific role
3. **Guest procedure** - Public access (e.g., listing objects)

## Authentication Flow

1. User signs in via ADFS (Active Directory Federated Services)
2. ADFS redirects to `/api/adfs` with user data
3. **AuthService.signin()** creates/updates user in database
4. JWT token generated and stored in **secure HTTP-only cookie**
5. Subsequent requests include cookie automatically
6. tRPC context extracts and validates JWT
7. User object available to all procedures

## Database & ORM

Uses **Drizzle ORM** with **Lakebase Postgres** database:

- Type-safe queries
- Migrations via Drizzle Kit
- Schema defined in `@jarvis/db`
- Connection pooling (max 10 connections)
- Health check: `/ready` endpoint pings database

## Health & Readiness

- **GET /health** - Always returns "ok" (for kubernetes liveness probe)
- **GET /ready** - Queries database, returns 503 if not ready (for kubernetes readiness probe)

## Configuration

Environment variables (loaded in `server-env.ts` and `web-env.ts`):

**Server Config**:
- `DATABASE_URL` - Postgres connection string
- `NODE_ENV` - Environment (development, production)
- `JWT_SECRET` - Secret for signing tokens
- `LOG_LEVEL` - Logging verbosity
- `USER_ID` - Default user ID (for stubbed auth)
- `ADFS_*` - ADFS configuration

**Web Config**:
- Frontend-specific settings (geography labels, sensor groups, resolution options)
- Sent to frontend via `/trpc/webConfig.get` endpoint

## Request Logging

Every request is logged with:
- Project name (model-catalog-bff)
- HTTP method
- Path
- Response status
- Duration in milliseconds

Logs are structured (JSON) for easy parsing and aggregation.
