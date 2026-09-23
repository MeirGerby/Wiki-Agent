import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { createDb, type Db } from './index.js';
import {
  deepWisdomModels,
  deepWisdomModelsObjects,
  dexterModels,
  dexterModelsObjects,
  embedderModels,
  geographies,
  objectCategories,
  objects,
  permissions,
  rules,
  sensingTypes,
  sensorGroups,
  sensors,
  sequenceModelNames,
  sequences,
  sqrules,
  users,
} from './schema.js';
import {
  SEED_CATEGORIES,
  SEED_CREATE_USER,
  SEED_EMBEDDER,
  SEED_GEOGRAPHY,
  SEED_OBJECTS,
  SEED_PERMISSIONS,
  SEED_RULES,
  SEED_SENSING_TYPES,
  SEED_SENSOR_GROUPS,
  SEED_SENSORS,
  SEED_USERS,
  sqruleConfig,
} from './seed-data.js';

config({
  path: fileURLToPath(
    new URL('../../../apps/model-catalog/bff/.env', import.meta.url),
  ),
});

const now = () => new Date().toISOString();

const stamps = () => ({ createTime: now(), updateTime: now() });

const seedUsers = async (db: Db) => {
  const inserted = await db
    .insert(users)
    .values([...SEED_USERS])
    .onConflictDoNothing({ target: users.userId })
    .returning({ userId: users.userId });

  return inserted.length;
};

const seedPermissions = async (db: Db) => {
  const inserted = await db
    .insert(permissions)
    .values([...SEED_PERMISSIONS])
    .onConflictDoNothing({
      target: [permissions.subjectType, permissions.subject],
    })
    .returning({ id: permissions.id });

  return inserted.length;
};

const seedCategories = async (db: Db) => {
  const inserted = await db
    .insert(objectCategories)
    .values([...SEED_CATEGORIES])
    .onConflictDoNothing({ target: objectCategories.englishName })
    .returning({ englishName: objectCategories.englishName });

  return inserted.length;
};

const seedEmbedder = async (db: Db) => {
  const [existing] = await db
    .select({ id: embedderModels.id })
    .from(embedderModels)
    .where(eq(embedderModels.modelName, SEED_EMBEDDER.modelName))
    .limit(1);

  if (existing) {
    return { id: existing.id, added: 0 };
  }

  const [created] = await db
    .insert(embedderModels)
    .values({ ...SEED_EMBEDDER, ...stamps() })
    .returning({ id: embedderModels.id });

  if (!created) {
    throw new Error('seed: the embedder model was not created');
  }

  return { id: created.id, added: 1 };
};

const seedObjects = async (db: Db) => {
  const inserted = await db
    .insert(objects)
    .values(
      SEED_OBJECTS.map((object) => ({
        englishName: object.englishName,
        hebrewName: object.hebrewName,
        categoryName: object.categoryName,
        isActive: object.isActive,
        createUser: SEED_CREATE_USER,
        fileUrl: `s3://jarvis-objects/${object.englishName}/reference.zip`,
        ...stamps(),
      })),
    )
    .onConflictDoNothing({ target: objects.englishName })
    .returning({ englishName: objects.englishName });

  return inserted.length;
};

const seedModels = async (db: Db, embedderId: number) => {
  const inserted = await db
    .insert(dexterModels)
    .values(
      SEED_OBJECTS.flatMap((object) =>
        object.models.map((model) => ({
          modelName: model.modelName,
          config: model.config,
          version: model.version,
          isActive: model.isActive,
          fileUrl: `s3://jarvis-models/dexter/${model.modelName}/v${model.version}.onnx`,
          embedderId,
          ...stamps(),
        })),
      ),
    )
    .onConflictDoNothing()
    .returning({ modelName: dexterModels.modelName });

  return inserted.length;
};

const seedDeepWisdomModels = async (db: Db) => {
  const inserted = await db
    .insert(deepWisdomModels)
    .values(
      SEED_OBJECTS.flatMap((object) =>
        object.deepWisdomModels.map((model) => ({
          modelName: model.modelName,
          config: model.config,
          version: model.version,
          isActive: model.isActive,
          fileUrl: `s3://jarvis-models/deep-wisdom/${model.modelName}/v${model.version}.onnx`,
          ...stamps(),
        })),
      ),
    )
    .onConflictDoNothing()
    .returning({ modelName: deepWisdomModels.modelName });

  return inserted.length;
};

