import type {
  NewEmbedderModel,
  NewGeographyArea,
  NewObjectCategory,
  NewPermissionRow,
  NewRule,
  NewSensingType,
  NewSensor,
  NewSensorGroup,
  NewUser,
} from './schema.js';

export const SEED_USERS: readonly NewUser[] = [
  {
    userId: 'example@example.com',
    email: 'test@test.com',
    displayName: 'yonatan',
    fullName: 'some random name',
    hierarchy: 'jarvis/123',
  },
  {
    userId: 'dana.cohen@example.com',
    email: 'dana.cohen@example.com',
    displayName: 'dana',
    fullName: 'דנה כהן',
    hierarchy: 'jarvis/412',
  },
  {
    userId: 'amit.levi@example.com',
    email: 'amit.levi@example.com',
    displayName: 'amit',
    fullName: 'עמית לוי',
    hierarchy: 'jarvis/531',
  },
  {
    userId: 'noa.mizrahi@example.com',
    email: 'noa.mizrahi@example.com',
    displayName: 'noa',
    fullName: 'נועה מזרחי',
    hierarchy: 'jarvis/531',
  },
  {
    userId: 'itai.barak@example.com',
    email: 'itai.barak@example.com',
    displayName: 'itai',
    fullName: 'איתי ברק',
    hierarchy: 'jarvis/824',
  },
  {
    userId: 'shira.golan@example.com',
    email: 'shira.golan@example.com',
    displayName: 'shira',
    fullName: 'שירה גולן',
    hierarchy: 'jarvis/824',
  },
];

export const SEED_CREATE_USER = 'example@example.com';

export const SEED_PERMISSIONS: readonly NewPermissionRow[] = [
  { subjectType: 'hierarchy', subject: 'jarvis', role: 'viewer' },
  { subjectType: 'user', subject: SEED_CREATE_USER, role: 'superadmin' },
];

export const SEED_EMBEDDER: Omit<
  NewEmbedderModel,
  'createTime' | 'updateTime'
> = {
  modelName: 'jarvis_embedder_base',
  version: 1,
  fileUrl: 's3://jarvis-models/embedders/jarvis_embedder_base/v1.onnx',
  isActive: true,
};

export const SEED_CATEGORIES: readonly NewObjectCategory[] = [
  {
    englishName: 'general_equipment',
    hebrewName: 'ציוד כללי',
    description: 'ציוד כללי שאינו משויך לקטגוריה ייעודית',
  },
  {
    englishName: 'hand_tools',
    hebrewName: 'כלי עבודה',
    description: 'כלי עבודה ידניים וחשמליים',
  },
  {
    englishName: 'electronics',
    hebrewName: 'אלקטרוניקה',
    description: 'ציוד אלקטרוני, חיישנים ומצלמות',
  },
  {
    englishName: 'furniture',
    hebrewName: 'ריהוט',
    description: 'ריהוט למשרד ולשטח',
  },
  {
    englishName: 'kitchen',
    hebrewName: 'מטבח',
    description: 'ציוד מטבח והסעדה',
  },
];

export const SEED_SENSING_TYPES: readonly NewSensingType[] = [
  { name: 'violet' },
  { name: 'copper' },
  { name: 'willow' },
];

export const SEED_SENSORS: readonly NewSensor[] = [
  { name: 'violet_cam' },
  { name: 'copper_cam' },
  { name: 'willow_cam' },
  { name: 'wide_angle_cam' },
  { name: 'zoom_cam' },
];

export const SEED_GEOGRAPHY: readonly NewGeographyArea[] = [
  { name: 'north', geometry: [35.29, 33.0] },
  { name: 'center', geometry: [34.85, 32.08] },
  { name: 'south', geometry: [34.79, 31.25] },
];

export const SEED_SENSOR_GROUPS: readonly NewSensorGroup[] = [
  {
    name: 'day_group',
    description: 'חיישני יום באור נראה',
    sensors: ['violet_cam', 'wide_angle_cam'],
  },
  {
    name: 'night_group',
    description: 'חיישני לילה',
    sensors: ['copper_cam', 'zoom_cam'],
  },
  {
    name: 'all_weather_group',
    description: 'חיישנים לכל מזג אוויר',
    sensors: ['violet_cam', 'copper_cam', 'willow_cam'],
  },
];

export const SEED_RULES: readonly NewRule[] = [
  {
    name: 'day_north_rule',
    minResolution: 640,
    maxResolution: 1920,
    sensingType: 'violet',
    sensorGroup: 'day_group',
    geographyName: 'north',
    userIds: [SEED_CREATE_USER],
  },
  {
    name: 'night_center_rule',
    minResolution: 512,
    maxResolution: 1280,
    sensingType: 'copper',
    sensorGroup: 'night_group',
    geographyName: 'center',
    userIds: [SEED_CREATE_USER],
  },
  {
    name: 'all_weather_south_rule',
    minResolution: 800,
    maxResolution: 2560,
    sensingType: 'willow',
    sensorGroup: 'all_weather_group',
    geographyName: 'south',
    userIds: [SEED_CREATE_USER],
  },
];

