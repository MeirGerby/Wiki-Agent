import {
  deepWisdomModels,
  geographies,
  objectCategories,
  objects,
  permissions,
  rules,
  sensorGroups,
  sqrules,
  users,
} from '@jarvis/db/schema';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

const UserRow = createSelectSchema(users);
const PermissionRow = createSelectSchema(permissions);
const ObjectRow = createSelectSchema(objects);
const CategoryRow = createSelectSchema(objectCategories);
const ModelRow = createSelectSchema(deepWisdomModels);
const SqruleRow = createSelectSchema(sqrules);
const RuleRow = createSelectSchema(rules);
const SensorGroupRow = createSelectSchema(sensorGroups);
const GeographyRow = createSelectSchema(geographies);

export const AppUser = UserRow.pick({
  userId: true,
  fullName: true,
  displayName: true,
  hierarchy: true,
  email: true,
});

export const GetWebConfigOutput = z.object({
  DISABLE_ADFS_AUTH: z.boolean(),
  MAX_ADFS_LOGIN_ATTEMPTS: z.number().int().positive(),
  SENSOR_GROUP_LABELS: z.record(z.string(), z.string()),
  GEOGRAPHY_LABELS: z.record(z.string(), z.string()),
  GEOGRAPHY_LABEL_SINGULAR: z.string(),
  GEOGRAPHY_LABEL_PLURAL: z.string(),
  PINNED_GEOGRAPHY: z.string().optional(),
  RESOLUTION_OPTIONS: z.record(z.string(), z.array(z.number())),
  RESOLUTION_UNIT: z.string().optional().default('ק״מ'),
});

export const OperationalStatus = z.enum(['OPERATIONAL', 'EXPERIMENTAL']);

export const Spec = z.object({
  label: z.string(),
  value: z.string(),
  /** Renders an info affordance next to the label; the design shows one on "חיישן רוורס". */
  hint: z.string().optional(),
  items: z.array(z.string()).readonly().optional(),
  collapsible: z.boolean().optional(),
});

export const ModelPerformance = z.object({
  precision: z.number().nullable(),
  recall: z.number().nullable(),
  recommendedScoreThreshold: z.number().nullable(),
});

export const ModelId = z.string().min(1);

export const Model = z.object({
  id: ModelId,
  englishName: SqruleRow.shape.englishName,
  hebrewName: SqruleRow.shape.hebrewName.nullable(),
  operationalStatus: OperationalStatus.optional(),
  performance: ModelPerformance,
  sensorGroupName: RuleRow.shape.sensorGroup,
  sensors: SensorGroupRow.shape.sensors,
  hasDexter: z.boolean(),
  minResolution: RuleRow.shape.minResolution,
  maxResolution: RuleRow.shape.maxResolution,
  geography: RuleRow.shape.geographyName,
  description: SqruleRow.shape.description,
  depthThreshold: z.number().nullable(),
  dexterThreshold: z.record(z.string(), z.string()).nullable(),
  lastUpdateUser: SqruleRow.shape.lastUpdateUser,
  updateTime: SqruleRow.shape.updateTime,
});

export const CatalogObject = ObjectRow.pick({
  englishName: true,
  hebrewName: true,
  fileUrl: true,
}).extend({
  categoryEnglishName: ObjectRow.shape.categoryName,
  modelCount: z.number().int().nonnegative(),
});

export const Category = CategoryRow.pick({
  englishName: true,
  hebrewName: true,
});

export const Geography = GeographyRow.pick({ name: true });

export const SensorGroup = SensorGroupRow.pick({
  name: true,
  description: true,
});

export const TaggingClass = z.object({
  className: z.string(),
  hebrewName: z.string(),
});

export const OBJECT_ENGLISH_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;
export const MODEL_ENGLISH_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

export const CreateObjectInput = z.object({
  hebrewName: ObjectRow.shape.hebrewName
    .trim()
    .min(1, 'יש להזין שם בעברית')
    .max(255, 'שם בעברית ארוך מדי'),
  englishName: ObjectRow.shape.englishName
    .trim()
    .min(1, 'יש להזין שם באנגלית')
    .max(255, 'שם באנגלית ארוך מדי')
    .regex(
      OBJECT_ENGLISH_NAME_PATTERN,
      'אותיות אנגליות קטנות, ספרות וקו תחתון בלבד, המתחילות באות',
    ),
  categoryEnglishName: CategoryRow.shape.englishName.min(1, 'יש לבחור קטגוריה'),
});

export const CreateObjectRequest: z.ZodType<FormData> = z.instanceof(FormData);

export const CreateObjectConflict = z.enum([
  'english_name_taken',
  'hebrew_name_taken',
]);

