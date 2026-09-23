import { GetWebConfigOutput } from '@jarvis/model-catalog-contract';
import { publicProcedure, router } from '../trpc.js';

export const webConfigRouter = router({
  get: publicProcedure
    .output(GetWebConfigOutput)
    .query(({ ctx }) => ctx.cradle.webConfig),
});