export type DetectorConfig = {
  architecture: string;
  inputSize: number[];
  scoreThreshold: number;
  nmsThreshold: number;
  precision: string;
};

export type WisdomConfig = {
  omekScoreThresh: number[];
  dexterScoreThresh: {
    day: number;
    night: number;
    lowLight: number;
  };
  useRotatedBoxes: boolean;
  performance: {
    precision: number;
    recall: number;
    recommendedScoreThreshold: number;
  };
};

export type SeedSqruleConfig = {
  omekScoreThresh: number;
  dexterScoreThresh: WisdomConfig['dexterScoreThresh'];
};

export const sqruleConfig = (config: WisdomConfig): SeedSqruleConfig => ({
  omekScoreThresh: config.performance.recommendedScoreThreshold,
  dexterScoreThresh: config.dexterScoreThresh,
});

export type SeedModel = {
  modelName: string;
  version: number;
  isActive: boolean;
  config: DetectorConfig;
};

export type SeedDeepWisdomModel = Omit<SeedModel, 'config'> & {
  config: WisdomConfig;
  ruleName: string;
  dexterModelNames: readonly string[];
};

export type SeedObject = {
  englishName: string;
  hebrewName: string;
  categoryName: string;
  isActive: boolean;
  models: readonly SeedModel[];
  deepWisdomModels: readonly SeedDeepWisdomModel[];
};

const detectorConfig = (
  architecture: string,
  inputSize: number,
  threshold: number,
): DetectorConfig => ({
  architecture,
  inputSize: [inputSize, inputSize],
  scoreThreshold: threshold,
  nmsThreshold: 0.45,
  precision: 'fp16',
});

const round2 = (value: number): number => Number(value.toFixed(2));

const wisdomConfig = (
  confidence: number,
  useRotatedBoxes: boolean,
): WisdomConfig => ({
  omekScoreThresh: [
    confidence,
    round2(confidence + 0.1),
    round2(confidence + 0.2),
  ],
  dexterScoreThresh: {
    day: confidence,
    night: round2(confidence - 0.05),
    lowLight: round2(confidence - 0.1),
  },
  useRotatedBoxes,
  performance: {
    precision: round2(confidence + 0.25),
    recall: round2(confidence + 0.15),
    recommendedScoreThreshold: confidence,
  },
});