export const ObjectFilter = z.object({
  categoryEnglishNames: z.array(CategoryRow.shape.englishName),
  query: z.string(),
  geography: GeographyRow.shape.name.optional(),
});

export const ObjectModelsInput = z.object({
  englishName: ObjectRow.shape.englishName,
  query: z.string(),
});

export const ObjectModels = z.array(Model);

export const TrainingStatus = z.enum(['NOT_STARTED', 'RUNNING', 'ERROR']);

export const TrainingModel = z.object({
  missionId: z.string(),
  englishName: z.string(),
  hebrewName: z.string(),
  creator: z.string(),
  createdAt: z.string(),
  status: TrainingStatus,
});

export const GetTrainingModelsInput = z.object({
  objectEnglishName: ObjectRow.shape.englishName,
  query: z.string(),
});

export const TrainingModels = z.array(TrainingModel);

export const AbortTrainingInput = z.object({
  missionId: z.string().min(1),
});

export const RetryTrainingInput = AbortTrainingInput;

export const MODEL_RESOLUTION_MIN = 0;
export const MODEL_RESOLUTION_MAX = 4096;

const ModelResolutionValue = RuleRow.shape.minResolution
  .unwrap()
  .min(MODEL_RESOLUTION_MIN)
  .max(MODEL_RESOLUTION_MAX);

export const CreateModelInput = z
  .object({
    objectEnglishName: ObjectRow.shape.englishName,
    hebrewName: SqruleRow.shape.hebrewName
      .trim()
      .min(1, 'יש להזין שם בעברית')
      .max(255, 'שם בעברית ארוך מדי'),
    englishName: ModelRow.shape.modelName
      .trim()
      .min(1, 'יש להזין שם באנגלית')
      .max(255, 'שם באנגלית ארוך מדי')
      .regex(
        MODEL_ENGLISH_NAME_PATTERN,
        'אותיות אנגליות קטנות, ספרות וקו תחתון בלבד, המתחילות באות',
      ),
    description: SqruleRow.shape.description
      .unwrap()
      .trim()
      .max(1000, 'התיאור ארוך מדי')
      .optional(),
    sensorGroupName: SensorGroupRow.shape.name.optional(),
    minResolution: ModelResolutionValue.optional(),
    maxResolution: ModelResolutionValue.optional(),
    geographyName: GeographyRow.shape.name.optional(),
    positiveTaggingClassNames: z.array(z.string()),
    emptyFieldsClassNames: z.array(z.string()),
  })
  .refine(
    (input) =>
      input.minResolution === undefined ||
      input.maxResolution === undefined ||
      input.minResolution <= input.maxResolution,
    {
      path: ['maxResolution'],
      message: 'הרזולוציה המקסימלית חייבת להיות גדולה או שווה למינימלית',
    },
  );

const ScoreRatio = z
  .number()
  .min(0, 'הערך חייב להיות בין 0 ל-1')
  .max(1, 'הערך חייב להיות בין 0 ל-1');

export const UpdateModelPerformance = z.object({
  precision: ScoreRatio.optional(),
  recall: ScoreRatio.optional(),
  recommendedScoreThreshold: ScoreRatio.optional(),
});

export const UpdateModelInput = z.object({
  id: ModelId,
  hebrewName: SqruleRow.shape.hebrewName
    .trim()
    .min(1, 'יש להזין שם בעברית')
    .max(255, 'שם בעברית ארוך מדי')
    .optional(),
  performance: UpdateModelPerformance.optional(),
});

export const CloneModelInput = z
  .object({
    sourceId: ModelId,
    hebrewName: SqruleRow.shape.hebrewName
      .trim()
      .min(1, 'יש להזין שם בעברית')
      .max(255, 'שם בעברית ארוך מדי'),
    englishName: ModelRow.shape.modelName
      .trim()
      .min(1, 'יש להזין שם באנגלית')
      .max(255, 'שם באנגלית ארוך מדי')
      .regex(
        MODEL_ENGLISH_NAME_PATTERN,
        'אותיות אנגליות קטנות, ספרות וקו תחתון בלבד, המתחילות באות',
      ),
    sensorGroupName: SensorGroupRow.shape.name.optional(),
    minResolution: ModelResolutionValue.optional(),
    maxResolution: ModelResolutionValue.optional(),
    geographyName: GeographyRow.shape.name.optional(),
  })
  .refine(
    (input) =>
      input.minResolution === undefined ||
      input.maxResolution === undefined ||
      input.minResolution <= input.maxResolution,
    {
      path: ['maxResolution'],
      message: 'הרזולוציה המקסימלית חייבת להיות גדולה או שווה למינימלית',
    },
  );

