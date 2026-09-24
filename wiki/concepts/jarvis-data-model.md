# Jarvis Model Catalog Data Model

## Definition

The Jarvis data model defines the core entities that represent the Model Catalog: objects (detectable things), models (detection models), and the metadata that ties them together (categories, geographies, sensor groups, permissions).

## Mental Model

A field guide crossed with a tool catalog. Objects are the species you want to
spot; models are the instruments that spot them. Categories, geographies and
sensor groups are the index tabs that tell you which instrument works on which
species, where, and with what equipment.

## Core Entities

### Objects
Physical things that can be detected (vehicles, buildings, ships, etc.).

Fields:
- `englishName`, `hebrewName` — Bilingual display names
- `categoryName` — Which category (vehicle, building, etc.)
- `fileUrl` — Image/media file location
- `modelCount` — How many models can detect this object
- `visibility` — Which users/groups can see this object

Example:
```json
{
  "id": "obj_car",
  "englishName": "Car",
  "hebrewName": "מכונית",
  "categoryName": "vehicle",
  "fileUrl": "https://storage/car.jpg",
  "modelCount": 5
}
```

### Models
Trained deep learning models that detect specific objects.

Fields:
- `id` — Unique model identifier
- `englishName`, `hebrewName` — Bilingual names
- `operationalStatus` — OPERATIONAL, EXPERIMENTAL, or TRAINING
- `performance` — Precision, recall, confidence threshold
- `sensorGroupName` — Sensor type (RGB, SAR, Thermal, etc.)
- `sensors` — List of specific sensor models in the group
- `hasDexter` — Whether model supports Dexter capability
- `minResolution`, `maxResolution` — Supported resolution range (km)
- `geography` — Geographic region covered
- `description` — Human-readable description
- `depthThreshold`, `dexterThreshold` — Detection thresholds
- `lastUpdateUser` — Who last modified (audit trail)
- `updateTime` — When last modified

Example:
```json
{
  "id": "model_car_rgb_israel",
  "englishName": "Car Detector (RGB, Israel)",
  "hebrewName": "מגלה מכוניות (RGB, ישראל)",
  "operationalStatus": "OPERATIONAL",
  "performance": {
    "precision": 0.95,
    "recall": 0.92,
    "scoreThreshold": 0.75
  },
  "sensorGroupName": "RGB",
  "geography": "israel",
  "minResolution": 0.1,
  "maxResolution": 10.0
}
```

### Categories
Organize objects by type (Vehicle, Building, Ship, etc.).

Fields:
- `englishName`, `hebrewName` — Category name in both languages

### Geographies
Geographic regions that models cover (Israel, North America, Europe, etc.).

Fields:
- `name` — Geography identifier

### Sensor Groups
Classify detection sensors by type (RGB/visual, SAR/radar, Thermal, Multispectral).

Fields:
- `name` — Sensor group identifier
- `sensors` — List of specific sensor models in group

### Tagging Classes
Labels used by [[jarvis-external-integrations]] Picasso service when humans label image data for training.

Fields:
- Class identifier
- Associated object
- Associated sensor type

## Relationships

```
Category ← Object → Model ← SensorGroup
                       ↓
                    Geography
                    
User ← Permission (who can do what)
     ← Role (admin, user, guest)
```

**Many-to-many relationships**:
- A model can detect multiple objects
- An object can be detected by multiple models
- A user can have multiple permissions
- A geography can have multiple models

## Storage view: what the tables actually look like

Everything above describes the **API shape** — the `Model` a client receives. The
database is organised differently, and the two are worth holding separately.

There is no `models` table. There are **four independent model families**:

| Table | Key | Depends on |
|---|---|---|
| `embedder_models` | `id` serial | — (base of the chain) |
| `dexter_models` | `id` serial | FK `embedder_id` → `embedder_models.id` |
| `deep_wisdom_models` | `id` | — |
| `detecting_models` | `id` serial | — |

Only one foreign key runs between them: dexter → embedder. The other three are
independent roots.

A **sequence** is the composite unit — one deep-wisdom model plus an array of
dexter models:

