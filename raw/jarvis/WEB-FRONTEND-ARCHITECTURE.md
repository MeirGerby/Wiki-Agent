# Web Frontend Architecture

The Web frontend for Jarvis Model Catalog is a React application that provides an interactive UI for browsing models, creating objects, and managing training jobs.

## Technology Stack

- **Framework**: React 19
- **Routing**: TanStack Router (modern client-side routing)
- **API Client**: tRPC (client imported from BFF contract)
- **State Management**: React Hooks + Context
- **Authentication**: ADFS + JWT tokens (via secure cookies)
- **Styling**: TBD (CSS or component library)

## Architecture

```
Routes (TanStack Router)
  ↓
Pages (React components)
  ↓
Hooks (data fetching, state)
  ↓
Context (shared state)
  ↓
tRPC Client (API calls)
  ↓
BFF (backend)
```

## Key Directories

### `/router-context.ts`
Root router setup with TanStack Router.
- Defines all application routes
- Integrates authentication context
- Handles route guards

### `/components/`
Reusable React components.

**model-card/** - Display individual model
- Model name (bilingual)
- Performance metrics (precision, recall)
- Sensor type
- Geography
- Training status

**model-form/** - Create/edit models
- `ModelFormContext` - Shared form state
- `use-model-form` - Form hook with validation
- Integrates with backend to create models

### `/catalog/`
Catalog data management hooks.

**use-catalog-data.ts**
- Fetches catalog metadata (objects, models, categories, etc.)
- Caches results
- Invalidates cache on mutations

**use-catalog-sync.ts**
- Keeps local state in sync with backend
- Refetches when models are created/updated
- Debounces rapid changes

**use-sorted-geographies.ts**
- Sorts geography list for display
- Respects pinned geography (if configured)

### `/utils/`
Utility functions.

**adfs.ts** - ADFS authentication
- Redirects to ADFS for login
- Handles ADFS callback
- Extracts user data

**roles.ts** - Role-based access control
- Checks if user has permission
- Shows/hides UI elements based on role

**form-errors.ts** - Form error handling
- Converts validation errors to user-friendly messages
- Integrates with tRPC error types

### `/logging/`
Client-side logging.

**log.ts** - Send client logs to server
- Collects errors, warnings, info logs
- Batches and sends to BFF via tRPC
- Server aggregates for monitoring

## Data Flow

### Initial Load

```
1. User opens app
2. TanStack Router initializes
3. AuthContext checks for JWT in cookie
4. If authenticated:
   - Fetch user info
   - Load web config (labels, options)
5. Render authenticated UI
6. Lazy-load catalog data as user navigates
```

### Searching Objects

```
1. User enters filter (geography, category, etc.)
2. use-catalog-data hook builds filter params
3. Calls tRPC: catalog.objects(filter)
4. BFF validates permissions
5. CatalogService queries database
6. Results returned with full metadata
7. Component renders object list
```

### Creating a Model

```
1. User fills out model form:
   - Object to detect
   - Sensor group
   - Geography
   - Training data source

2. ModelFormContext validates:
   - All required fields present
   - Training data accessible

3. User clicks "Train"
4. Calls tRPC: catalog.createModel(input)
5. BFF:
   - Creates model record (TRAINING)
   - Submits to Roberto
6. Frontend receives model ID
7. Polls for status updates
8. When OPERATIONAL, show metrics
```

## Context & State

### AuthContext
Current authenticated user.
```typescript
{
  user: AppUser | undefined,
  isLoading: boolean,
  signIn: (credentials) => Promise<void>,
  signOut: () => Promise<void>,
}
```

### ModelFormContext
Shared form state while creating/editing models.
```typescript
{
  objectId: string,
  sensorGroup: string,
  geography: string,
  datasetUrl: string,
  errors: ValidationErrors,
  isSubmitting: boolean,
}
```

### CatalogContext (implicit)
Loaded via hooks; no global context provider.
- Objects list
- Models metadata
- Categories, geographies, sensor groups

## Hook Patterns

### Data Fetching
```typescript
// Fetch and cache catalog data
const objects = useCatalogData('objects', filter);
const models = useCatalogData('models', modelFilter);
```

### Forms
```typescript
// Manage form state with validation
const form = useModelForm();
form.setValue('objectId', selectedObjectId);
const errors = form.validate();
```

### Synchronization
```typescript
// Keep local state in sync with backend
useCatalogSync(); // Refetches when models are created
```

## Authentication Flow

1. User visits app (not authenticated)
2. AuthContext redirects to ADFS login
3. ADFS returns user data via POST
4. **adfs.ts** parses and stores JWT in cookie
5. BFF validates JWT on subsequent requests
6. AuthContext shows authenticated UI

## Error Handling

- **Network errors**: Retry with exponential backoff
- **Validation errors**: Show inline form errors (via **form-errors.ts**)
- **Permission errors**: Hide UI elements, show "not authorized"
- **Server errors**: Log to server, show user-friendly message

## Performance Optimizations

- **Lazy loading**: Load routes/data only when visited
- **Caching**: Cache catalog metadata (geographies, categories)
- **Debouncing**: Debounce search/filter input
- **Request batching**: Group multiple queries when possible

## Bilingual Support

UI supports English and Hebrew:
- Contract types have `englishName` and `hebrewName`
- Web config provides localized labels for geographies, sensor groups
- Frontend renders both languages where available

## Testing Strategy

- Unit tests for hooks (mocked tRPC)
- Integration tests for forms (mock BFF responses)
- E2E tests for critical flows (training, authentication)
- Storybook for component development

## Future Improvements

- Add real-time updates (WebSocket for training status)
- Implement infinite scroll for large object lists
- Add advanced filtering (by model performance, last updated, etc.)
- Add export/batch operations
