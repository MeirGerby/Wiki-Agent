# Jarvis Permission System

## Definition

The Jarvis permission system combines role-based access control (RBAC) with catalog visibility rules to determine which users can perform which actions and see which data. Permissions are checked at the BFF level before executing any operation.

## Mental Model

A building pass plus a floor plan. The pass (role) says what kind of person you
are; the floor plan (visibility rules) says which rooms that kind of person may
enter. Both are checked at the door — the BFF — not by the room you are trying
to walk into.

## Components

### Roles

Three role levels:

- **guest** — Public/unauthenticated access
  - Can: List objects (if visibility allows), view public models
  - Cannot: Create objects, train models, modify anything

- **user** — Authenticated user (default for ADFS users)
  - Can: Create objects, train models, view assigned models
  - Cannot: Delete objects, grant permissions, modify other users' data

- **admin** — Full system access
  - Can: Do everything (delete, grant permissions, modify users)
  - Cannot: None (unrestricted)

### Users
Every authenticated user from ADFS is stored:

```typescript
interface AppUser {
  userId: string;           // From ADFS (unique identifier)
  email: string;
  fullName: string;
  displayName: string;
  hierarchy: string[];      // Organization hierarchy [org, division, dept, ...]
  role: 'guest' | 'user' | 'admin';
}
```

### Permissions
Granular permissions for specific operations:

```
// Catalog permissions
create_object            — Create new object
update_object            — Modify object
delete_object            — Remove object

create_model             — Start model training
update_model             — Modify model metadata
clone_model              — Clone model variant
delete_model             — Remove model
retrain_model            — Retry failed training

// System permissions
grant_permissions        — Give permissions to users
revoke_permissions       — Remove permissions
manage_users             — Create/modify users
export_data              — Export catalog data
```

### Catalog Visibility
Determines which objects and models specific users can see:

```typescript
interface CatalogVisibility {
  objectId: string;
  visibleTo: 'all' | 'role' | 'users' | 'hierarchy';
  value?: string | string[];  // Role, user IDs, or hierarchy level
}

// Examples:
// All users can see cars
{ objectId: 'car', visibleTo: 'all' }

// Only admin can see experimental objects
{ objectId: 'boat_prototype', visibleTo: 'role', value: 'admin' }

// Only users in "operations" hierarchy can see these
{ objectId: 'sensitive_target', visibleTo: 'hierarchy', value: 'operations' }

// Only specific users
{ objectId: 'research_object', visibleTo: 'users', value: ['user1', 'user2'] }
```

## Permission Checks in BFF

### At Procedure Level

```typescript
// Only authenticated users can create models
catalog.mutation('createModel', {
  input: CreateModelInput,
  resolve: async ({ input, ctx }) => {
    // authedProcedure checks ctx.user exists
    if (!ctx.user) throw new AuthError('Not authenticated');
    
    // Additional permission check
    const hasPermission = await ctx.cradle
      .resolve('permissionsService')
      .check(ctx.user, 'create_model');
    
    if (!hasPermission) {
      throw new ForbiddenError('You cannot create models');
    }
    
    return catalogService.createModel(input, ctx.user);
  },
});

// Only admins can delete
catalog.mutation('deleteModel', {
  resolve: async ({ input, ctx }) => {
    if (ctx.user?.role !== 'admin') {
      throw new ForbiddenError('Only admins can delete models');
    }
    return catalogService.deleteModel(input.modelId);
  },
});
```

### At Service Level

```typescript
// CatalogService.listObjects()
async listObjects(filter, user) {
  let query = db.objects.select();
  
  // Apply visibility filter
  if (!user) {
    // Guest: only public objects
    query = query.where('visibility', '=', 'all');
  } else if (user.role === 'admin') {
    // Admin: see all
    // No filter
  } else {
    // Regular user: see public + ones they're allowed to see
    const userObjectIds = await db.catalogVisibility
      .where('visibleTo', 'in', ['all', 'role', 'users', 'hierarchy'])
      .where('value', 'in', [
        user.role,
        user.userId,
        ...user.hierarchy,
      ])
      .select('objectId');
    
    query = query.where('id', 'in', userObjectIds);
  }
  
  return query;
}
```

## Permission Check Workflow

