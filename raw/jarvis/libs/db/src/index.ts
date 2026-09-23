import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  deepWisdomModels,
  deepWisdomModelsBackup,
  deepWisdomModelsObjects,
  detectingModels,
  detectingModelsObjects,
  detectingModelsRules,
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

const schema = {
  users,
  permissions,
  embedderModels,
  dexterModels,
  deepWisdomModels,
  deepWisdomModelsBackup,
  detectingModels,
  detectingModelsRules,
  detectingModelsObjects,
  objectCategories,
  objects,
  dexterModelsObjects,
  deepWisdomModelsObjects,
  sequenceModelNames,
  sequences,
  sensingTypes,
  sensors,
  geographies,
  sensorGroups,
  rules,
  sqrules,
};

export type CreateDbOptions = {
  connectionString: string;
  ssl?: boolean;
  max?: number;
};

export const createDb = ({
  connectionString,
  ssl,
  max = 10,
}: CreateDbOptions) => {
  const client = postgres(connectionString, { max, ssl });
  const db = drizzle(client, { schema });

  return { db, client };
};

export type Db = ReturnType<typeof createDb>['db'];

export * from './schema.js';
