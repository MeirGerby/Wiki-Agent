/**
 * UI-only constants for the models page — labels, menus and layout defaults that no
 * server should dictate. Entity data (areas, categories, objects, models) comes from
 * @jarvis/model-catalog-bff over tRPC; see ../trpc.ts and ../routes/index.tsx.
 */

import type {
  Model,
  Spec,
  TrainingModel,
} from '@jarvis/model-catalog-contract';

export const MODEL_DETAIL_LABELS = {
  englishName: 'שם באנגלית',
  description: 'תיאור',
  sensorGroup: 'קבוצת סנסורים',
  resolution: 'רזולוציה',
  recommendedScoreThreshold: 'ציון מומלץ לאיתורים',
  precision: 'Precision',
  recall: 'Recall',
  depthThreshold: 'סף עומק',
  dexterThreshold: 'סף דקסטר',
  lastUpdateUser: 'עורך אחרון',
  updateTime: 'תאריך עדכון אחרון',
} as const;

export type ModelDetailKey = keyof typeof MODEL_DETAIL_LABELS | 'geography';

export const TRAINING_MODEL_LABELS = {
  englishName: MODEL_DETAIL_LABELS.englishName,
  createdAt: 'תאריך יצירה',
  creator: 'יוצר',
} as const;

export const TRAINING_MODEL_MESSAGES = {
  cancelTooltip: 'בטל אימון',
  cancelTitle: 'ביטול אימון',
  cancelBody: 'הפעולה אינה ניתנת לביטול.',
  cancelConfirm: 'בטל אימון',
  cancelPending: 'מבטל…',
  cancelSucceeded: 'האימון בוטל',
  retryTooltip: 'נסה שוב',
  retrySucceeded: 'האימון הופעל מחדש',
} as const;

export type ModelDetailSpec = Spec & { key: ModelDetailKey };

export type TrainingModelDetailKey = keyof typeof TRAINING_MODEL_LABELS;
export type TrainingModelDetailSpec = Spec & { key: TrainingModelDetailKey };

export const EMPTY_DETAIL_VALUE = '—';

export const MODEL_ACTION_LABELS = {
  duplicate: 'שכפל',
} as const;

export const MODEL_EDIT_MESSAGES = {
  saveFailed: 'השמירה נכשלה. נסה שוב.',
  numberRange: 'הערך חייב להיות בין 0 ל-1',
  notANumber: 'יש להזין מספר',
} as const;

export const SCORE_STEP = 0.01;

export const MODEL_CREATE_LABELS = {
  title: 'יצירת מודל חדש',
  objectName: 'שם אובייקט',
  hebrewName: 'שם בעברית',
  englishName: 'שם באנגלית',
  description: 'תיאור',
  modelDetailsSection: 'פרטי המודל',
  sensorGroup: 'סוג צילום',
  resolution: 'רזולוציה',
  taggingClassSection: 'מחלקת תיוגים',
  positiveTaggingClasses: 'תיוגים חיוביים',
  emptyFields: 'שטחים ריקים',
  submit: 'צור',
  cancel: 'בטל',
} as const;

export const MODEL_CREATE_PLACEHOLDERS = {
  hebrewName: 'הזן שם בעברית',
  englishName: 'הזן שם באנגלית',
  description: 'תאר בקצרה את המודל המבוקש',
  sensorGroup: 'בחר סוג',
  positiveTaggingClasses: 'בחר מחלקת תיוג',
  emptyFields: 'בחר מחלקות שטחים ריקים',
  taggingClassSearch: 'חיפוש...',
} as const;

export const MODEL_CREATE_MESSAGES = {
  hebrewNameRequired: 'יש להזין שם בעברית',
  englishNameRequired: 'יש להזין שם באנגלית',
  englishNamePattern:
    'אותיות אנגליות קטנות, ספרות וקו תחתון בלבד, המתחילות באות',
  taggingClassesFailed: 'טעינת מחלקות התיוג נכשלה.',
  taggingClassesNoResults: 'לא נמצאו תוצאות תואמות לחיפוש.',
  createSucceeded: 'בקשת יצירת המודל נשלחה',
} as const;

/** The hover hint on the English-name field states the same rule the schema rejects on. */
export const MODEL_ENGLISH_NAME_HINT = MODEL_CREATE_MESSAGES.englishNamePattern;

export const MODEL_CLONE_LABELS = {
  title: 'שכפול מודל',
  submit: 'שכפל',
  cancel: MODEL_CREATE_LABELS.cancel,
} as const;

