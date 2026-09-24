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

## Sources

- [[raw/jarvis/MODEL-CATALOG-DATA-MODEL.md]]
