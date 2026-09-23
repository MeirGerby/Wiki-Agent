import type { AppRouter } from '@jarvis/model-catalog-bff';
import { ErrorComponent } from '@jarvis/ui/components/error-component';
import { LoadingSpinner } from '@jarvis/ui/components/loading-spinner';
import { Button } from '@jarvis/ui/components/ui/button';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import {
  AuthProvider,
  DEFAULT_MAX_LOGIN_ATTEMPTS,
  useAuth,
  type AuthContextType,
} from './contexts/auth-context';
import { ConfigProvider, useConfigContext } from './contexts/config-context';
import { onMutationError, onQueryError } from './logging/log';
import { TRPCProvider, trpcClient } from './trpc';
import { routeTree } from './routeTree.gen';
import './styles.css';

// Catches every failed query and mutation in one place, so a UI log exists even for a call
// site nobody instrumented. A call site can still add its own richer log around the same
// failure — this is the floor, not the whole story.
const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onQueryError }),
  mutationCache: new MutationCache({ onError: onMutationError }),
});

const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});

const initialAuth: AuthContextType = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isNewUser: false,
  hasAuthError: false,
  failedAttempts: 0,
  maxLoginAttempts: DEFAULT_MAX_LOGIN_ATTEMPTS,
  retryLogin: () => undefined,
};

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: {
    auth: initialAuth,
    queryClient,
    trpc,
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function InnerApp() {
  const auth = useAuth();
  const config = useConfigContext();

  if (auth.isLoading || config.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (config.error || (!config.appConfig && !config.isLoading)) {
    return (
      <ErrorComponent
        title="שגיאה בטעינת המערכת"
        message="נסיון הטעינה כשל, אנא נסו שנית מאוחר יותר."
      />
    );
  }

  if (auth.hasAuthError) {
    return (
      <ErrorComponent
        title="שגיאת הזדהות"
        message={`ההזדהות מול ADFS נכשלה לאחר ${auth.maxLoginAttempts} ניסיונות. אנא נסו שוב או פנו לתמיכה.`}
      >
        <Button onClick={auth.retryLogin}>נסו שוב</Button>
      </ErrorComponent>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <ErrorComponent
        title="בעיה בהזדהות"
        message="נסיון ההזדהות כשל, אנא נסו שנית מאוחר יותר."
      >
        <Button onClick={auth.retryLogin}>נסו שוב</Button>
      </ErrorComponent>
    );
  }

  return (
    <RouterProvider router={router} context={{ auth, queryClient, trpc }} />
  );
}

console.log(
  `[model-catalog-web] app initializing (mode: ${import.meta.env.MODE})`,
);

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root is missing from the document');
}

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <ConfigProvider>
          <AuthProvider>
            <InnerApp />
          </AuthProvider>
        </ConfigProvider>
      </TRPCProvider>
    </QueryClientProvider>
  </StrictMode>,
);