export const SEED_OBJECTS: readonly SeedObject[] = [
  {
    englishName: 'field_generator',
    hebrewName: 'גנרטור שדה',
    categoryName: 'general_equipment',
    isActive: true,
    models: [
      {
        modelName: 'field_generator_yolo_v1',
        version: 1,
        isActive: true,
        config: detectorConfig('yolov8', 640, 0.4),
      },
      {
        modelName: 'field_generator_yolo_v2',
        version: 2,
        isActive: true,
        config: detectorConfig('yolov8', 960, 0.35),
      },
      {
        modelName: 'field_generator_rtdetr_v1',
        version: 1,
        isActive: true,
        config: detectorConfig('rtdetr', 640, 0.5),
      },
      {
        modelName: 'field_generator_effdet_v1',
        version: 1,
        isActive: false,
        config: detectorConfig('efficientdet', 512, 0.55),
      },
    ],
    deepWisdomModels: [
      {
        modelName: 'field_generator_wisdom_v1',
        version: 1,
        isActive: true,
        config: wisdomConfig(0.6, false),
        ruleName: 'day_north_rule',
        dexterModelNames: [
          'field_generator_yolo_v1',
          'field_generator_yolo_v2',
        ],
      },
      {
        modelName: 'field_generator_wisdom_v2',
        version: 2,
        isActive: true,
        config: wisdomConfig(0.55, false),
        ruleName: 'night_center_rule',
        dexterModelNames: [],
      },
    ],
  },
  {
    englishName: 'drill_kit',
    hebrewName: 'ערכת מקדחות',
    categoryName: 'hand_tools',
    isActive: true,
    models: [
      {
        modelName: 'drill_kit_yolo_v1',
        version: 1,
        isActive: true,
        config: detectorConfig('yolov8', 640, 0.45),
      },
      {
        modelName: 'drill_kit_yolo_v2',
        version: 2,
        isActive: true,
        config: detectorConfig('yolov8', 640, 0.4),
      },
      {
        modelName: 'drill_kit_rtdetr_v1',
        version: 1,
        isActive: true,
        config: detectorConfig('rtdetr', 800, 0.5),
      },
      {
        modelName: 'drill_kit_effdet_v1',
        version: 1,
        isActive: false,
        config: detectorConfig('efficientdet', 512, 0.6),
      },
    ],
    deepWisdomModels: [
      {
        modelName: 'drill_kit_wisdom_v1',
        version: 1,
        isActive: true,
        config: wisdomConfig(0.65, true),
        ruleName: 'day_north_rule',
        dexterModelNames: ['drill_kit_yolo_v1'],
      },
      {
        modelName: 'drill_kit_wisdom_v2',
        version: 2,
        isActive: false,
        config: wisdomConfig(0.6, true),
        ruleName: 'all_weather_south_rule',
        dexterModelNames: ['drill_kit_rtdetr_v1', 'drill_kit_yolo_v2'],
      },
    ],
  },
  {
    englishName: 'copper_camera',
    hebrewName: 'מצלמת קופר',
    categoryName: 'electronics',
    isActive: true,
    models: [
      {
        modelName: 'copper_camera_yolo_v1',
        version: 1,
        isActive: true,
        config: detectorConfig('yolov8', 960, 0.35),
      },
      {
        modelName: 'copper_camera_rtdetr_v1',
        version: 1,
        isActive: true,
        config: detectorConfig('rtdetr', 960, 0.45),
      },
      {
        modelName: 'copper_camera_rtdetr_v2',
        version: 2,
        isActive: true,
        config: detectorConfig('rtdetr', 1280, 0.4),
      },
      {
        modelName: 'copper_camera_effdet_v1',
        version: 1,
        isActive: false,
        config: detectorConfig('efficientdet', 640, 0.5),
      },
    ],
    deepWisdomModels: [
      {
        modelName: 'copper_camera_wisdom_v1',
        version: 1,
        isActive: true,
        config: wisdomConfig(0.5, false),
        ruleName: 'night_center_rule',
        dexterModelNames: ['copper_camera_rtdetr_v1'],
      },
      {
        modelName: 'copper_camera_wisdom_v2',
        version: 2,
        isActive: true,
        config: wisdomConfig(0.45, true),
        ruleName: 'night_center_rule',
        dexterModelNames: [],
      },
    ],
  },
  {
    englishName: 'field_desk',
    hebrewName: 'שולחן שדה',
    categoryName: 'furniture',
    isActive: true,
    models: [
      {
        modelName: 'field_desk_yolo_v1',
        version: 1,
        isActive: true,
        config: detectorConfig('yolov8', 512, 0.5),
      },
      {
        modelName: 'field_desk_yolo_v2',
        version: 2,
        isActive: true,
        config: detectorConfig('yolov8', 640, 0.45),
      },
      {
        modelName: 'field_desk_rtdetr_v1',
        version: 1,
        isActive: false,
        config: detectorConfig('rtdetr', 640, 0.55),
      },
      {
        modelName: 'field_desk_effdet_v1',
        version: 1,
        isActive: true,
        config: detectorConfig('efficientdet', 512, 0.5),
      },
    ],
    deepWisdomModels: [
      {
        modelName: 'field_desk_wisdom_v1',
        version: 1,
        isActive: true,
        config: wisdomConfig(0.7, true),
        ruleName: 'all_weather_south_rule',
        dexterModelNames: ['field_desk_yolo_v1'],
      },
      {
        modelName: 'field_desk_wisdom_v2',
        version: 2,
        isActive: false,
        config: wisdomConfig(0.6, true),
        ruleName: 'day_north_rule',
        dexterModelNames: [],
      },
    ],
  },
  {
    englishName: 'field_kitchen',
    hebrewName: 'מטבח שדה',
    categoryName: 'kitchen',
    isActive: false,
    models: [
      {
        modelName: 'field_kitchen_yolo_v1',
        version: 1,
        isActive: true,
        config: detectorConfig('yolov8', 640, 0.4),
      },
      {
        modelName: 'field_kitchen_yolo_v2',
        version: 2,
        isActive: false,
        config: detectorConfig('yolov8', 960, 0.35),
      },
      {
        modelName: 'field_kitchen_rtdetr_v1',
        version: 1,
        isActive: true,
        config: detectorConfig('rtdetr', 640, 0.5),
      },
      {
        modelName: 'field_kitchen_effdet_v1',
        version: 1,
        isActive: true,
        config: detectorConfig('efficientdet', 512, 0.55),
      },
    ],
    deepWisdomModels: [
      {
        modelName: 'field_kitchen_wisdom_v1',
        version: 1,
        isActive: true,
        config: wisdomConfig(0.55, false),
        ruleName: 'day_north_rule',
        dexterModelNames: ['field_kitchen_yolo_v1', 'field_kitchen_rtdetr_v1'],
      },
      {
        modelName: 'field_kitchen_wisdom_v2',
        version: 2,
        isActive: true,
        config: wisdomConfig(0.5, true),
        ruleName: 'all_weather_south_rule',
        dexterModelNames: [],
      },
    ],
  },
];
