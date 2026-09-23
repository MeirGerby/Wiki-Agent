import {
  logBatchSchema,
  logSchema,
  toLogError,
  type Log,
} from '@jarvis/logging';
import { z } from 'zod';
import type { AppContext } from '../context.js';
import { publicProcedure, router } from '../trpc.js';

function writeLog(ctx: AppContext, input: Log) {
  const { level, message, project, event, ts, error, ...rest } = input;

  ctx.cradle.logger[level](
    {
      project,
      event,
      ts,
      sessionId: ctx.sessionId,
      userId: ctx.user?.userId,
      error: error === undefined ? undefined : toLogError(error),
      // The schema is loose, so anything else the browser sent has no static type.
      extra: JSON.stringify(rest),
    },
    message,
  );
}

export const loggerRouter = router({
  log: publicProcedure
    .input(logSchema)
    .output(z.void())
    .mutation(({ input, ctx }) => writeLog(ctx, input)),

  logBatch: publicProcedure
    .input(logBatchSchema)
    .output(z.void())
    .mutation(({ input, ctx }) => {
      for (const entry of input) {
        writeLog(ctx, entry);
      }
    }),
});