const seedDeepWisdomLinks = async (db: Db) => {
  const inserted = await db
    .insert(deepWisdomModelsObjects)
    .values(
      SEED_OBJECTS.flatMap((object) =>
        object.deepWisdomModels.map((model, index) => ({
          objectName: object.englishName,
          modelName: model.modelName,
          detectionOrder: index + 1,
        })),
      ),
    )
    .onConflictDoNothing()
    .returning({ objectName: deepWisdomModelsObjects.objectName });

  return inserted.length;
};

const seedModelLinks = async (db: Db) => {
  const inserted = await db
    .insert(dexterModelsObjects)
    .values(
      SEED_OBJECTS.flatMap((object) =>
        object.models.map((model, index) => ({
          objectName: object.englishName,
          modelName: model.modelName,
          detectionOrder: index + 1,
        })),
      ),
    )
    .onConflictDoNothing()
    .returning({ objectName: dexterModelsObjects.objectName });

  return inserted.length;
};

const seedReferenceData = async (db: Db) => {
  await db
    .insert(sensingTypes)
    .values([...SEED_SENSING_TYPES])
    .onConflictDoNothing({ target: sensingTypes.name });
  await db
    .insert(sensors)
    .values([...SEED_SENSORS])
    .onConflictDoNothing({ target: sensors.name });
  await db
    .insert(geographies)
    .values([...SEED_GEOGRAPHY])
    .onConflictDoNothing({ target: geographies.name });
  await db
    .insert(sensorGroups)
    .values([...SEED_SENSOR_GROUPS])
    .onConflictDoNothing({ target: sensorGroups.name });

  const inserted = await db
    .insert(rules)
    .values([...SEED_RULES])
    .onConflictDoNothing({ target: rules.name })
    .returning({ name: rules.name });

  return inserted.length;
};

const seedSequences = async (db: Db) => {
  const wisdomRows = await db
    .select({ id: deepWisdomModels.id, modelName: deepWisdomModels.modelName })
    .from(deepWisdomModels);
  const dexterRows = await db
    .select({ id: dexterModels.id, modelName: dexterModels.modelName })
    .from(dexterModels);

  const wisdomIdOf = new Map(wisdomRows.map((row) => [row.modelName, row.id]));
  const dexterIdOf = new Map(dexterRows.map((row) => [row.modelName, row.id]));

  const existingSequenceNames = new Set(
    (
      await db.select({ englishName: sequences.englishName }).from(sequences)
    ).map((row) => row.englishName),
  );

  const planned = SEED_OBJECTS.flatMap((object) =>
    object.deepWisdomModels.map((model) => ({
      model,
      object,
      wisdomId: wisdomIdOf.get(model.modelName),
    })),
  ).filter(
    (entry): entry is typeof entry & { wisdomId: number } =>
      entry.wisdomId !== undefined &&
      !existingSequenceNames.has(`${entry.model.modelName}_sequence`),
  );

  if (planned.length === 0) {
    return { sequences: 0, sqrules: 0 };
  }

  const insertedSequences = await db
    .insert(sequences)
    .values(
      planned.map(({ model, object, wisdomId }) => ({
        englishName: `${model.modelName}_sequence`,
        hebrewName: `רצף ${object.hebrewName} v${model.version}`,
        version: model.version,
        isActive: model.isActive,
        deepWisdomModelId: wisdomId,
        dexterModelIds: model.dexterModelNames
          .map((name) => dexterIdOf.get(name))
          .filter((id): id is number => id !== undefined),
        ...stamps(),
      })),
    )
    .onConflictDoNothing()
    .returning({ id: sequences.id, englishName: sequences.englishName });

  await db
    .insert(sequenceModelNames)
    .values(
      planned.map(({ model }) => ({
        sequenceName: `${model.modelName}_sequence`,
        deepWisdomModelName: model.modelName,
        dexterModelNames: [...model.dexterModelNames],
      })),
    )
    .onConflictDoNothing({ target: sequenceModelNames.sequenceName });

  const sequenceIdOf = new Map(
    insertedSequences.map((row) => [row.englishName, row.id]),
  );

  const sqruleValues = planned
    .map(({ model, object }) => ({
      englishName: `${model.modelName}_sqrule`,
      hebrewName: `כלל ${object.hebrewName} v${model.version}`,
      ruleName: model.ruleName,
      sequenceId: sequenceIdOf.get(`${model.modelName}_sequence`),
      config: sqruleConfig(model.config),
      performanceRate: {},
      operationalStatus: model.isActive ? 'OPERATIONAL' : 'EXPERIMENTAL',
      version: model.version,
      isActive: model.isActive,
      ...stamps(),
    }))
    .filter(
      (row): row is typeof row & { sequenceId: number } =>
        row.sequenceId !== undefined,
    );

  const insertedSqrules = sqruleValues.length
    ? await db
        .insert(sqrules)
        .values(sqruleValues)
        .onConflictDoNothing()
        .returning({ id: sqrules.id })
    : [];

  return {
    sequences: insertedSequences.length,
    sqrules: insertedSqrules.length,
  };
};

