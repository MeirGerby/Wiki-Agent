import { trpcServer } from '@hono/trpc-server';
import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { cookieJar } from './utils/cookies.js';
import { createAppContainer } from './container.js';
import { makeCreateContext } from './context.js';
import { appRouter } from './router.js';

const container = createAppContainer();
const { logger, config } = container.cradle;

console.log(`[model-catalog-bff] app initializing (env: ${config.NODE_ENV})`);

const app = new Hono();

app.use('*', cookieJar());

// Registered before the request logger so probe traffic stays out of the logs.
app.get('/health', (c) => c.text('ok'));

app.get('/ready', async (c) => {
  try {
    await container.cradle.db.execute(sql`select 1`);
    return c.text('ok');
  } catch {
    return c.text('not ready', 503);
  }
});

app.use('*', async (c, next) => {
  const startedAt = Date.now();
  await next();
  logger.info(
    {
      project: 'model-catalog-bff',
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      ms: Date.now() - startedAt,
    },
    'request',
  );
});

app.get('/api/adfs', (c) => {
  if (config.NODE_ENV === 'production' && config.ADFS_PRODUCTION_URL) {
    logger.info({}, 'Redirecting to ADFS production URL');
    return c.redirect(config.ADFS_PRODUCTION_URL);
  }

  const payload = JSON.stringify({
    isSuccess: true,
    error: '',
    user: {
      id: config.USER_ID,
      displayName: config.ADFS_STUB_DISPLAY_NAME,
      hierarchy: config.ADFS_STUB_HIERARCHY,
      fullName: config.ADFS_STUB_FULL_NAME,
      email: config.ADFS_STUB_EMAIL,
    },
  });

  return c.html(
    `<html>
    <head>
      <script>
        const data = ${payload};
        const win = window.opener || parent;
        win.postMessage(data, '*');
      </script>
    </head>
  </html>`,
  );
});

app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: makeCreateContext(container),
  }),
);

export default app;
