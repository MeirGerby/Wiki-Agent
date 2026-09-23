import type { Context as HonoContext, MiddlewareHandler } from 'hono';
import { serialize } from 'hono/utils/cookie';

export const AUTH_COOKIE_KEY = 'auth-token';

const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;
const COOKIE_JAR_KEY = 'cookieJar';

export type CookieJarEnv = { Variables: { cookieJar: string[] } };

export type SetCookieDeps = {
  maxCookieSize: number;
  isProduction: boolean;
};

export function cookieJar(): MiddlewareHandler {
  return async (c, next) => {
    const jar: string[] = [];
    c.set(COOKIE_JAR_KEY, jar);

    await next();

    for (const cookie of jar) {
      c.header('set-cookie', cookie, { append: true });
    }
  };
}

function jarOf(c: HonoContext<CookieJarEnv>): string[] {
  const jar = c.get(COOKIE_JAR_KEY);

  if (!jar) {
    throw new Error(
      'cookieJar() middleware must run before any handler that sets cookies',
    );
  }

  return jar;
}

export function setCookie(
  c: HonoContext,
  { maxCookieSize, isProduction }: SetCookieDeps,
  key: string,
  value: string,
): void {
  if (value.length >= maxCookieSize) {
    return;
  }

  jarOf(c).push(
    serialize(key, value, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'Lax',
      maxAge: THIRTY_DAYS_IN_SECONDS,
      path: '/',
    }),
  );
}

export function clearCookie(c: HonoContext, key: string): void {
  jarOf(c).push(serialize(key, '', { path: '/', maxAge: 0 }));
}
