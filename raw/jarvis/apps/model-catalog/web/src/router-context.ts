import type { AppRouter } from '@jarvis/model-catalog-bff';
import type { QueryClient } from '@tanstack/react-query';
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query';
import type { AuthContextType } from './contexts/auth-context';

export type RouterContext = {
  auth: AuthContextType;
  queryClient: QueryClient;
  trpc: TRPCOptionsProxy<AppRouter>;
};
