# Model Catalog Data Model

## Core Entities

The Model Catalog system manages several interconnected entities:

### Objects (Detectable Things)

**Objects** are physical things that can be detected by models (e.g., vehicles, buildings, boats).

Fields:
- `englishName`, `hebrewName` - Bilingual names
- `categoryName` - Which category (vehicle, building, etc.)
- `fileUrl` - Image/media file location
- `modelCount` - How many models can detect this object

### Models (Detection Models)

**Models** are trained deep learning models that detect specific objects.

Fields:
- `id` - Unique model identifier
- `englishName`, `hebrewName` - Bilingual names
- `operationalStatus` - OPERATIONAL or EXPERIMENTAL
- `performance` - Precision, recall, score threshold
- `sensorGroup` - What sensor type (RGB, SAR, Thermal, etc.)
- `sensors` - List of specific sensors in the group
- `hasDexter` - Whether model supports Dexter (a specific capability)
- `minResolution`, `maxResolution` - Supported resolution range (in km)
- `geography` - Geographic region this model covers
- `description` - Human-readable description
- `depthThreshold`, `dexterThreshold` - Detection thresholds
- `lastUpdateUser`, `updateTime` - Audit trail

### Categories

**Categories** organize objects by type.

Fields:
- `englishName`, `hebrewName` - Category name in both languages

Examples: Vehicle, Building, Ship, etc.

### Geographies

**Geographies** represent geographic regions that models cover.

Fields:
- `name` - Geography identifier

Examples: Israel, North America, Europe, etc.

### Sensor Groups

**Sensor Groups** classify detection sensors by type.

Fields:
- `name` - Sensor group identifier
- `sensors` - List of specific sensor models in group

Examples: RGB (visual), SAR (radar), Thermal, Multispectral, etc.

### Tagging Classes

**Tagging Classes** are labels used by **Picasso** (the tagging service) when humans label image data for training.

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

## Type System

The contract (`@jarvis/model-catalog-contract`) defines:

1. **Database types** - Generated from Drizzle schema (`createSelectSchema`)
2. **API types** - Refined types exposed to the frontend
3. **Input types** - Zod schemas for request validation

Example:
```typescript
// Database type (from Drizzle)
const ModelRow = createSelectSchema(deepWisdomModels);

// API type (what frontend receives)
export const Model = z.object({
  id: ModelId,
  englishName: string,
  hebrewName: string | null,
  operationalStatus: OperationalStatus,
  performance: ModelPerformance,
  sensorGroupName: string,
  // ... 10+ more fields
});
```

## Access & Visibility

### Users

**AppUser** contains:
- `userId` - Unique identifier (from ADFS)
- `fullName`, `displayName` - Display information
- `hierarchy` - Organization hierarchy (for permissions)
- `email` - Email address

### Permissions & Roles

Three role levels:
- **guest** - Public access (e.g., list objects)
- **user** - Authenticated user (e.g., create objects)
- **admin** - Full access (e.g., delete, manage permissions)

### Visibility Rules

**Catalog Visibility** restricts which objects/models users can see:
- Based on user's role and hierarchy
- Evaluated in `CatalogService.query()`
- Objects marked for specific users/groups

## Training & Models

### Model Training Flow

1. User initiates training via **CreateModelInput**
2. **RobertoService** queues training job in Task Manager
3. Task Manager executes training asynchronously
4. Model status tracked: TRAINING → OPERATIONAL/FAILED
5. Performance metrics updated when training completes

### Model Cloning

Users can **clone** models to:
- Create variants with different thresholds
- Experiment with different settings
- Maintain audit trail (original model ID preserved)

Input: **CloneModelInput**
Output: **CloneModelOutput** (new model ID)

## Configuration

### Web Config

Frontend-specific configuration delivered at startup:

```typescript
{
  DISABLE_ADFS_AUTH: boolean,
  MAX_ADFS_LOGIN_ATTEMPTS: number,
  SENSOR_GROUP_LABELS: { [sensorGroup]: label },
  GEOGRAPHY_LABELS: { [geography]: label },
  GEOGRAPHY_LABEL_SINGULAR/PLURAL: string,
  PINNED_GEOGRAPHY: string (optional),
  RESOLUTION_OPTIONS: { [geography]: [resolutions] },
  RESOLUTION_UNIT: "ק״מ" (km),
}
```

Allows frontend to render UI in multiple languages and adapt to configuration.

## Operations

### Read Operations
- `catalog.objects()` - List objects (with filters)
- `catalog.categories()` - List categories
- `catalog.geographies()` - List geographies
- `catalog.sensorGroups()` - List sensor groups
- `catalog.taggingClasses()` - List tagging classes
- `catalog.objectModels()` - Get models for an object

### Write Operations
- `catalog.createObject()` - Add new object
- `catalog.createModel()` - Start training new model
- `catalog.updateModel()` - Update model metadata
- `catalog.cloneModel()` - Clone existing model with new settings
- `catalog.retryTraining()` - Retry failed training
- `catalog.abortTraining()` - Cancel ongoing training

All write operations require authentication and permission checks.
