# @jarvis/db — Schema Map

> **Derived document.** Written by reading `libs/db/src/schema.ts`,
> `libs/db/src/relations.ts`, `libs/db/src/seed-data.ts`, `libs/db/src/seed.ts` and
> `libs/db/migrations/`. Statements of fact are traceable to those files;
> interpretation is marked as inference.

## Shape of the domain

The catalog describes **what can be detected** (objects), **what does the
detecting** (four families of model), and **under what conditions** (rules bound to
sensors, resolution and geography).

Everything user-facing is bilingual: `english_name` / `hebrew_name` appear as a
pair on objects, categories, rules and sequences, and the English name is the
primary key while the Hebrew name carries a `UNIQUE` constraint. Hebrew is not a
translation layer bolted on top — it is in the keys.

## Table inventory (21 application tables + PostGIS)

### Identity and access
| Table | Key | Notes |
|---|---|---|
| `users` | `id` uuid (`defaultRandom`) | `user_id` unique; carries `hierarchy` from the directory |
| `permissions` | `id` serial | unique on (`subject_type`, `subject`); `role` is a free-text varchar, not an enum |

### Taxonomy
| Table | Key | Notes |
|---|---|---|
| `object_categories` | `english_name` | `hebrew_name` unique |
| `objects` | `english_name` | FK `category_name` → `object_categories.english_name`; `hebrew_name` unique |

### Sensing and geography vocabulary
| Table | Key | Notes |
|---|---|---|
| `sensors` | `name` | name-only lookup table |
| `sensing_types` | `name` | name-only lookup table |
| `sensor_groups` | `name` | `sensors` is a `varchar[]` — **not** a FK to `sensors` |
| `geographies` | `name` | `geometry` column, PostGIS |

### The four model families
| Table | Key | Depends on |
|---|---|---|
| `embedder_models` | `id` serial | — (the base of the chain) |
| `dexter_models` | `id` serial | FK `embedder_id` → `embedder_models.id` |
| `deep_wisdom_models` | `id` integer via `nextval(...)` | — |
| `detecting_models` | `id` serial | — |

Only one FK exists between model tables: dexter → embedder. The other three
families are independent roots.

### Composition
| Table | Key | Notes |
|---|---|---|
| `sequences` | `id` serial | FK `deep_wisdom_model_id`; `dexter_model_ids` is `integer[]` with a GIN index |
| `sequence_model_names` | `sequence_name` | same relationship expressed by **name**: `deep_wisdom_model_name` + `dexter_model_names varchar[]`, also GIN-indexed |

### Rules and performance
| Table | Key | Notes |
|---|---|---|
| `rules` | `name` | FKs to `geographies`, `sensing_types`, `sensor_groups`; `user_ids varchar[]`; min/max resolution |
| `sqrules` | `id` serial | FK `rule_name` → `rules.name`, FK `sequence_id` → `sequences.id`; carries `performance_rate` json, `operational_status`, `config` json |
| `detecting_models_rules` | `id` serial | FK `model_id` → `detecting_models.id`, FK `rule_name` → `rules.name`; same `performance_rate` / `operational_status` pair |

### Model ↔ object join tables
| Table | Composite key | Extra |
|---|---|---|
| `detecting_models_objects` | (`object_name`, `model_name`) | — |
| `dexter_models_objects` | (`object_name`, `model_name`) | `detection_order` |
| `deep_wisdom_models_objects` | (`object_name`, `model_name`) | `detection_order` |

### Legacy / infrastructure
- `deep_wisdom_models_backup` — every column nullable, no primary key, no FKs
- `spatial_ref_sys` — PostGIS
- `geography_columns`, `geometry_columns` — PostGIS system **views**, defined as
  `pgView` with the full PostGIS SQL inlined

## The composition chain

```
embedder_models
      │ FK embedder_id
      ▼
 dexter_models ──┐
                 │  sequences.dexter_model_ids (integer[], no FK)
                 ▼
             sequences ──── FK deep_wisdom_model_id ──▶ deep_wisdom_models
                 │
                 │ FK sequence_id
                 ▼
              sqrules ───── FK rule_name ──▶ rules ──▶ geographies
                                                   ├──▶ sensing_types
                                                   └──▶ sensor_groups

detecting_models ──── FK model_id ──▶ detecting_models_rules ──▶ rules
```

So a **sequence** is the composite unit: one deep-wisdom model plus an array of
dexter models, each dexter model in turn backed by an embedder. `detecting_models`
sits entirely outside that chain with its own rule table.

## Referential integrity gaps

These are visible in the schema and are worth knowing before trusting a join.