const ModelIdOutput = z.object({ id: ModelId });

export const UpdateModelOutput = ModelIdOutput;
export const CloneModelOutput = ModelIdOutput;
export const CreateModelOutput = z.void();

export const Role = z.enum(['guest', 'viewer', 'admin', 'superadmin']);

export const ROLE_ORDER: readonly Role[] = Role.options;

export const DEFAULT_ROLE: Role = 'guest';

export function roleRank(role: Role): number {
  return ROLE_ORDER.indexOf(role);
}

export function isRoleAtLeast(role: Role, minimum: Role): boolean {
  return roleRank(role) >= roleRank(minimum);
}

export function isRoleAbove(role: Role, other: Role): boolean {
  return roleRank(role) > roleRank(other);
}

export const SessionUser = AppUser.extend({
  id: UserRow.shape.id,
  role: Role,
});

export const SigninOutput = z.object({
  user: SessionUser,
  isNewUser: z.boolean(),
  wasUpdated: z.boolean(),
});

export const PermissionSubjectType = z.enum(['user', 'hierarchy']);

export const HIERARCHY_PATH_SEPARATOR = '/';

const hierarchyPathPattern = /^[^/]+(?:\/[^/]+)*$/;

export function isHierarchyPath(value: string): boolean {
  return value === value.trim() && hierarchyPathPattern.test(value);
}

export function hierarchyPathPrefixes(path: string): string[] {
  if (!isHierarchyPath(path)) return [];

  const segments = path.split(HIERARCHY_PATH_SEPARATOR);

  return segments.map((_, index) =>
    segments.slice(0, index + 1).join(HIERARCHY_PATH_SEPARATOR),
  );
}

export const PermissionSubject = z.object({
  subjectType: PermissionSubjectType,
  subject: PermissionRow.shape.subject.min(1, 'Subject is required'),
});

export const Permission = PermissionSubject.extend({ role: Role });

export const SetPermissionInput = Permission;

export const RemovePermissionInput = PermissionSubject;

export type AppUser = z.infer<typeof AppUser>;
export type GetWebConfigOutput = z.infer<typeof GetWebConfigOutput>;
export type OperationalStatus = z.infer<typeof OperationalStatus>;
export type Spec = z.infer<typeof Spec>;
export type ModelPerformance = z.infer<typeof ModelPerformance>;
export type Model = z.infer<typeof Model>;
export type CatalogObject = z.infer<typeof CatalogObject>;
export type Category = z.infer<typeof Category>;
export type Geography = z.infer<typeof Geography>;
export type SensorGroup = z.infer<typeof SensorGroup>;
export type TaggingClass = z.infer<typeof TaggingClass>;
export type CreateObjectInput = z.infer<typeof CreateObjectInput>;
export type CreateObjectConflict = z.infer<typeof CreateObjectConflict>;
export type ObjectFilter = z.infer<typeof ObjectFilter>;
export type ObjectModelsInput = z.infer<typeof ObjectModelsInput>;
export type ObjectModels = z.infer<typeof ObjectModels>;
export type TrainingStatus = z.infer<typeof TrainingStatus>;
export type TrainingModel = z.infer<typeof TrainingModel>;
export type GetTrainingModelsInput = z.infer<typeof GetTrainingModelsInput>;
export type TrainingModels = z.infer<typeof TrainingModels>;
export type AbortTrainingInput = z.infer<typeof AbortTrainingInput>;
export type RetryTrainingInput = z.infer<typeof RetryTrainingInput>;
export type CreateModelInput = z.infer<typeof CreateModelInput>;
export type UpdateModelPerformance = z.infer<typeof UpdateModelPerformance>;
export type UpdateModelInput = z.infer<typeof UpdateModelInput>;
export type CloneModelInput = z.infer<typeof CloneModelInput>;
export type UpdateModelOutput = z.infer<typeof UpdateModelOutput>;
export type CloneModelOutput = z.infer<typeof CloneModelOutput>;
export type CreateModelOutput = z.infer<typeof CreateModelOutput>;
export type Role = z.infer<typeof Role>;
export type SessionUser = z.infer<typeof SessionUser>;
export type SigninOutput = z.infer<typeof SigninOutput>;
export type PermissionSubjectType = z.infer<typeof PermissionSubjectType>;
export type PermissionSubject = z.infer<typeof PermissionSubject>;
export type Permission = z.infer<typeof Permission>;
export type SetPermissionInput = z.infer<typeof SetPermissionInput>;
export type RemovePermissionInput = z.infer<typeof RemovePermissionInput>;
