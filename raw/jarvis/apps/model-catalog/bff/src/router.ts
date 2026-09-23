import { authRouter } from './auth/auth.router.js';
import { catalogRouter } from './catalog/catalog.router.js';
import { webConfigRouter } from './web-config/web-config.router.js';
import { loggerRouter } from './logging/logger.router.js';
import { permissionsRouter } from './permissions/permissions.router.js';
import { router } from './trpc.js';

/**
 * The package entrypoint (`exports` in package.json). apps/model-catalog/web imports
 * `AppRouter` from here as a *type* — the real router, not a generated stand-in.
 */
export const appRouter = router({
  catalog: catalogRouter,
  auth: authRouter,
  permissions: permissionsRouter,
  webConfig: webConfigRouter,
  logger: loggerRouter,
});

export type AppRouter = typeof appRouter;
