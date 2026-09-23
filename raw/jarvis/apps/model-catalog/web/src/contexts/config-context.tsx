import type { GetWebConfigOutput } from '@jarvis/model-catalog-contract';
import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useTRPC } from '../trpc';

type AppConfig = GetWebConfigOutput;

const DEFAULT_GEOGRAPHY_LABEL_SINGULAR = 'אזור';
const DEFAULT_GEOGRAPHY_LABEL_PLURAL = 'אזורים';

interface ConfigContextType {
  appConfig: AppConfig | undefined;
  isLoading: boolean;
  error: unknown;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const trpc = useTRPC();
  const {
    data: appConfig,
    isPending,
    error,
  } = useQuery(trpc.webConfig.get.queryOptions(undefined, { retry: false }));

  const value = useMemo(
    () => ({ appConfig, isLoading: isPending, error }),
    [appConfig, isPending, error],
  );

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export function useConfigContext() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfigContext must be used within a ConfigProvider');
  }
  return context;
}

export function useGeographyTerms() {
  const { appConfig } = useConfigContext();

  return {
    singular:
      appConfig?.GEOGRAPHY_LABEL_SINGULAR ?? DEFAULT_GEOGRAPHY_LABEL_SINGULAR,
    plural: appConfig?.GEOGRAPHY_LABEL_PLURAL ?? DEFAULT_GEOGRAPHY_LABEL_PLURAL,
  };
}
