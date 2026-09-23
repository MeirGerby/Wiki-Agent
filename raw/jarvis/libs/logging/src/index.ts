import { z } from 'zod';

export { serializeError, type SerializedError } from './error.utils.js';
export {
  createConsoleLogger,
  toLogError,
  type LogFields,
  type LogFn,
  type Logger,
} from './console-logger.js';

export const LogLevel = ['info', 'warn', 'error', 'debug'] as const;
export type LogLevel = (typeof LogLevel)[number];

export const Project = ['model-catalog-web', 'model-catalog-bff'] as const;
export type Project = (typeof Project)[number];

export const SESSION_ID_HEADER = 'x-session-id';

export const logSchema = z.looseObject({
  level: z.enum(LogLevel),
  project: z.enum(Project),
  event: z.string(),
  message: z.string(),
  ts: z.string(),
  error: z.unknown().optional(),
});

export type Log = z.infer<typeof logSchema>;

export const logBatchSchema = z.array(logSchema);

export type LogFieldValue = string | number | boolean | null | undefined;

export type LogMeta = {
  event: string;
  message: string;
  [key: string]: LogFieldValue;
};