```
embedder_models
      │ FK embedder_id
      ▼
 dexter_models ──┐  sequences.dexter_model_ids (integer[], no FK)
                 ▼
             sequences ──── FK deep_wisdom_model_id ──▶ deep_wisdom_models
                 │ FK sequence_id
                 ▼
              sqrules ───── FK rule_name ──▶ rules ──┬──▶ geographies
                                                     ├──▶ sensing_types
                                                     └──▶ sensor_groups

detecting_models ── FK model_id ──▶ detecting_models_rules ──▶ rules
```

### Where the API's Model fields actually live

The flattened `Model` above is assembled from several tables:

| API field | Stored on |
|---|---|
| `englishName`, `hebrewName` | `sqrules` / `detecting_models_rules` |
| `operationalStatus`, `performance` | `sqrules` / `detecting_models_rules` |
| `minResolution`, `maxResolution` | `rules` |
| `sensorGroupName`, `sensingType` | `rules` (FKs to the vocabulary tables) |
| `geography` | `rules` → `geographies` |
| `lastUpdateUser` | `sqrules` |

So an API "model" corresponds most closely to a **rule row joined to its model**,
not to a row in any model table. The conditions under which a model applies live on
the rule, not on the model.

*This mapping is inference from column names and foreign keys. The sources define
the API shape and the tables separately and never state the correspondence.*

### Referential integrity gaps

Visible in the schema, and worth knowing before trusting a join:

**The three `*_models_objects` join tables have no FK on `model_name`.** Each of
`detecting_models_objects`, `dexter_models_objects` and `deep_wisdom_models_objects`
declares exactly one foreign key — to `objects.english_name` — plus the composite
primary key. `model_name` is an unenforced string, because the model tables are
keyed by `id`, not by name. Nothing at the database level stops a join row pointing
at a model that does not exist.

**Array columns cannot carry foreign keys.** `sequences.dexter_model_ids` is an
`integer[]` and `sensor_groups.sensors` is a `varchar[]`. Both have GIN indexes,
which makes lookup fast but not correct.

**`sequence_model_names` duplicates `sequences` by name.** The same composition is
stored twice — once by id, once by name — with nothing keeping the two in
agreement. *Inference:* a denormalized read path, or a remnant of an older
name-keyed design; the sources do not say.

### Bilingual keys

`english_name` / `hebrew_name` appear as a pair on objects, categories, rules and
sequences. The English name is the **primary key** and the Hebrew name carries a
`UNIQUE` constraint. Hebrew is not a presentation layer bolted on top — it is in
the keys, which means renaming a Hebrew label is a constrained database operation,
not a translation-file edit.

### Legacy and infrastructure tables

`deep_wisdom_models_backup` (every column nullable, no primary key), plus PostGIS:
`spatial_ref_sys` and the `geography_columns` / `geometry_columns` views.
`geographies.geometry` is a real PostGIS geometry column — see
[[latitude-longitude]] for the coordinate concepts underneath it.

These appear in `schema.ts` because it was generated by introspection rather than
authored. That has consequences for migrations — see [[schema-source-of-truth]].

## Users & Access

### Users
Authenticated users from ADFS (Active Directory).

Fields:
- `userId` — Unique identifier from ADFS
- `fullName`, `displayName` — Display information
- `hierarchy` — Organization hierarchy (for permissions)
- `email` — Email address
- `lastLoginAt` — Timestamp of last login

### Permissions & Roles

Three role levels:
- **guest** — Public access (list objects, view models)
- **user** — Authenticated user (create objects, train models)
- **admin** — Full access (delete, manage permissions, modify system settings)

### Catalog Visibility

Visibility rules restrict which objects/models users can see:
- Based on user's role and hierarchy
- Evaluated in `CatalogService.query()`
- Objects marked for specific users/groups

Example:
```typescript
// Only admins see experimental models
if (model.operationalStatus === 'EXPERIMENTAL' && !user.isAdmin) {
  return false; // Don't include in results
}

// Users only see objects for their geography
if (!geography.includes(user.hierarchy[0])) {
  return false;
}
```

## Type System

### Database Types (Drizzle)
Generated from schema using `createSelectSchema`:
```typescript
const ModelRow = createSelectSchema(deepWisdomModels);
// Includes ALL database columns, even internal ones
```

