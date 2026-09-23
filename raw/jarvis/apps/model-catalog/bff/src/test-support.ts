import type { AppContext } from './context.js';

type TestContextOverrides<C> = {
  cradle: C;
  user?: AppContext['user'];
};

export function makeTestContext<C>({
  cradle,
  user,
}: TestContextOverrides<C>): AppContext {
  // eslint-disable-next-line anti-slop/no-chained-type-assertions, anti-slop/require-safety-comment-for-type-assertion -- test double supplies only the cradle and user an AppContext consumer reads
  return { cradle, user } as unknown as AppContext;
}
