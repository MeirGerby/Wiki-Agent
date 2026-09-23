import { relations } from 'drizzle-orm/relations';
import {
  detectingModels,
  detectingModelsRules,
  rules,
  sqrules,
  sequences,
  objectCategories,
  objects,
  geographies,
  sensingTypes,
  sensorGroups,
  dexterModels,
  embedderModels,
  deepWisdomModels,
  detectingModelsObjects,
  dexterModelsObjects,
  deepWisdomModelsObjects,
} from './schema.js';

export const detectingModelsRulesRelations = relations(
  detectingModelsRules,
  ({ one }) => ({
    detectingModel: one(detectingModels, {
      fields: [detectingModelsRules.modelId],
      references: [detectingModels.id],
    }),
    rule: one(rules, {
      fields: [detectingModelsRules.ruleName],
      references: [rules.name],
    }),
  }),
);

export const detectingModelsRelations = relations(
  detectingModels,
  ({ many }) => ({
    detectingModelsRules: many(detectingModelsRules),
  }),
);

export const rulesRelations = relations(rules, ({ one, many }) => ({
  detectingModelsRules: many(detectingModelsRules),
  sqrules: many(sqrules),
  geography: one(geographies, {
    fields: [rules.geographyName],
    references: [geographies.name],
  }),
  sensingType: one(sensingTypes, {
    fields: [rules.sensingType],
    references: [sensingTypes.name],
  }),
  sensorGroup: one(sensorGroups, {
    fields: [rules.sensorGroup],
    references: [sensorGroups.name],
  }),
}));

export const sqrulesRelations = relations(sqrules, ({ one }) => ({
  rule: one(rules, {
    fields: [sqrules.ruleName],
    references: [rules.name],
  }),
  sequence: one(sequences, {
    fields: [sqrules.sequenceId],
    references: [sequences.id],
  }),
}));

export const sequencesRelations = relations(sequences, ({ one, many }) => ({
  sqrules: many(sqrules),
  deepWisdomModel: one(deepWisdomModels, {
    fields: [sequences.deepWisdomModelId],
    references: [deepWisdomModels.id],
  }),
}));

export const objectsRelations = relations(objects, ({ one, many }) => ({
  objectCategory: one(objectCategories, {
    fields: [objects.categoryName],
    references: [objectCategories.englishName],
  }),
  detectingModelsObjects: many(detectingModelsObjects),
  dexterModelsObjects: many(dexterModelsObjects),
  deepWisdomModelsObjects: many(deepWisdomModelsObjects),
}));

export const objectCategoriesRelations = relations(
  objectCategories,
  ({ many }) => ({
    objects: many(objects),
  }),
);

export const geographiesRelations = relations(geographies, ({ many }) => ({
  rules: many(rules),
}));

export const sensingTypesRelations = relations(sensingTypes, ({ many }) => ({
  rules: many(rules),
}));

export const sensorGroupsRelations = relations(sensorGroups, ({ many }) => ({
  rules: many(rules),
}));

export const dexterModelsRelations = relations(dexterModels, ({ one }) => ({
  embedderModel: one(embedderModels, {
    fields: [dexterModels.embedderId],
    references: [embedderModels.id],
  }),
}));

export const embedderModelsRelations = relations(
  embedderModels,
  ({ many }) => ({
    dexterModels: many(dexterModels),
  }),
);

export const deepWisdomModelsRelations = relations(
  deepWisdomModels,
  ({ many }) => ({
    sequences: many(sequences),
  }),
);

export const detectingModelsObjectsRelations = relations(
  detectingModelsObjects,
  ({ one }) => ({
    object: one(objects, {
      fields: [detectingModelsObjects.objectName],
      references: [objects.englishName],
    }),
  }),
);

export const dexterModelsObjectsRelations = relations(
  dexterModelsObjects,
  ({ one }) => ({
    object: one(objects, {
      fields: [dexterModelsObjects.objectName],
      references: [objects.englishName],
    }),
  }),
);

export const deepWisdomModelsObjectsRelations = relations(
  deepWisdomModelsObjects,
  ({ one }) => ({
    object: one(objects, {
      fields: [deepWisdomModelsObjects.objectName],
      references: [objects.englishName],
    }),
  }),
);
