import { useMutation } from '@tanstack/react-query';
import { RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { useCatalogSync } from '../../../catalog/use-catalog-sync';
import { TRAINING_MODEL_MESSAGES } from '../../../data/catalog';
import { logError, logInfo } from '../../../logging/log';
import { useTRPC } from '../../../trpc';
import { IconActionButton } from '../shared/model-card-parts';

export function RetryTrainingAction({
  missionId,
  objectId,
}: {
  missionId: string;
  objectId: string;
}) {
  const trpc = useTRPC();
  const { trainingModelsChanged } = useCatalogSync();

  const retryTraining = useMutation(
    trpc.catalog.retryModelTraining.mutationOptions({
      onSuccess: async () => {
        toast.success(TRAINING_MODEL_MESSAGES.retrySucceeded);
        logInfo({
          event: 'training.retry.ok',
          message: 'Training retry succeeded',
          objectId,
          missionId,
        });
        await trainingModelsChanged();
      },
      onError: (error) => {
        toast.error(error.message);
        logError(
          {
            event: 'training.retry.failed',
            message: 'Training retry failed',
            objectId,
            missionId,
          },
          error,
        );
      },
    }),
  );

  return (
    <IconActionButton
      icon={RotateCw}
      label={TRAINING_MODEL_MESSAGES.retryTooltip}
      onClick={() => retryTraining.mutate({ missionId })}
      disabled={retryTraining.isPending}
    />
  );
}
