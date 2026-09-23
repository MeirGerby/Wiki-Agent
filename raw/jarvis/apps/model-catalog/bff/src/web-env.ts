import 'dotenv/config';
import {
  MODEL_RESOLUTION_MAX,
  MODEL_RESOLUTION_MIN,
} from '@jarvis/model-catalog-contract';
import { z } from 'zod';

const booleanStringSchema = z.string().transform((value) => value === 'true');

const labelOverridesSchema = z
  .string()
  .optional()
  .transform((value) => (value === undefined ? {} : JSON.parse(value)))
  .pipe(z.record(z.string(), z.string()));

const resolutionOptionsSchema = z
  .string()
  .optional()
  .transform((value) => (value === undefined ? {} : JSON.parse(value)))
  .pipe(
    z.record(
      z.string(),
      z.array(
        z.number().int().min(MODEL_RESOLUTION_MIN).max(MODEL_RESOLUTION_MAX),
      ),
    ),
  )
  .transform((options) =>
    Object.fromEntries(
      Object.entries(options).map(([sensorGroup, values]) => [
        sensorGroup,
        [...new Set(values)].sort((a, b) => a - b),
      ]),
    ),
  );

const webEnvSchema = z.object({
  DISABLE_ADFS_AUTH: booleanStringSchema,
  MAX_ADFS_LOGIN_ATTEMPTS: z.coerce.number().int().positive().default(3),
  SENSOR_GROUP_LABELS: labelOverridesSchema,
  GEOGRAPHY_LABELS: labelOverridesSchema,
  GEOGRAPHY_LABEL_SINGULAR: z.string().min(1).default('אזור'),
  GEOGRAPHY_LABEL_PLURAL: z.string().min(1).default('אזורים'),
  PINNED_GEOGRAPHY: z.string().min(1).optional(),
  RESOLUTION_OPTIONS: resolutionOptionsSchema,
  RESOLUTION_UNIT: z.string().min(1).optional(),
});

export type WebConfig = z.infer<typeof webEnvSchema>;

export function loadWebEnv(source: NodeJS.ProcessEnv = process.env): WebConfig {
  return webEnvSchema.parse(source);
}
