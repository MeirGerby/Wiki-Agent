import { Button } from '@jarvis/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@jarvis/ui/components/ui/dialog';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCatalogSync } from '../../../catalog/use-catalog-sync';
import { useTrainingModels } from './training-models-context';
import {
  MODEL_CREATE_LABELS,
  TRAINING_MODEL_MESSAGES,
} from '../../../data/catalog';
import { logError, logInfo } from '../../../logging/log';
import { useTRPC } from '../../../trpc';
import { DestructiveIconButton } from '../shared/model-card-parts';

export function CancelTrainingAction({
  missionId,
  objectId,
}: {
  missionId: string;
  objectId: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const trpc = useTRPC();
  const { trainingModelsChanged } = useCatalogSync();
  const {
    actions: { cancelMission },
  } = useTrainingModels();

  const abortTraining = useMutation(
    trpc.catalog.abortModelTraining.mutationOptions({
      onSuccess: async () => {
        toast.success(TRAINING_MODEL_MESSAGES.cancelSucceeded);
        logInfo({
          event: 'training.abort.ok',
          message: 'Training abort succeeded',
          objectId,
          missionId,
        });
        cancelMission(missionId);
        setConfirmOpen(false);
        await trainingModelsChanged();
      },
      onError: (error) => {
        logError(
          {
            event: 'training.abort.failed',
            message: 'Training abort failed',
            objectId,
            missionId,
          },
          error,
        );
      },
    }),
  );

  return (
    <>
      <DestructiveIconButton
        label={TRAINING_MODEL_MESSAGES.cancelTooltip}
        onClick={() => setConfirmOpen(true)}
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{TRAINING_MODEL_MESSAGES.cancelTitle}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 px-6">
            <DialogDescription>
              {TRAINING_MODEL_MESSAGES.cancelBody}
            </DialogDescription>

            {abortTraining.error ? (
              <p role="alert" className="text-sm text-destructive">
                {abortTraining.error.message}
              </p>
            ) : null}
          </div>

          <DialogFooter className="flex-row-reverse">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={abortTraining.isPending}
              onClick={() => abortTraining.mutate({ missionId })}
            >
              {abortTraining.isPending
                ? TRAINING_MODEL_MESSAGES.cancelPending
                : TRAINING_MODEL_MESSAGES.cancelConfirm}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              {MODEL_CREATE_LABELS.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
