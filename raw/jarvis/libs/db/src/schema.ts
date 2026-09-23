import {
  pgTable,
  foreignKey,
  serial,
  varchar,
  integer,
  timestamp,
  json,
  boolean,
  unique,
  index,
  geometry,
  primaryKey,
  pgView,
  text,
  pgSequence,
  uuid,
  customType,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const unknown = customType<{ data: string }>({ dataType: () => 'name' });

export const sqrulesIdSeq = pgSequence('Sqrules_Id_seq', {
  startWith: '1',
  increment: '1',
  minValue: '1',
  maxValue: '9223372036854775807',
  cache: '1',
  cycle: false,
});
export const sequenceModelsIdSeq = pgSequence('SequenceModels_Id_seq', {
  startWith: '1',
  increment: '1',
  minValue: '1',
  maxValue: '9223372036854775807',
  cache: '1',
  cycle: false,
});
export const deepWisdomModelsIdSeqLegacy = pgSequence(
  'DeepWisdomModels_Id_seq',
  {
    startWith: '1',
    increment: '1',
    minValue: '1',
    maxValue: '9223372036854775807',
    cache: '1',
    cycle: false,
  },
);
export const deepWisdomModelsIdSeq = pgSequence('deep_wisdom_models_id_seq', {
  startWith: '1',
  increment: '1',
  minValue: '1',
  maxValue: '9223372036854775807',
  cache: '1',
  cycle: false,
});

export const users = pgTable(
  'users',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    email: varchar({ length: 255 }),
    displayName: varchar('display_name', { length: 255 }),
    fullName: varchar('full_name', { length: 255 }),
    hierarchy: varchar({ length: 255 }),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
  },
  (table) => [unique('users_user_id_key').on(table.userId)],
);

