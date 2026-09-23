import { SESSION_ID_HEADER } from '@jarvis/logging';
import type { AppRouter } from '@jarvis/model-catalog-bff';
import {
  createTRPCClient,
  httpBatchLink,
  httpLink,
  isNonJsonSerializable,
  splitLink,
  type TRPCClient,
} from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

const SESSION_ID_STORAGE_KEY = 'jarvis-session-id';

const createId = () => crypto.randomUUID();

const getSessionId = () => {
  const sessionId = sessionStorage.getItem(SESSION_ID_STORAGE_KEY);

  if (sessionId) {
    return sessionId;
  }

  const newSessionId = createId();
  sessionStorage.setItem(SESSION_ID_STORAGE_KEY, newSessionId);
  return newSessionId;
};

const headers = () => ({
  [SESSION_ID_HEADER]: getSessionId(),
});

export const trpcClient: TRPCClient<AppRouter> = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => isNonJsonSerializable(op.input),
      true: httpLink({ url: '/trpc', headers }),
      false: httpBatchLink({ url: '/trpc', headers }),
    }),
  ],
});