```
User Action (e.g., "Create Model")
  ↓
1. Is user authenticated?
   No  → Return AuthError
   Yes → Continue
   ↓
2. Does user have required permission?
   No  → Return ForbiddenError
   Yes → Continue
   ↓
3. Validate input
   Invalid → Return ValidationError
   Valid   → Continue
   ↓
4. Execute operation
   ↓
5. Apply visibility rules (if reading)
   ↓
6. Return data to user
```

## Example: Creating a Model

```typescript
// User clicks "Train Model" button
// Frontend: catalog.createModel.mutate({...})
// ↓
// BFF: catalogRouter.createModel()

// 1. Is user authenticated?
if (!ctx.user) {
  throw new AuthError('Must sign in to create models');
}

// 2. Does user have create_model permission?
const hasPermission = await permissionsService.check(
  ctx.user,
  'create_model'
);
if (!hasPermission) {
  throw new ForbiddenError(
    'You do not have permission to create models'
  );
}

// 3. Validate input
const input = CreateModelInput.parse({
  objectId,
  sensorGroup,
  geography,
  datasetUrl,
});

// 4. Check that object exists
const object = await catalogService.getObject(input.objectId);
if (!object) {
  throw new Error('Object not found');
}

// 5. Can user see this object?
if (!object.isVisibleTo(ctx.user)) {
  throw new ForbiddenError('You cannot access this object');
}

// 6. Create model (succeeds because all checks passed)
return catalogService.createModel(input, ctx.user);
```

## Example: Listing Objects

```typescript
// User: catalog.objects.query({ category: 'vehicle' })
// ↓
// BFF: catalogRouter.objects()

// No authentication required (guest procedure)
// But visibility filtering applied

const allObjects = await db.objects
  .where('category', '=', 'vehicle');

// Filter by visibility
const visibleObjects = allObjects.filter(obj => {
  if (obj.visibility === 'all') {
    return true;  // Public
  }
  if (!ctx.user) {
    return false; // Guest can't see non-public
  }
  if (ctx.user.role === 'admin') {
    return true;  // Admin sees everything
  }
  
  // Regular user: check if they can see it
  return obj.isVisibleTo(ctx.user);
});

return visibleObjects;
```

## Common Patterns

### Creating Objects
```
Permission: create_object
Role: user or admin
Who can see it:
  - Creator always sees it
  - Can be marked for specific hierarchy level
  - Or all users
```

### Training Models
```
Permission: create_model
Role: user or admin
Who can see model:
  - Creator sees it
  - Object determines visibility
  - If object is public, model usually public
```

### Deleting Objects/Models
```
Permission: delete_object or delete_model
Role: admin only
Visibility:
  - Once deleted, no one sees it
  - No soft-delete (just removed)
```

### Exporting Data
```
Permission: export_data
Role: admin or specific users
Result:
  - User can download all visible data as CSV/JSON
  - Includes only objects/models they can see
```

## Frontend Integration

### Hide Unauthorized UI

```typescript
// roles.ts utility
export function canCreateModel(user: AppUser): boolean {
  return user && user.role !== 'guest';
}

// Component
export function CreateModelButton() {
  const { user } = useContext(AuthContext);
  
  if (!canCreateModel(user)) {
    return null; // Don't show button
  }
  
  return <Button onClick={handleCreate}>Train Model</Button>;
}
```

### Handle Permission Errors

```typescript
const handleCreateModel = async (input) => {
  try {
    await client.catalog.createModel.mutate(input);
  } catch (error) {
    if (error.data?.code === 'FORBIDDEN') {
      showToast('You do not have permission to create models.');
    } else {
      showToast('Error creating model.');
    }
  }
};
```

## Security Principles

1. **Default Deny**: If permission not explicitly granted, deny
2. **Fail Safe**: If permission check fails, deny operation
3. **Server-Side**: Checks happen in BFF, not frontend
   - Frontend UI hiding is just UX, not security
4. **Audit Trail**: Log who did what and when
5. **Least Privilege**: Give minimum permissions needed

## Related Concepts

- [[jarvis]] — Project overview
- [[jwt-authentication]] — User identified via JWT
- [[adfs-authentication]] — User roles from ADFS
- [[request-context-pattern]] — User passed through context
- [[jarvis-bff]] — Where permissions are checked
- [[jarvis-data-model]] — Objects that permissions control

## Sources

- [[raw/jarvis/BFF-ARCHITECTURE.md]]
