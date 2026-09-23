import type { AppUser, Role } from '@jarvis/model-catalog-contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { logError, logInfo, logWarn } from '../logging/log';
import { useTRPC } from '../trpc';
import { fetchADFSUser } from '../utils/adfs';
import { useConfigContext } from './config-context';

export const DEFAULT_MAX_LOGIN_ATTEMPTS = 3;

type SessionUser = {
  id: string;
  userId: string;
  hierarchy: string | null;
  fullName: string | null;
  displayName: string | null;
  email: string | null;
  role: Role;
};

export interface AuthContextType {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean;
  hasAuthError: boolean;
  failedAttempts: number;
  maxLoginAttempts: number;
  retryLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isADFSPopupOpen, setIsADFSPopupOpen] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const isAttemptInFlightRef = useRef(false);
  const { appConfig, isLoading: isConfigLoading } = useConfigContext();

  const { data: user, isPending } = useQuery(
    trpc.auth.me.queryOptions(undefined, { retry: false }),
  );

  const onAttemptSuccess = () => {
    isAttemptInFlightRef.current = false;
    setIsADFSPopupOpen(false);
    setFailedAttempts(0);
  };

  const onAttemptFailure = () => {
    isAttemptInFlightRef.current = false;
    setIsADFSPopupOpen(false);
    setFailedAttempts((attempts) => attempts + 1);
  };

  const signinMutation = useMutation(
    trpc.auth.signin.mutationOptions({
      onSuccess: (data) => {
        logInfo({ event: 'auth.signin.ok', message: 'Signin ok' });
        if (data.isNewUser) {
          logInfo({ event: 'auth.user.created', message: 'New user created' });
        }
        queryClient.setQueryData(trpc.auth.me.queryKey(), data.user);
        onAttemptSuccess();
      },
      onError: (error) => {
        logError(
          { event: 'auth.signin.failed', message: 'Signin failed' },
          error,
        );
        onAttemptFailure();
      },
    }),
  );

  const handleADFSLogin = async () => {
    try {
      setIsADFSPopupOpen(true);
      logInfo({
        event: 'auth.adfs.popup.opened',
        message: 'ADFS popup opened',
      });
      const adfsUser: AppUser = await fetchADFSUser();
      signinMutation.mutate({
        userId: adfsUser.userId,
        email: adfsUser.email || undefined,
        displayName: adfsUser.displayName || undefined,
        fullName: adfsUser.fullName || undefined,
        hierarchy: adfsUser.hierarchy || undefined,
      });
    } catch (error) {
      logError(
        { event: 'auth.adfs.failed', message: 'ADFS authentication failed' },
        error,
      );
      onAttemptFailure();
    }
  };

  function startLogin() {
    if (isAttemptInFlightRef.current) return;

    isAttemptInFlightRef.current = true;

    if (appConfig?.DISABLE_ADFS_AUTH) {
      signinMutation.mutate({});
      return;
    }

    handleADFSLogin();
  }

  const handleRetryLogin = () => {
    logInfo({ event: 'auth.login.retried', message: 'Login retried' });
    setFailedAttempts(0);
    startLogin();
  };

  const maxLoginAttempts =
    appConfig?.MAX_ADFS_LOGIN_ATTEMPTS ?? DEFAULT_MAX_LOGIN_ATTEMPTS;
  const hasAuthError = !user && failedAttempts >= maxLoginAttempts;

  useEffect(() => {
    if (hasAuthError) {
      logWarn({
        event: 'auth.login.exhausted',
        message: 'Login attempts exhausted',
        attempts: failedAttempts,
        maxAttempts: maxLoginAttempts,
      });
    }
  }, [hasAuthError, failedAttempts, maxLoginAttempts]);

  useEffect(() => {
    if (
      isPending ||
      isConfigLoading ||
      user ||
      signinMutation.isPending ||
      isADFSPopupOpen ||
      hasAuthError
    ) {
      return;
    }

    logInfo({
      event: 'auth.login.started',
      message: 'Login started',
      attempt: failedAttempts + 1,
    });
    startLogin();
  }, [
    user,
    isPending,
    isConfigLoading,
    appConfig?.DISABLE_ADFS_AUTH,
    signinMutation.isPending,
    isADFSPopupOpen,
    hasAuthError,
    failedAttempts,
    maxLoginAttempts,
  ]);

  const resolvedUser: SessionUser | null =
    user ?? signinMutation.data?.user ?? null;

  const value: AuthContextType = {
    user: resolvedUser,
    isLoading:
      !hasAuthError &&
      (isPending ||
        isConfigLoading ||
        signinMutation.isPending ||
        isADFSPopupOpen),
    isAuthenticated: !!resolvedUser,
    isNewUser: signinMutation.data?.isNewUser ?? false,
    hasAuthError,
    failedAttempts,
    maxLoginAttempts,
    retryLogin: handleRetryLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
