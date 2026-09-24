# Jarvis Frontend Architecture

## Definition

The Jarvis frontend is a React 19 application that provides an interactive UI for browsing detection models, creating objects, and managing training jobs. It uses TanStack Router for routing, tRPC for type-safe API calls, and React Hooks + Context for state management.

## Mental Model

A showroom floor over a warehouse. The routes are aisles, the components are the
display cases, and the hooks are the staff who fetch stock from the back. Nothing
on the floor holds inventory of its own — it all comes from the BFF on request,
and the same typed catalog governs both sides.

## Technology Stack

- **Framework**: React 19
- **Routing**: TanStack Router (modern client-side routing)
- **API Client**: [[trpc]] (imported from BFF contract package)
- **State Management**: React Hooks + Context (no Redux)
- **Authentication**: [[jwt-authentication]] via secure cookies
- **Styling**: TBD (CSS or component library)

## Architecture Layers

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

## Directory Structure

### `/router-context.ts`
Root router setup with TanStack Router.
- Defines all application routes
- Integrates authentication context
- Handles route guards

### `/components/`
Reusable React components.

**model-card/**
- Display individual model
- Show model name (bilingual)
- Display performance metrics (precision, recall)
- Show sensor type and geography
- Indicate training status

**model-form/**
- Create/edit models
- `ModelFormContext` - Shared form state
- `use-model-form` - Form hook with validation
- Integrates with BFF to create models

### `/catalog/`
Catalog data management hooks.

**use-catalog-data.ts**
- Fetches catalog metadata (objects, models, categories, etc.)
- Caches results in React state
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

**adfs.ts** - [[adfs-authentication]]
- Redirects to ADFS for login
- Handles ADFS callback
- Extracts user data

**roles.ts** - [[jarvis-permissions]]
- Checks if user has permission
- Shows/hides UI elements based on role

**form-errors.ts**
- Converts validation errors to user-friendly messages
- Integrates with tRPC error types

### `/logging/`
Client-side logging.

**log.ts**
- Collects errors, warnings, info logs
- Batches and sends to BFF via tRPC
- Server aggregates for monitoring

## Context & State

### AuthContext
Current authenticated user and auth methods.

```typescript
{
  user: AppUser | undefined,        // null if not authenticated
  isLoading: boolean,
  signIn: (credentials) => Promise<void>,
  signOut: () => Promise<void>,
}
```

Usage:
```typescript
const { user, signIn, signOut } = useContext(AuthContext);

if (!user) {
  return <LoginPage onLogin={signIn} />;
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

Usage:
```typescript
const form = useContext(ModelFormContext);
form.setValue('objectId', 'car');
const errors = form.validate();
if (errors.length === 0) {
  await form.submit();
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
const { objects, isLoading } = useCatalogData(
  'objects',
  { category: 'vehicle', geography: 'israel' }
);

const { models, error } = useCatalogData('models', filter);
```

### Forms
```typescript
// Manage form state with validation
const form = useModelForm();
form.setValue('objectId', selectedObjectId);
const errors = form.validate();
if (!errors) {
  await form.submit(); // Calls BFF
}
```

### Synchronization
```typescript
// Keep local state in sync with backend
useCatalogSync();
// Re-fetches models when one is created
```

## Data Flow: Initial Load

```
1. User opens app (not authenticated)
   ↓
2. TanStack Router initializes
   ↓
3. AuthContext checks for JWT in cookie
   If found: Validate JWT with BFF
   ↓
4. If authenticated:
   - Fetch user info
   - Load web config (labels, options)
   - Render authenticated UI
   ↓
5. Lazy-load catalog data as user navigates
   - Don't fetch everything upfront
   - Fetch models/objects only when viewing them
```

## Data Flow: Searching Objects

```
1. User enters filter (geography, category, etc.)
   ↓
2. useCatalogData hook builds filter params
   ↓
3. Calls tRPC: catalog.objects(filter)
   ↓
4. BFF:
   - Validates permissions
   - CatalogService queries database
   ↓
5. Results returned with full metadata
   ↓
6. Component renders object list
   ↓
7. User clicks object → fetch related models
```

## Data Flow: Creating a Model

```
1. User navigates to "Train Model" form
   ↓
2. Form renders with:
   - Dropdown: Select object to detect
   - Dropdown: Select sensor group
   - Dropdown: Select geography
   - Input: Dataset URL
   ↓
3. ModelFormContext validates input:
   - All required fields present
   - Dataset URL is valid
   ↓
4. User clicks "Train"
   ↓
5. Calls tRPC: catalog.createModel(input)
   ↓
6. BFF:
   - Creates model record (TRAINING)
   - Submits to Roberto
   ↓
7. Frontend receives model ID
   ↓
8. Redirects to model details page
   ↓
9. Starts polling for status updates
   - Poll every 5 seconds
   - When status === OPERATIONAL, show metrics
```

## Authentication Flow

```
1. User visits app (not authenticated)
   ↓
2. AuthContext renders redirect to login
   ↓
3. User clicks "Sign In"
   ↓
4. Frontend redirects to: /api/adfs
   ↓
5. BFF redirects to ADFS login page
   ↓
6. User enters credentials in ADFS
   ↓
7. ADFS redirects back: /api/adfs?code=xxx
   ↓
8. BFF handles callback:
   - Exchanges code for user info
   - Creates JWT token
   - Sets HTTP-only cookie
   - Redirects to frontend: /dashboard
   ↓
9. Frontend sees cookie, authenticated
   ↓
10. AuthContext loads user info
   ↓
11. Render authenticated UI
```

See [[jwt-authentication]] and [[adfs-authentication]].

## Error Handling

### Network Errors
```typescript
try {
  const response = await client.catalog.objects.query(filter);
} catch (error) {
  if (error.code === 'TIMEOUT') {
    showToast('Request timed out. Try again?');
  } else if (error.code === 'PARSE_ERROR') {
    showToast('Server returned invalid data.');
  } else {
    showToast(`Error: ${error.message}`);
  }
}
```

### Validation Errors
```typescript
// form-errors.ts converts Zod errors to user-friendly messages
const errors = validateInput(formData);
if (errors.objectId) {
  showError('Please select an object');
}
```

### Permission Errors
```typescript
try {
  await client.catalog.createModel.mutate(input);
} catch (error) {
  if (error.data?.code === 'FORBIDDEN') {
    showToast('You do not have permission to create models.');
    hideCreateButton();
  }
}
```

### Server Errors
```typescript
try {
  await client.catalog.createModel.mutate(input);
} catch (error) {
  if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
    // Log to server
    await client.logger.log.mutate({
      level: 'error',
      message: error.message,
      stack: error.stack,
    });
    
    showToast('Something went wrong. We have logged this error.');
  }
}
```

## Performance Optimizations

### Lazy Loading
```typescript
// Load routes only when visited
const ModelDetailsPage = React.lazy(() => 
  import('./pages/ModelDetails')
);

// Load data only when viewing
const { models } = useCatalogData('models', filter);
// Doesn't fetch until component mounts
```

### Caching
```typescript
// Cache catalog metadata (geographies, categories)
const cachedGeographies = useMemo(
  () => geographies,
  [geographies]
);

// Don't refetch if props unchanged
const { models } = useCatalogData('models', {
  category: category,
  geography: geography,
}, { staleTime: 5 * 60 * 1000 }); // Cache 5 minutes
```

### Debouncing
```typescript
// Debounce search/filter input
const debouncedSearch = useMemo(
  () => debounce((query) => {
    setSearchQuery(query);
  }, 500),
  []
);

<input 
  onChange={(e) => debouncedSearch(e.target.value)}
/>
```

### Request Batching
```typescript
// tRPC can batch multiple queries
const [objects, models, categories] = await Promise.all([
  client.catalog.objects.query(filter),
  client.catalog.models.query(filter),
  client.catalog.categories.query(),
]);
// May be sent as single HTTP request if configured
```

## Bilingual Support

UI supports English and Hebrew:

```typescript
// Contract types have both language versions
const model = {
  englishName: 'Car',
  hebrewName: 'מכונית',
};

// Web config provides localized labels
const config = await client.webConfig.get.query();
// {
//   SENSOR_GROUP_LABELS: {
//     RGB: 'Visual',
//     SAR: 'Radar',
//   },
//   GEOGRAPHY_LABELS: {
//     israel: 'Israel',
//   },
// }

// Component renders based on user preference
<h2>
  {userPreference === 'en' 
    ? model.englishName 
    : model.hebrewName}
</h2>
```

## Testing Strategy

- **Unit tests**: Hooks (mocked tRPC client)
- **Integration tests**: Forms with mocked BFF responses
- **E2E tests**: Critical flows (training, authentication)
- **Storybook**: Component development and visual regression

## Related Concepts

- [[shadcn-ui]] — The component library the frontend renders

- [[jarvis]] — Project overview
- [[trpc]] — Type-safe API client
- [[jwt-authentication]] — Auth tokens
- [[adfs-authentication]] — Enterprise login
- [[async-job-processing]] — Polling for job status
- [[jarvis-bff]] — Backend that frontend calls

## Sources

- [[raw/jarvis/WEB-FRONTEND-ARCHITECTURE.md]]
