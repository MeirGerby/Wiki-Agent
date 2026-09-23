import { isRoleAtLeast, type Role } from '@jarvis/model-catalog-contract';
import { initTRPC, TRPCError } from '@trpc/server';
import type { AppContext } from './context.js';

const t = initTRPC.context<AppContext>().create();

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;

export const authedProcedure = t.procedure.use(function isAuthed(opts) {
  const { ctx } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return opts.next({ ctx: { user: ctx.user } });
});

export function roleProcedure(minimum: Role) {
  return authedProcedure.use(async function hasRole(opts) {
    const { ctx } = opts;

    const role = await ctx.cradle.permissionsService.resolveRole(
      ctx.user.userId,
      ctx.user.hierarchy,
    );

    if (!isRoleAtLeast(role, minimum)) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    return opts.next({ ctx: { user: ctx.user, role } });
  });
}
