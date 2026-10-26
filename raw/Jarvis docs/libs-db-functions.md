# libs/db: functions reference

`libs/db` (`@jarvis/db`) holds the Drizzle ORM schema, the database connection factory, and a seed script for the Postgres database used by the model-catalog apps.

It has very few real functions. Most of the code is declarative: table definitions, relations and seed data. Those are summarized at the end so nothing is missed.

## Functions

### `src/index.ts`
- `createDb({ connectionString, ssl, max = 10 })`: opens a `postgres` connection pool (default 10 connections) and wraps it with Drizzle using the full schema. Returns `{ db, client }`.
  - `db` is used for queries.
  - `client` is the raw connection, so callers can close it with `client.end()`.
- `Db` (type): the type of the `db` object. Services take it in their constructors.
- The file also re-exports everything from `schema.ts`.

### `src/seed.ts`
A script, run from the command line. Each seed function returns how many rows it inserted. All of them use "insert, skip if already there", so running the script twice is safe.
- `now()` and `stamps()`: return the current ISO time, and a `{ createTime, updateTime }` pair.
- `seedUsers(db)`: inserts the seed users, conflict on `userId`.
- `seedPermissions(db)`: inserts the seed permissions, conflict on subject type plus subject.
- `seedCategories(db)`: inserts the object categories, conflict on English name.
- `seedEmbedder(db)`: inserts the one embedder model unless one with that name already exists. Returns its ID and whether it was added. Throws if the insert returns nothing.
- `seedObjects(db)`: inserts the objects, with a generated `s3://jarvis-objects/<name>/reference.zip` file URL and the seed creator.
- `seedModels(db, embedderId)`: inserts only the dexter models whose names don't exist yet, linked to the embedder, with a generated `s3://jarvis-models/dexter/...onnx` URL.
- `seedDeepWisdomModels(db)`: the same for deep-wisdom models, with an `s3://jarvis-models/deep-wisdom/...` URL.
- `seedDeepWisdomLinks(db)`: links each object to its deep-wisdom models, numbering `detectionOrder` from 1.
- `seedModelLinks(db)`: the same linking for dexter models.
- `seedReferenceData(db)`: inserts sensing types, sensors, areas, sensor groups and then rules. Returns the number of rules added.
- `seedSequences(db)`: for each deep-wisdom model that has no sequence yet:
  - creates a sequence (`<model>_sequence`) pointing at the model and its dexter models;
  - records the sequence's model names;
  - creates a model rule (`<model>_sqrule`) with the config derived by `sqruleConfig`, status OPERATIONAL if active and EXPERIMENTAL otherwise.
  - Returns the number of sequences and sqrules added.
- `resetModelTables(db)`: deletes all rows from every table the seed owns, children before parents.
- The script body (top-level code):
  - Loads the BFF's `.env`.
  - Reads `DATABASE_URL_UNPOOLED` or `DATABASE_URL`, and exits with an error if neither is set.
  - Opens a single-connection `createDb`.
  - With `--reset`, runs `resetModelTables` first.
  - Runs all seed steps in dependency order, prints added versus planned counts, and always closes the connection.

### `src/seed-data.ts`
- `sqruleConfig(config)`: converts a deep-wisdom config into the model-rule config. Its `omekScoreThresh` is the config's recommended score threshold, and `dexterScoreThresh` is copied through.
- `detectorConfig(architecture, inputSize, threshold)` (internal): builds a dexter model config: square input size, score threshold, NMS 0.45, fp16.
- `round2(value)` (internal): rounds to 2 decimal places.
- `wisdomConfig(confidence, useRotatedBoxes)` (internal): builds a deep-wisdom config from one confidence value. Derives three omek thresholds, day/night/low-light dexter thresholds and the performance figures (precision, recall, recommended threshold).
- Exported seed data (constants, no logic): `SEED_USERS`, `SEED_CREATE_USER`, `SEED_PERMISSIONS`, `SEED_EMBEDDER`, `SEED_CATEGORIES`, `SEED_SENSING_TYPES`, `SEED_SENSORS`, `SEED_GEOGRAPHY`, `SEED_SENSOR_GROUPS`, `SEED_RULES`, `SEED_OBJECTS`.

### `drizzle.config.ts`
- Not a function. It exports the drizzle-kit config:
  - PostgreSQL dialect, schema `./src/schema.ts`, migrations in `./migrations`.
  - It loads the BFF's `.env` and prefers `DATABASE_URL_UNPOOLED` (needed for migrations) over `DATABASE_URL`.
  - `generate` needs no database.

## Declarative code (no functions)

### `src/schema.ts`
Drizzle table definitions:
- Users and permissions: `users`, `permissions`.
- Objects: `objects`, `objectCategories`.
- Models: `sqrules`, `sequences`, `sequenceModelNames`, `deepWisdomModels`, `deepWisdomModelsBackup`, `dexterModels`, `embedderModels`, `detectingModels`.
- Rules and reference data: `rules`, `sensorGroups`, `sensors`, `sensingTypes`, `geographies`.
- Link tables: `deepWisdomModelsObjects`, `dexterModelsObjects`, `detectingModelsObjects`, `detectingModelsRules`.
- PostGIS leftovers: `spatialRefSys`, `geographyColumns`, `geometryColumns`.
- ID sequences: `sqrulesIdSeq`, `sequenceModelsIdSeq`, `deepWisdomModelsIdSeqLegacy`, `deepWisdomModelsIdSeq`.
- A `$inferSelect` type and a `$inferInsert` type for each table, for example `User` and `NewUser`.

### `src/relations.ts`
Drizzle relation definitions that let the query builder follow foreign keys. Covers `detectingModels`, `detectingModelsRules`, `rules`, `sqrules`, `sequences`, `objects`, `objectCategories`, `geographies`, `sensingTypes`, `sensorGroups` and the model tables.

### `migrations/`
Seven SQL migrations (`0000` to `0006`) and the drizzle-kit `meta/` snapshots. They are generated or hand-written SQL, not functions.
