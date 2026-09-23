import {
  Permission,
  PermissionSubject,
  RemovePermissionInput,
  SetPermissionInput,
} from '@jarvis/model-catalog-contract';
import { z } from 'zod';
import { roleProcedure, router } from '../trpc.js';

const adminProcedure = roleProcedure('admin');

export const permissionsRouter = router({
  list: adminProcedure
    .output(z.array(Permission))
    .query(({ ctx }) => ctx.cradle.permissionsService.list()),

  set: adminProcedure
    .input(SetPermissionInput)
    .output(Permission)
    .mutation(({ input, ctx }) =>
      ctx.cradle.permissionsService.set(ctx.user.userId, ctx.role, input),
    ),

  remove: adminProcedure
    .input(RemovePermissionInput)
    .output(PermissionSubject)
    .mutation(({ input, ctx }) =>
      ctx.cradle.permissionsService.remove(ctx.user.userId, ctx.role, input),
    ),
});
