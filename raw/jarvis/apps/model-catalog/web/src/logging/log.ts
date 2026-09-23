import { type Log, type LogMeta, serializeError } from '@jarvis/logging';
import type { Mutation, Query } from '@tanstack/react-query';
import { trpcClient } from '../trpc';

const project = 'model-catalog-web';

const FLUSH_INTERVAL_MS = 5_000;
const FLUSH_SIZE = 20;

let buffer: Log[] = [];
let flushTimer: ReturnType<typeof setTimeout> | undefined;

function clearFlushTimer() {
  if (flushTimer === undefined) return;
  clearTimeout(flushTimer);
  flushTimer = undefined;
}

function flush() {
  clearFlushTimer();
  if (buffer.length === 0) return;

  const batch = buffer;
  buffer = [];

  // Calls the raw tRPC client directly, not a react-query mutation — so a failed flush never
  // runs through the app's MutationCache handler. A log about a failed flush would enqueue
  // another log, which would fail the same way: an infinite loop hammering the BFF. A failed
  // flush drops its batch and stays silent.
  trpcClient.logger.logBatch.mutate(batch).catch(() => undefined);
}

function enqueue(entry: Log) {
  buffer.push(entry);

  // Errors describe something the user did not get — send them at once rather than holding
  // them for up to 5 seconds.
  if (entry.level === 'error' || buffer.length >= FLUSH_SIZE) {
    flush();
    return;
  }

  if (flushTimer === undefined) {
    flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
  }
}

function write<E>(level: Log['level'], log: LogMeta, error?: E) {
  const entry: Log = {
    ...log,
    project,
    level,
    ts: new Date().toISOString(),
  };

  if (error !== undefined) {
    entry.error = serializeError(error);
  }

  enqueue(entry);
}

function pathFromKey(key: readonly unknown[] | undefined): string {
  const path = key?.[0];
  return Array.isArray(path) ? path.join('.') : 'unknown';
}

export const logInfo = (log: LogMeta) => write('info', log);
export const logWarn = (log: LogMeta) => write('warn', log);
export const logError = <E>(log: LogMeta, error: E) =>
  write('error', log, error);

export function onQueryError(
  error: Error,
  query: Query<unknown, unknown, unknown>,
): void {
  logError(
    {
      event: 'query.failed',
      message: 'Query failed',
      operation: pathFromKey(query.queryKey),
    },
    error,
  );
}

export function onMutationError<TVariables, TOnMutateResult>(
  error: Error,
  _variables: TVariables,
  _onMutateResult: TOnMutateResult,
  mutation: Mutation<unknown, unknown, unknown, unknown>,
): void {
  logError(
    {
      event: 'mutation.failed',
      message: 'Mutation failed',
      operation: pathFromKey(mutation.options.mutationKey),
    },
    error,
  );
}
