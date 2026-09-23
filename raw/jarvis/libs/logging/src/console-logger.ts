import type { SerializedError } from './error.utils.js';
// Type-only, so this erases at runtime and creates no cycle with index.ts.
import type { LogFieldValue, LogLevel } from './index.js';

export type LogFields = {
  [key: string]: LogFieldValue | SerializedError;
};

export type LogFn = (fields: LogFields, message: string) => void;

export type Logger = {
  [Level in LogLevel]: LogFn;
};

const SEVERITY = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
} satisfies { [Level in LogLevel]: number };

/** Turn any thrown value into a shape that survives JSON.stringify. */
export function toLogError<T>(error: T): SerializedError {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }

  return { name: 'NonError', message: String(error), stack: undefined };
}

export function createConsoleLogger(level: LogLevel): Logger {
  const threshold = SEVERITY[level];

  const at =
    (entry: LogLevel): LogFn =>
    (fields, message) => {
      if (SEVERITY[entry] < threshold) {
        return;
      }

      const line = JSON.stringify({
        level: entry,
        time: new Date().toISOString(),
        ...fields,
        msg: message,
      });

      if (entry === 'error') {
        console.error(line);
        return;
      }

      if (entry === 'warn') {
        console.warn(line);
        return;
      }

      console.log(line);
    };

  return {
    debug: at('debug'),
    info: at('info'),
    warn: at('warn'),
    error: at('error'),
  };
}
