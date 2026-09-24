# Jarvis

## Definition

Jarvis is a monorepo project that manages a catalog of AI models and the objects they detect. It's a full-stack TypeScript application built for coordinating model training, tagging classes (detection categories), and serving a web interface for model management.

## Mental Model

Think of Jarvis as a **model factory and catalog**:

- Users create models through a web interface
- Each model learns to detect certain types of objects (called "tagging classes" — like vehicles or people)
- The system coordinates with external services to run training jobs
- Once trained, models become queryable through the catalog
- Shared infrastructure (database, UI components, logging) supports everything

## Architecture

Jarvis uses an **Nx monorepo** organized into bounded contexts:

### Current Context: Model Catalog

The single production context contains three layers:

- **`@jarvis/model-catalog-web`** — React frontend on port 5173
- **`@jarvis/model-catalog-bff`** — Backend (Hono + tRPC) on port 3001
- **`@jarvis/model-catalog-contract`** — Shared Zod schemas for type safety

### Shared Libraries

- **`@jarvis/ui`** — Reusable React components
- **`@jarvis/db`** — PostgreSQL schemas and migrations (Drizzle ORM)
- **`@jarvis/logging`** — Centralized logging utilities
- **`@jarvis/nx-plugin`** — Nx generators for scaffolding new contexts

## Key Concepts

### Tagging Class

A category of thing the model can detect (e.g., "vehicle", "person"). Each class has an identifier and Hebrew name.

### Training

The process of teaching a model to detect specific tagging classes. Stored in an external **Task Manager** as a mission with a status.

### Integration with External Services

- **Picasso** — Owns the authoritative list of tagging classes
- **Task Manager** — Runs training missions asynchronously

## Technology Stack

- **Monorepo**: Nx 23.1.1, pnpm 10.32.1
- **Frontend**: React 19, Vite
- **Backend**: Hono, tRPC, Express 5
- **Database**: PostgreSQL, Drizzle ORM
- **Type Safety**: TypeScript 6.0, Zod
- **Linting**: ESLint, TypeScript ESLint
- **Build Tools**: esbuild, Webpack, SWC

## Example Workflow

1. User opens the web app → loads `@jarvis/model-catalog-web`
2. User creates a model and selects tagging classes from Picasso
3. Frontend calls the backend via tRPC → `@jarvis/model-catalog-bff`
4. Backend creates a mission in the Task Manager
5. Training starts; status is queryable
6. Once complete, model appears in the catalog

## Project Structure

```
jarvis/
├── apps/model-catalog/          # Production context
│   ├── web/                      # React frontend
│   ├── bff/                      # Backend server
│   └── contract/                 # Shared schemas
├── libs/
│   ├── db/                       # Database
│   ├── ui/                       # Components
│   ├── logging/                  # Utilities
│   └── nx-plugin/                # Generators
└── nx.json                       # Workspace config
```

## System Architecture

### Backend

See [[jarvis-bff]] for complete BFF design:
- [[hono]] for HTTP routing
- [[trpc]] for type-safe RPC
- [[awilix]] for dependency injection
- [[jwt-authentication]] + [[adfs-authentication]] for auth
- [[request-context-pattern]] for request flow

### Data Layer

See [[jarvis-data-model]] for entities:
- Objects (things to detect)
- Models (trained detection models)
- Categories, Geographies, Sensor Groups
- User permissions and visibility rules

### Training Pipeline

See [[jarvis-model-training]] for complete flow:
- User initiates → BFF creates model → Roberto trains → Task Manager orchestrates
- See [[jarvis-external-integrations]] for Roberto, Picasso, Task Manager

### Async Processing

- [[async-job-processing]] — Job queuing and status tracking
- [[webhook-integration]] — Async notifications
- [[resilience-patterns]] — Retries, timeouts, error handling

### Frontend

See [[jarvis-frontend]] for React architecture:
- TanStack Router for routing
- tRPC client for type-safe API calls
- React Hooks + Context for state

### Permissions

See [[jarvis-permissions]] for access control:
- Role-based access (guest, user, admin)
- Catalog visibility filtering
- Permission checks in BFF

## Related Concepts

- [[nx-monorepo]] — How Jarvis is organized
- [[bounded-contexts]] — Multi-context pattern in Jarvis
- [[module-boundaries]] — Dependency rules between layers
- [[neon-lakebase]] — Database provider
- [[postgres-connections]] — Connection management
- [[logging]] — Shared logging across services
- [[bff-pattern]] — Architectural pattern Jarvis uses
- [[jarvis-bff]] — Backend service and API layer
- [[jarvis-data-model]] — Core entities and relationships
- [[jarvis-frontend]] — React web application
- [[jarvis-model-training]] — How models get trained
- [[jarvis-external-integrations]] — Roberto, Picasso, Task Manager
- [[jarvis-permissions]] — Access control and visibility

## Sources

- [[raw/jarvis/CONTEXT-MAP.md]]
- [[raw/jarvis/apps/model-catalog/docs/CONTEXT.md]]
- [[raw/jarvis/package.json]]
- [[raw/jarvis/nx.md]]