/** How many spec rows a collapsed model card shows, per the design. */
export const COLLAPSED_SPEC_COUNT = 4;

function resolutionRangeLabel(
  minResolution: number | null,
  maxResolution: number | null,
  resolutionUnit: string,
): string {
  if (minResolution === null && maxResolution === null) {
    return EMPTY_DETAIL_VALUE;
  }

  return `מ ${minResolution ?? EMPTY_DETAIL_VALUE} עד ${maxResolution ?? EMPTY_DETAIL_VALUE} ${resolutionUnit}`;
}

const TIMESTAMP_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/;

export function formatTimestamp(timestamp: string): string {
  const match = TIMESTAMP_PATTERN.exec(timestamp);
  if (match === null) return timestamp;

  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

function valueOrEmpty(value: string | number | null): string {
  return value === null || value === '' ? EMPTY_DETAIL_VALUE : String(value);
}

function dexterThresholdValue(
  threshold: Model['dexterThreshold'],
): Pick<ModelDetailSpec, 'value' | 'items'> {
  const entries = Object.entries(threshold ?? {});

  if (entries.length === 0) return { value: EMPTY_DETAIL_VALUE };

  return {
    value: '',
    items: entries.map(([key, value]) => `${key}: ${value}`),
  };
}

export function modelDetailSpecs(
  model: Model,
  labels: {
    geographyLabel: string;
    geographyLabels: Record<string, string>;
    sensorGroupLabels: Record<string, string>;
  },
  resolutionUnit: string,
): readonly ModelDetailSpec[] {
  const specs: ModelDetailSpec[] = [
    {
      key: 'englishName',
      label: MODEL_DETAIL_LABELS.englishName,
      value: model.englishName,
    },
    {
      key: 'geography',
      label: labels.geographyLabel,
      value: model.geography
        ? (labels.geographyLabels[model.geography] ?? model.geography)
        : EMPTY_DETAIL_VALUE,
    },
    {
      key: 'description',
      label: MODEL_DETAIL_LABELS.description,
      value: valueOrEmpty(model.description),
    },
    {
      key: 'sensorGroup',
      label: MODEL_DETAIL_LABELS.sensorGroup,
      value: model.sensorGroupName
        ? (labels.sensorGroupLabels[model.sensorGroupName] ??
          model.sensorGroupName)
        : EMPTY_DETAIL_VALUE,
      items: model.sensors.length > 0 ? model.sensors : undefined,
      collapsible: true,
    },
    {
      key: 'resolution',
      label: MODEL_DETAIL_LABELS.resolution,
      value: resolutionRangeLabel(
        model.minResolution,
        model.maxResolution,
        resolutionUnit,
      ),
    },
    {
      key: 'recommendedScoreThreshold',
      label: MODEL_DETAIL_LABELS.recommendedScoreThreshold,
      value: valueOrEmpty(model.performance.recommendedScoreThreshold),
    },
    {
      key: 'precision',
      label: MODEL_DETAIL_LABELS.precision,
      value: valueOrEmpty(model.performance.precision),
    },
    {
      key: 'recall',
      label: MODEL_DETAIL_LABELS.recall,
      value: valueOrEmpty(model.performance.recall),
    },
    {
      key: 'depthThreshold',
      label: MODEL_DETAIL_LABELS.depthThreshold,
      value: valueOrEmpty(model.depthThreshold),
    },
  ];

  if (model.hasDexter) {
    specs.push({
      key: 'dexterThreshold',
      label: MODEL_DETAIL_LABELS.dexterThreshold,
      ...dexterThresholdValue(model.dexterThreshold),
    });
  }

  specs.push(
    {
      key: 'lastUpdateUser',
      label: MODEL_DETAIL_LABELS.lastUpdateUser,
      value: valueOrEmpty(model.lastUpdateUser),
    },
    {
      key: 'updateTime',
      label: MODEL_DETAIL_LABELS.updateTime,
      value: formatTimestamp(model.updateTime),
    },
  );

  return specs;
}

export function trainingModelSpecs(
  trainingModel: TrainingModel,
): readonly TrainingModelDetailSpec[] {
  return [
    {
      key: 'englishName',
      label: TRAINING_MODEL_LABELS.englishName,
      value: trainingModel.englishName,
    },
    {
      key: 'createdAt',
      label: TRAINING_MODEL_LABELS.createdAt,
      value: formatTimestamp(trainingModel.createdAt),
    },
    {
      key: 'creator',
      label: TRAINING_MODEL_LABELS.creator,
      value: trainingModel.creator,
    },
  ];
}