**1. The three `*_models_objects` tables have a FK on `object_name` but none on
`model_name`.** Each declares exactly one `foreignKey` (to `objects.english_name`)
plus the composite primary key. `model_name` is an unenforced string, because the
model tables are keyed by `id`, not by name. Nothing at the database level stops a
join row pointing at a model that does not exist.

**2. `sequences.dexter_model_ids` is an `integer[]`.** Postgres cannot put a FK on
an array element, so membership is unenforced. The GIN index makes lookup fast, not
correct.

**3. `sensor_groups.sensors` is a `varchar[]`** with no FK to `sensors.name`, same
situation.

**4. `sequence_model_names` duplicates `sequences` by name.** The same composition
is stored twice — once by id, once by name — with no constraint keeping the two in
agreement. *Inference:* this looks like a denormalized read path or a remnant of an
older name-keyed design; the files do not say.

## Migration history vs. schema.ts — they have diverged

Five migrations, journal version 7:

| idx | tag | what it does |
|---|---|---|
| 0000 | `high_mattie_franklin` | creates `users` |
| 0001 | `rapid_shinobi_shaw` | creates the bulk of the catalog (139 lines) |
| 0002 | `object_file_url_nullable` | `ALTER TABLE "objects" ALTER COLUMN "file_url" DROP NOT NULL` |
| 0003 | `sour_black_tom` | creates `permissions` |
| 0004 | `uppercase_operational_status` | data fix: uppercases `sqrules.operational_status` |

**`schema.ts` does not match what these migrations produce.** Concrete
disagreements:

| | migrations | `schema.ts` |
|---|---|---|
| `objects.file_url` nullability | made **nullable** by 0002 | still `.notNull()` |
| timestamp column name | `creation_time` (6 occurrences in 0001) | `create_time` |
| json columns | `jsonb` | `json()` |
| `objects.file_url` type | `text` | `varchar` |
| varchar length | `varchar(255)` | unbounded `varchar()` |

The nullability one is the sharpest: migration 0002 exists specifically to drop the
constraint, and the schema still declares it.

*Inference — strongly supported but not stated anywhere in the files:* `schema.ts`
was produced by **introspecting a live database** (`drizzle-kit pull`) rather than
being hand-authored as the source of truth. The supporting evidence:

- a `customType` literally named `unknown`, with repeated
  `// TODO: failed to parse database type 'name'` comments — introspection output,
  not something anyone writes by hand
- PostGIS system views (`geography_columns`, `geometry_columns`) and
  `spatial_ref_sys` included in an application schema, with their full internal SQL
  inlined — introspection sweeps up everything in the database
- `deep_wisdom_models_backup`, a backup table, present as a first-class export
- `deep_wisdom_models.id` written as
  `integer().default(sql`nextval('deep_wisdom_models_id_seq'::regclass)`)` instead
  of `serial()` — the shape introspection emits
- two sequences for the same table, `DeepWisdomModels_Id_seq` (PascalCase, legacy)
  and `deep_wisdom_models_id_seq` (snake_case)

**Practical consequence:** the migrations folder and `schema.ts` are two sources of
truth that no longer agree. `drizzle-kit generate` diffs against `schema.ts`, so the
next generated migration will be computed from the introspected state, not from the
migration history. **This is recorded as a live contradiction, not resolved.**

## Type exports

Every table exports a matching pair:

```ts
export type ObjectRow  = typeof objects.$inferSelect;
export type NewObjectRow = typeof objects.$inferInsert;
```

Note the naming dodges: `ObjectRow` / `PermissionRow` / `SpatialRefSysRow` carry a
`Row` suffix because `Object` and `Permission` collide with global or reserved
names. `GeographyArea` rather than `Geography` for the same reason.

`relations.ts` declares Drizzle relations separately from the table definitions —
these drive `db.query.<table>.with(...)` and are not database constraints.

## Seed data

`seed-data.ts` exports `readonly` arrays typed against the `New*` insert types
(`SEED_USERS: readonly NewUser[]`, and equivalents for geographies, categories,
permissions, rules, sensing types, sensors, sensor groups, embedder models).
Typing the fixtures against the schema means a schema change breaks the seed at
compile time rather than at runtime.

The fixtures contain real-looking Hebrew names and `@example.com` addresses.

## Files read

- `libs/db/src/schema.ts` (546 lines)
- `libs/db/src/relations.ts` (156 lines)
- `libs/db/src/seed-data.ts` (516 lines, sampled)
- `libs/db/src/index.ts`
- `libs/db/drizzle.config.ts`
- `libs/db/migrations/*.sql`, `libs/db/migrations/meta/_journal.json`