export const permissions = pgTable(
  'permissions',
  {
    id: serial().primaryKey().notNull(),
    subjectType: varchar('subject_type', { length: 255 }).notNull(),
    subject: varchar({ length: 255 }).notNull(),
    role: varchar({ length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('permissions_subject_type_subject_key').on(
      table.subjectType,
      table.subject,
    ),
  ],
);

export const detectingModelsRules = pgTable(
  'detecting_models_rules',
  {
    id: serial().primaryKey().notNull(),
    englishName: varchar('english_name').notNull(),
    hebrewName: varchar('hebrew_name').notNull(),
    ruleName: varchar('rule_name').notNull(),
    modelId: integer('model_id').notNull(),
    createTime: timestamp('create_time', { mode: 'string' }).notNull(),
    updateTime: timestamp('update_time', { mode: 'string' }).notNull(),
    performanceRate: json('performance_rate').notNull(),
    operationalStatus: varchar('operational_status').notNull(),
    version: integer().notNull(),
    isActive: boolean('is_active').notNull(),
    algorithmName: varchar('algorithm_name').notNull(),
    description: varchar(),
  },
  (table) => [
    foreignKey({
      columns: [table.modelId],
      foreignColumns: [detectingModels.id],
      name: 'detecting_models_rules_model_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.ruleName],
      foreignColumns: [rules.name],
      name: 'detecting_models_rules_rule_name_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ],
);

export const spatialRefSys = pgTable('spatial_ref_sys', {
  srid: integer().notNull(),
  authName: varchar('auth_name', { length: 256 }),
  authSrid: integer('auth_srid'),
  srtext: varchar({ length: 2048 }),
  proj4Text: varchar('proj4text', { length: 2048 }),
});

export const detectingModels = pgTable('detecting_models', {
  id: serial().primaryKey().notNull(),
  modelName: varchar('model_name').notNull(),
  createTime: timestamp('create_time', { mode: 'string' }).notNull(),
  updateTime: timestamp('update_time', { mode: 'string' }).notNull(),
  version: integer().notNull(),
  config: json().notNull(),
  fileUrl: varchar('file_url').notNull(),
  isActive: boolean('is_active').notNull(),
  algorithmName: varchar('algorithm_name').notNull(),
});

export const deepWisdomModelsBackup = pgTable('deep_wisdom_models_backup', {
  id: integer(),
  modelName: varchar('model_name'),
  createTime: timestamp('create_time', { mode: 'string' }),
  updateTime: timestamp('update_time', { mode: 'string' }),
  version: integer(),
  config: json(),
  fileUrl: varchar('file_url'),
  isActive: boolean('is_active'),
});

export const sqrules = pgTable(
  'sqrules',
  {
    id: serial().primaryKey().notNull(),
    englishName: varchar('english_name').notNull(),
    hebrewName: varchar('hebrew_name').notNull(),
    ruleName: varchar('rule_name').notNull(),
    sequenceId: integer('sequence_id').notNull(),
    createTime: timestamp('create_time', { mode: 'string' }).notNull(),
    updateTime: timestamp('update_time', { mode: 'string' }).notNull(),
    performanceRate: json('performance_rate').notNull(),
    operationalStatus: varchar('operational_status').notNull(),
    version: integer().notNull(),
    isActive: boolean('is_active').notNull(),
    config: json().notNull(),
    lastUpdateUser: varchar('last_update_user'),
    description: varchar(),
  },
  (table) => [
    foreignKey({
      columns: [table.ruleName],
      foreignColumns: [rules.name],
      name: 'sqrules_rule_name_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.sequenceId],
      foreignColumns: [sequences.id],
      name: 'sqrules_sequence_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ],
);

export const sensorGroups = pgTable('sensor_groups', {
  name: varchar().primaryKey().notNull(),
  description: varchar().notNull(),
  sensors: varchar().array().notNull(),
});

export const objectCategories = pgTable(
  'object_categories',
  {
    englishName: varchar('english_name').primaryKey().notNull(),
    hebrewName: varchar('hebrew_name').notNull(),
    description: varchar().notNull(),
  },
  (table) => [unique('object_categories_hebrew_name_key').on(table.hebrewName)],
);

export const objects = pgTable(
  'objects',
  {
    englishName: varchar('english_name').primaryKey().notNull(),
    hebrewName: varchar('hebrew_name').notNull(),
    createTime: timestamp('create_time', { mode: 'string' }).notNull(),
    updateTime: timestamp('update_time', { mode: 'string' }).notNull(),
    createUser: varchar('create_user').notNull(),
    fileUrl: varchar('file_url').notNull(),
    categoryName: varchar('category_name').notNull(),
    isActive: boolean('is_active').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.categoryName],
      foreignColumns: [objectCategories.englishName],
      name: 'objects_category_name_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    unique('objects_hebrew_name_key').on(table.hebrewName),
  ],
);

export const embedderModels = pgTable('embedder_models', {
  id: serial().primaryKey().notNull(),
  modelName: varchar('model_name').notNull(),
  createTime: timestamp('create_time', { mode: 'string' }).notNull(),
  updateTime: timestamp('update_time', { mode: 'string' }).notNull(),
  version: integer().notNull(),
  fileUrl: varchar('file_url').notNull(),
  isActive: boolean('is_active').notNull(),
});

export const sequenceModelNames = pgTable(
  'sequence_model_names',
  {
    sequenceName: varchar('sequence_name').primaryKey().notNull(),
    deepWisdomModelName: varchar('deep_wisdom_model_name').notNull(),
    dexterModelNames: varchar('dexter_model_names').array().notNull(),
  },
  (table) => [
    index('idx_seq_dexter_model_nsmes').using(
      'gin',
      table.dexterModelNames.asc().nullsLast().op('array_ops'),
    ),
  ],
);

export const sensors = pgTable('sensors', {
  name: varchar().primaryKey().notNull(),
});

export const sensingTypes = pgTable('sensing_types', {
  name: varchar().primaryKey().notNull(),
});

export const geographies = pgTable('geographies', {
  name: varchar().primaryKey().notNull(),
  geometry: geometry().notNull(),
});

export const rules = pgTable(
  'rules',
  {
    name: varchar().primaryKey().notNull(),
    minResolution: integer('min_resolution'),
    maxResolution: integer('max_resolution'),
    sensingType: varchar('sensing_type'),
    sensorGroup: varchar('sensor_group'),
    geographyName: varchar('geography_name'),
    userIds: varchar('user_ids').array(),
  },
  (table) => [
    foreignKey({
      columns: [table.geographyName],
      foreignColumns: [geographies.name],
      name: 'rules_geography_name_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.sensingType],
      foreignColumns: [sensingTypes.name],
      name: 'rules_sensing_type_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.sensorGroup],
      foreignColumns: [sensorGroups.name],
      name: 'rules_sensor_group_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ],
);

export const dexterModels = pgTable(
  'dexter_models',
  {
    id: serial().primaryKey().notNull(),
    modelName: varchar('model_name').notNull(),
    createTime: timestamp('create_time', { mode: 'string' }).notNull(),
    updateTime: timestamp('update_time', { mode: 'string' }).notNull(),
    version: integer().notNull(),
    fileUrl: varchar('file_url').notNull(),
    config: json().notNull(),
    embedderId: integer('embedder_id').notNull(),
    isActive: boolean('is_active').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.embedderId],
      foreignColumns: [embedderModels.id],
      name: 'dexter_models_embedder_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ],
);

export const deepWisdomModels = pgTable('deep_wisdom_models', {
  id: integer()
    .default(sql`nextval('deep_wisdom_models_id_seq'::regclass)`)
    .primaryKey()
    .notNull(),
  modelName: varchar('model_name').notNull(),
  createTime: timestamp('create_time', { mode: 'string' }).notNull(),
  updateTime: timestamp('update_time', { mode: 'string' }).notNull(),
  version: integer().notNull(),
  config: json().notNull(),
  fileUrl: varchar('file_url').notNull(),
  isActive: boolean('is_active').notNull(),
});

export const sequences = pgTable(
  'sequences',
  {
    id: serial().primaryKey().notNull(),
    englishName: varchar('english_name').notNull(),
    hebrewName: varchar('hebrew_name').notNull(),
    createTime: timestamp('create_time', { mode: 'string' }).notNull(),
    updateTime: timestamp('update_time', { mode: 'string' }).notNull(),
    version: integer().notNull(),
    deepWisdomModelId: integer('deep_wisdom_model_id').notNull(),
    dexterModelIds: integer('dexter_model_ids').array().notNull(),
    isActive: boolean('is_active').notNull(),
  },
  (table) => [
    index('idx_seq_dexter_model_ids').using(
      'gin',
      table.dexterModelIds.asc().nullsLast().op('array_ops'),
    ),
    foreignKey({
      columns: [table.deepWisdomModelId],
      foreignColumns: [deepWisdomModels.id],
      name: 'sequences_deep_wisdom_model_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ],
);

export const detectingModelsObjects = pgTable(
  'detecting_models_objects',
  {
    objectName: varchar('object_name').notNull(),
    modelName: varchar('model_name').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.objectName],
      foreignColumns: [objects.englishName],
      name: 'detecting_models_objects_object_name_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    primaryKey({
      columns: [table.objectName, table.modelName],
      name: 'detecting_models_objects_pkey',
    }),
  ],
);

export const dexterModelsObjects = pgTable(
  'dexter_models_objects',
  {
    objectName: varchar('object_name').notNull(),
    modelName: varchar('model_name').notNull(),
    detectionOrder: integer('detection_order').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.objectName],
      foreignColumns: [objects.englishName],
      name: 'dexter_models_objects_object_name_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    primaryKey({
      columns: [table.objectName, table.modelName],
      name: 'dexter_models_objects_pkey',
    }),
  ],
);

export const deepWisdomModelsObjects = pgTable(
  'deep_wisdom_models_objects',
  {
    objectName: varchar('object_name').notNull(),
    modelName: varchar('model_name').notNull(),
    detectionOrder: integer('detection_order').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.objectName],
      foreignColumns: [objects.englishName],
      name: 'deep_wisdom_models_objects_object_name_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    primaryKey({
      columns: [table.objectName, table.modelName],
      name: 'deep_wisdom_models_objects_pkey',
    }),
  ],
);
export const geographyColumns = pgView('geography_columns', {
  fTableCatalog: unknown('f_table_catalog'),
  // TODO: failed to parse database type 'name'
  fTableSchema: unknown('f_table_schema'),
  // TODO: failed to parse database type 'name'
  fTableName: unknown('f_table_name'),
  // TODO: failed to parse database type 'name'
  fGeographyColumn: unknown('f_geography_column'),
  coordDimension: integer('coord_dimension'),
  srid: integer(),
  type: text(),
}).as(
  sql`SELECT current_database() AS f_table_catalog, n.nspname AS f_table_schema, c.relname AS f_table_name, a.attname AS f_geography_column, postgis_typmod_dims(a.atttypmod) AS coord_dimension, postgis_typmod_srid(a.atttypmod) AS srid, postgis_typmod_type(a.atttypmod) AS type FROM pg_class c, pg_attribute a, pg_type t, pg_namespace n WHERE t.typname = 'geography'::name AND a.attisdropped = false AND a.atttypid = t.oid AND a.attrelid = c.oid AND c.relnamespace = n.oid AND (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'm'::"char", 'f'::"char", 'p'::"char"])) AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text)`,
);

export const geometryColumns = pgView('geometry_columns', {
  fTableCatalog: varchar('f_table_catalog', { length: 256 }),
  // TODO: failed to parse database type 'name'
  fTableSchema: unknown('f_table_schema'),
  // TODO: failed to parse database type 'name'
  fTableName: unknown('f_table_name'),
  // TODO: failed to parse database type 'name'
  fGeometryColumn: unknown('f_geometry_column'),
  coordDimension: integer('coord_dimension'),
  srid: integer(),
  type: varchar({ length: 30 }),
}).as(
  sql`SELECT current_database()::character varying(256) AS f_table_catalog, n.nspname AS f_table_schema, c.relname AS f_table_name, a.attname AS f_geometry_column, COALESCE(postgis_typmod_dims(a.atttypmod), sn.ndims, 2) AS coord_dimension, COALESCE(NULLIF(postgis_typmod_srid(a.atttypmod), 0), sr.srid, 0) AS srid, replace(replace(COALESCE(NULLIF(upper(postgis_typmod_type(a.atttypmod)), 'GEOMETRY'::text), st.type, 'GEOMETRY'::text), 'ZM'::text, ''::text), 'Z'::text, ''::text)::character varying(30) AS type FROM pg_class c JOIN pg_attribute a ON a.attrelid = c.oid AND NOT a.attisdropped JOIN pg_namespace n ON c.relnamespace = n.oid JOIN pg_type t ON a.atttypid = t.oid LEFT JOIN ( SELECT s.connamespace, s.conrelid, s.conkey, replace(split_part(s.consrc, ''''::text, 2), ''''::text, ''::text) AS type FROM ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE s.consrc ~~* '%geometrytype(% = %'::text) st ON st.connamespace = n.oid AND st.conrelid = c.oid AND (a.attnum = ANY (st.conkey)) LEFT JOIN ( SELECT s.connamespace, s.conrelid, s.conkey, replace(split_part(s.consrc, ' = '::text, 2), ')'::text, ''::text)::integer AS ndims FROM ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE s.consrc ~~* '%ndims(% = %'::text) sn ON sn.connamespace = n.oid AND sn.conrelid = c.oid AND (a.attnum = ANY (sn.conkey)) LEFT JOIN ( SELECT s.connamespace, s.conrelid, s.conkey, replace(replace(split_part(s.consrc, ' = '::text, 2), ')'::text, ''::text), '('::text, ''::text)::integer AS srid FROM ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE s.consrc ~~* '%srid(% = %'::text) sr ON sr.connamespace = n.oid AND sr.conrelid = c.oid AND (a.attnum = ANY (sr.conkey)) WHERE (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'm'::"char", 'f'::"char", 'p'::"char"])) AND NOT c.relname = 'raster_columns'::name AND t.typname = 'geometry'::name AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text)`,
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type PermissionRow = typeof permissions.$inferSelect;
export type NewPermissionRow = typeof permissions.$inferInsert;

export type EmbedderModel = typeof embedderModels.$inferSelect;
export type NewEmbedderModel = typeof embedderModels.$inferInsert;

export type DexterModel = typeof dexterModels.$inferSelect;
export type NewDexterModel = typeof dexterModels.$inferInsert;

export type DeepWisdomModel = typeof deepWisdomModels.$inferSelect;
export type NewDeepWisdomModel = typeof deepWisdomModels.$inferInsert;

export type DeepWisdomModelBackup = typeof deepWisdomModelsBackup.$inferSelect;
export type NewDeepWisdomModelBackup =
  typeof deepWisdomModelsBackup.$inferInsert;

export type DetectingModel = typeof detectingModels.$inferSelect;
export type NewDetectingModel = typeof detectingModels.$inferInsert;

export type DetectingModelRule = typeof detectingModelsRules.$inferSelect;
export type NewDetectingModelRule = typeof detectingModelsRules.$inferInsert;

export type DetectingModelObject = typeof detectingModelsObjects.$inferSelect;
export type NewDetectingModelObject =
  typeof detectingModelsObjects.$inferInsert;

export type ObjectCategory = typeof objectCategories.$inferSelect;
export type NewObjectCategory = typeof objectCategories.$inferInsert;

export type ObjectRow = typeof objects.$inferSelect;
export type NewObjectRow = typeof objects.$inferInsert;

export type DexterModelObject = typeof dexterModelsObjects.$inferSelect;
export type NewDexterModelObject = typeof dexterModelsObjects.$inferInsert;

export type DeepWisdomModelObject = typeof deepWisdomModelsObjects.$inferSelect;
export type NewDeepWisdomModelObject =
  typeof deepWisdomModelsObjects.$inferInsert;

export type SequenceModelName = typeof sequenceModelNames.$inferSelect;
export type NewSequenceModelName = typeof sequenceModelNames.$inferInsert;

export type Sequence = typeof sequences.$inferSelect;
export type NewSequence = typeof sequences.$inferInsert;

export type SensingType = typeof sensingTypes.$inferSelect;
export type NewSensingType = typeof sensingTypes.$inferInsert;

export type Sensor = typeof sensors.$inferSelect;
export type NewSensor = typeof sensors.$inferInsert;

export type GeographyArea = typeof geographies.$inferSelect;
export type NewGeographyArea = typeof geographies.$inferInsert;

export type SensorGroup = typeof sensorGroups.$inferSelect;
export type NewSensorGroup = typeof sensorGroups.$inferInsert;

export type Rule = typeof rules.$inferSelect;
export type NewRule = typeof rules.$inferInsert;

export type Sqrule = typeof sqrules.$inferSelect;
export type NewSqrule = typeof sqrules.$inferInsert;

export type SpatialRefSysRow = typeof spatialRefSys.$inferSelect;
export type NewSpatialRefSysRow = typeof spatialRefSys.$inferInsert;
