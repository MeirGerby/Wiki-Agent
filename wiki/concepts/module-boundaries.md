# Module Boundaries

## Definition

A set of dependency rules in an Nx monorepo that prevent projects from importing each other arbitrarily. Each project is tagged by scope (bounded context) and type (layer), and ESLint enforces that imports only happen between allowed pairs.

## Mental Model

A layered cake where you can eat from the top down (web layer can eat from ui), but not sideways (web cannot eat from bff). Layer rules keep architecture visible and prevent circular dependencies. Scope rules keep contexts separate so a team working on `analytics` cannot accidentally depend on `model-catalog` internals.

## Example

In Jarvis:

**Layer rules** (`type:*`):
- `type:web` → can use: `contract`, `ui`, `util`
- `type:bff` → can use: `contract`, `data`, `util`
- `type:contract` → can use: `data`, `util`
- `type:ui` → can use: `util`
- `type:data` → can use: nothing (leaf layer)

**Scope rules** (`scope:*`):
- Projects in `scope:model-catalog` can only use other `scope:model-catalog` projects + `scope:shared`
- Projects in `scope:shared` can only use `scope:shared` (isolated)
- Projects in `scope:tooling` can only use `scope:tooling` (isolated)

**Example violation**:
```typescript
// In apps/model-catalog/web/src/App.tsx
import { databasePool } from '@jarvis/db';  // ✅ OK (type:data via scope:shared)
import { SidePanel } from '@jarvis/ui';    // ✅ OK (type:ui via scope:shared)
import { getRouter } from '@jarvis/model-catalog-bff';  // ❌ ERROR (type:bff cannot be used by type:web)
```

## Implementation

Configured in `eslint.config.mjs` with `depConstraints`:

```javascript
{
  '@nx/enforce-module-boundaries': [
    'error',
    {
      depConstraints: [
        { sourceTag: 'type:web', allowedTags: ['type:contract', 'type:ui', 'type:util'] },
        { sourceTag: 'type:bff', allowedTags: ['type:contract', 'type:data', 'type:util'] },
        // ... more rules
      ]
    }
  ]
}
```

## Related Concepts

- [[nx-monorepo]]
- [[bounded-contexts]]

## Sources

- [[raw/jarvis/nx.md]]
- [[raw/jarvis/eslint.config.mjs]]
