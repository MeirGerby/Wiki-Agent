import { SESSION_ID_HEADER } from '@jarvis/logging';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import type { AwilixContainer } from 'awilix';
import type { Context as HonoContext } from 'hono';
import { getCookie } from 'hono/cookie';
import type { AuthTokenUser } from './auth/auth.service.js';
import { AUTH_COOKIE_KEY } from './utils/cookies.js';
import type { Cradle } from './container.js';

export type AppContext = {
  cradle: Cradle;
  sessionId: string | undefined;
  honoContext: HonoContext;
  user: AuthTokenUser | undefined;
};

export function makeCreateContext(container: AwilixContainer<Cradle>) {
  return (_opts: FetchCreateContextFnOptions, c: HonoContext): AppContext => {
    const cradle = container.createScope().cradle;
    const sessionId = c.req.header(SESSION_ID_HEADER);

    const authToken = getCookie(c, AUTH_COOKIE_KEY);
    const user = authToken
      ? cradle.authService.parseAuthToken(authToken)
      : undefined;

    return { cradle, sessionId, honoContext: c, user };
  };
}
