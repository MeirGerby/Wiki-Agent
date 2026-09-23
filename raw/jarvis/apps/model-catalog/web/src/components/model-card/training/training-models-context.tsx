import type { TrainingModel } from '@jarvis/model-catalog-contract';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTRPC } from '../../../trpc';

const POLL_INTERVAL_MS = 10_000;
const NO_TRAINING_MODELS: readonly TrainingModel[] = [];

type TrainingModelsContextValue = {
  state: { trainingModels: readonly TrainingModel[] };
  actions: { cancelMission: (missionId: string) => void };
};

const TrainingModelsContext = createContext<TrainingModelsContextValue | null>(
  null,
);

export function TrainingModelsProvider({
  objectId,
  query,
  enabled,
  realModelEnglishNames,
  children,
}: {
  objectId: string;
  query: string;
  enabled: boolean;
  realModelEnglishNames: ReadonlySet<string>;
  children: ReactNode;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [cancelledMissionIds, setCancelledMissionIds] = useState<
    ReadonlySet<string>
  >(new Set());
  const previousMissionIds = useRef<ReadonlySet<string> | undefined>(undefined);

  const trainingQuery = useQuery({
    ...trpc.catalog.trainingModels.queryOptions({
      objectEnglishName: objectId,
      query,
    }),
    enabled,
    refetchInterval: POLL_INTERVAL_MS,
  });

  const missions = trainingQuery.data ?? NO_TRAINING_MODELS;

  useEffect(() => {
    const currentIds = new Set(missions.map((mission) => mission.missionId));

    const missionLeft =
      previousMissionIds.current !== undefined &&
      [...previousMissionIds.current].some((id) => !currentIds.has(id));
    previousMissionIds.current = currentIds;

    if (missionLeft) {
      void queryClient.invalidateQueries({
        queryKey: trpc.catalog.object.pathKey(),
      });
    }

    setCancelledMissionIds((ids) => {
      const stillPresent = [...ids].filter((id) => currentIds.has(id));
      return stillPresent.length === ids.size ? ids : new Set(stillPresent);
    });
  }, [missions, queryClient, trpc]);

  const trainingModels = useMemo(
    () =>
      missions.filter(
        (mission) =>
          !cancelledMissionIds.has(mission.missionId) &&
          !realModelEnglishNames.has(mission.englishName),
      ),
    [missions, cancelledMissionIds, realModelEnglishNames],
  );

  const cancelMission = useCallback((missionId: string) => {
    setCancelledMissionIds((ids) => new Set(ids).add(missionId));
  }, []);

  const value = useMemo(
    () => ({ state: { trainingModels }, actions: { cancelMission } }),
    [trainingModels, cancelMission],
  );

  return (
    <TrainingModelsContext value={value}>{children}</TrainingModelsContext>
  );
}

export function useTrainingModels() {
  const context = use(TrainingModelsContext);
  if (context === null) {
    throw new Error(
      'useTrainingModels must be used within a TrainingModelsProvider',
    );
  }
  return context;
}
