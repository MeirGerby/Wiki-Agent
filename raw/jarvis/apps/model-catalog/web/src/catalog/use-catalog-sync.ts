import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '../trpc';

export type CatalogSync = {
  modelUpdated: () => Promise<void>;
  modelCloned: () => Promise<void>;
  objectCreated: () => Promise<void>;
  trainingModelsChanged: () => Promise<void>;
};

export function useCatalogSync(): CatalogSync {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  function invalidateObject() {
    return queryClient.invalidateQueries({
      queryKey: trpc.catalog.object.pathKey(),
    });
  }

  function invalidateObjects() {
    return queryClient.invalidateQueries({
      queryKey: trpc.catalog.objects.pathKey(),
    });
  }

  function invalidateTrainingModels() {
    return queryClient.invalidateQueries({
      queryKey: trpc.catalog.trainingModels.pathKey(),
    });
  }

  return {
    modelUpdated: invalidateObject,
    modelCloned: async () => {
      await Promise.all([invalidateObject(), invalidateObjects()]);
    },
    objectCreated: invalidateObjects,
    trainingModelsChanged: invalidateTrainingModels,
  };
}