### API Types (Zod)
Refined types exposed to frontend:
```typescript
const Model = z.object({
  id: ModelId,
  englishName: string,
  hebrewName: string | null,
  operationalStatus: OperationalStatus,
  performance: ModelPerformance,
  sensorGroupName: string,
  // ... selected fields only
});
```

### Input Types (Zod)
Validation schemas for incoming requests:
```typescript
const CreateModelInput = z.object({
  objectId: z.string(),
  sensorGroup: z.string(),
  geography: z.string(),
  datasetUrl: z.string(),
});

const UpdateModelInput = z.object({
  id: z.string(),
  englishName: z.string().optional(),
  hebrewName: z.string().optional(),
  // ... other updatable fields
});
```

## Model Training

### Training Flow

```
1. User initiates training
   Input: { objectId, sensorGroup, geography, dataset }
   ↓
2. CatalogService.createModel()
   Creates model record in database
   status = TRAINING
   ↓
3. RobertoService.submit(modelConfig)
   Submits to Roberto API
   Gets back trainingJobId
   ↓
4. TaskManagerService.enqueue()
   Queues job for processing
   ↓
5. Roberto executes training asynchronously
   Trains neural network
   Computes precision, recall, threshold
   ↓
6. On completion, webhook notifies BFF
   Returns metrics
   ↓
7. BFF updates model in database
   status = OPERATIONAL
   performance = { precision, recall, threshold }
   updateTime = now()
   ↓
8. Frontend polls, sees status changed
   Displays new model with metrics
```

### Model Cloning

Users can clone models to:
- Create variants with different thresholds
- Experiment with different settings
- Maintain audit trail (original model ID preserved)

Input: `CloneModelInput`
Output: `CloneModelOutput` (new model ID)

## Configuration

### Web Config
Frontend-specific configuration delivered at startup:

```json
{
  "DISABLE_ADFS_AUTH": false,
  "MAX_ADFS_LOGIN_ATTEMPTS": 5,
  "SENSOR_GROUP_LABELS": {
    "RGB": "Visual",
    "SAR": "Radar",
    "Thermal": "Thermal"
  },
  "GEOGRAPHY_LABELS": {
    "israel": "Israel",
    "north_america": "North America"
  },
  "RESOLUTION_OPTIONS": {
    "israel": [0.1, 0.5, 1.0, 2.0, 5.0],
    "north_america": [0.5, 1.0, 2.0, 5.0]
  },
  "RESOLUTION_UNIT": "km"
}
```

## Operations

### Read Operations
```
catalog.objects(filter?)         — List objects with optional filter
catalog.categories()             — List all categories
catalog.geographies()            — List all geographies
catalog.sensorGroups()           — List all sensor groups
catalog.taggingClasses()         — List tagging classes
catalog.objectModels(objectId)   — Get models for object
```

### Write Operations
```
catalog.createObject(input)      — Add new object
catalog.createModel(input)       — Start training new model
catalog.updateModel(id, input)   — Update model metadata
catalog.cloneModel(id, input)    — Clone with new settings
catalog.retryTraining(modelId)   — Retry failed training
catalog.abortTraining(modelId)   — Cancel training
```

All write operations require authentication and permission checks.

## Related Concepts

- [[jarvis]] — Project overview
- [[drizzle-orm]] — ORM used for queries
- [[jarvis-bff]] — Services that manage data
- [[jarvis-model-training]] — Training flow
- [[jarvis-permissions]] — Visibility and access control
- [[jarvis-shared-libs]] — The `@jarvis/db` package holding this schema
- [[schema-source-of-truth]] — Why the schema and its migrations disagree
- [[latitude-longitude]] — Coordinates behind the PostGIS geography column

## Sources

- [[raw/jarvis/MODEL-CATALOG-DATA-MODEL.md]]
- [[raw/jarvis/libs/db/src/schema.ts]]
- [[raw/jarvis/libs/db/src/relations.ts]]
- [[raw/jarvis/libs/DB-SCHEMA-MAP.md]]

The entity sections above describe the API contract, from the data-model document.
The storage sections describe the tables, read from `schema.ts`. Where the two
differ, both are recorded — the mapping between them is inference and is marked as
such.