const resetModelTables = async (db: Db) => {
  await db.delete(sqrules);
  await db.delete(sequences);
  await db.delete(sequenceModelNames);
  await db.delete(deepWisdomModelsObjects);
  await db.delete(dexterModelsObjects);
  await db.delete(deepWisdomModels);
  await db.delete(dexterModels);
  await db.delete(embedderModels);
  await db.delete(rules);
  await db.delete(sensorGroups);
  await db.delete(sensingTypes);
  await db.delete(sensors);
  await db.delete(geographies);
  await db.delete(objects);
  await db.delete(objectCategories);
  await db.delete(permissions);
  await db.delete(users);
};

const reset = process.argv.includes('--reset');

const connectionString =
  process.env['DATABASE_URL_UNPOOLED'] ?? process.env['DATABASE_URL'];

if (!connectionString) {
  console.error(
    'seed: no DATABASE_URL_UNPOOLED and no DATABASE_URL. Set one in apps/model-catalog/bff/.env, or export it.',
  );
  process.exit(1);
}

const { db, client } = createDb({
  connectionString,
  ssl: process.env['DATABASE_SSL'] === 'true',
  max: 1,
});

try {
  if (reset) {
    await resetModelTables(db);
    console.log('seed: --reset emptied every table the seed owns, so the rows');
    console.log('seed: below replace what was in the database before');
  }

  const addedUsers = await seedUsers(db);
  const addedPermissions = await seedPermissions(db);
  const addedCategories = await seedCategories(db);
  const embedder = await seedEmbedder(db);
  const addedObjects = await seedObjects(db);
  const addedModels = await seedModels(db, embedder.id);
  const addedLinks = await seedModelLinks(db);
  const addedWisdomModels = await seedDeepWisdomModels(db);
  const addedWisdomLinks = await seedDeepWisdomLinks(db);
  const addedRules = await seedReferenceData(db);
  const addedSequences = await seedSequences(db);

  const wisdomTotal = SEED_OBJECTS.reduce(
    (total, object) => total + object.deepWisdomModels.length,
    0,
  );

  console.log(
    reset
      ? 'seed: rows added (the seeded tables were emptied first)'
      : 'seed: rows added (rows that were already there are kept)',
  );
  console.log(`  users              ${addedUsers}/${SEED_USERS.length}`);
  console.log(
    `  permissions        ${addedPermissions}/${SEED_PERMISSIONS.length}`,
  );
  console.log(
    `  object categories  ${addedCategories}/${SEED_CATEGORIES.length}`,
  );
  console.log(`  embedder models    ${embedder.added}/1`);
  console.log(`  objects            ${addedObjects}/${SEED_OBJECTS.length}`);
  console.log(`  dexter models      ${addedModels}/${SEED_OBJECTS.length * 4}`);
  console.log(`  object-model links ${addedLinks}/${SEED_OBJECTS.length * 4}`);
  console.log(`  deep wisdom models ${addedWisdomModels}/${wisdomTotal}`);
  console.log(`  rules              ${addedRules}/${SEED_RULES.length}`);
  console.log(
    `  sequences          ${addedSequences.sequences}/${wisdomTotal}`,
  );
  console.log(`  sqrules            ${addedSequences.sqrules}/${wisdomTotal}`);
  console.log(`  deep wisdom links  ${addedWisdomLinks}/${wisdomTotal}`);
} finally {
  await client.end();
}
