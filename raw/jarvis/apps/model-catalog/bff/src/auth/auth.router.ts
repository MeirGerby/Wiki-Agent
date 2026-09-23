import { SessionUser, SigninOutput } from '@jarvis/model-catalog-contract';
import { authedProcedure, publicProcedure, router } from '../trpc.js';
import { SigninInput } from './auth.service.js';

export const authRouter = router({
  signin: publicProcedure
    .input(SigninInput)
    .output(SigninOutput)
    .mutation(({ input, ctx }) =>
      ctx.cradle.authService.signin(ctx.honoContext, input),
    ),

  me: authedProcedure
    .output(SessionUser.nullable())
    .query(({ ctx }) => ctx.cradle.authService.me(ctx.user.id)),
});
