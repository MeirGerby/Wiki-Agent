import {
  CloneModelInput,
  type Geography,
  type Model,
  type SensorGroup,
} from '@jarvis/model-catalog-contract';
import { useMutation } from '@tanstack/react-query';
import { useCatalogSync } from '../../catalog/use-catalog-sync';
import { MODEL_CLONE_LABELS, MODEL_CREATE_LABELS } from '../../data/catalog';
import { logError, logInfo } from '../../logging/log';
import { useTRPC } from '../../trpc';
import { ModelForm } from './model-form-dialog';
import { useModelForm } from './use-model-form';

function cloneForm(sourceId: string, source: Model): CloneModelInput {
  return {
    sourceId,
    hebrewName: '',
    englishName: '',
    sensorGroupName: source.sensorGroupName ?? undefined,
    minResolution: source.minResolution ?? undefined,
    maxResolution: source.maxResolution ?? undefined,
    geographyName: source.geography ?? undefined,
  };
}

export function CloneModelModal({
  sourceModel,
  sourceId,
  objectId,
  sensorGroups,
  geographies,
  onClose,
}: {
  sourceModel: Model;
  sourceId: string;
  objectId: string;
  sensorGroups: readonly SensorGroup[];
  geographies: readonly Geography[];
  onClose: () => void;
}) {
  const trpc = useTRPC();
  const { modelCloned } = useCatalogSync();

  const cloneModel = useMutation(
    trpc.catalog.cloneModel.mutationOptions({
      onSuccess: async (result) => {
        await modelCloned();
        logInfo({
          event: 'model.clone.ok',
          message: 'Model cloned',
          objectId,
          modelId: result.id,
        });
        onClose();
      },
      onError: (error) => {
        logError(
          {
            event: 'model.clone.failed',
            message: 'Model clone failed',
            objectId,
          },
          error,
        );
      },
    }),
  );

  const form = useModelForm({
    defaultValues: cloneForm(sourceId, sourceModel),
    validators: {
      onMount: CloneModelInput,
      onChange: CloneModelInput,
    },
    onSubmit: async ({ value }) => {
      logInfo({
        event: 'model.clone.attempted',
        message: 'Model clone attempted',
        objectId,
        modelId: value.sourceId,
      });
      await cloneModel.mutateAsync(value).catch(() => undefined);
    },
  });

  return (
    <ModelForm.Dialog
      form={form}
      title={MODEL_CLONE_LABELS.title}
      onClose={onClose}
    >
      <ModelForm.Body>
        <ModelForm.HebrewNameField />
        <ModelForm.EnglishNameField />

        <ModelForm.Section title={MODEL_CREATE_LABELS.modelDetailsSection}>
          <ModelForm.SensorGroupField sensorGroups={sensorGroups} />
          <ModelForm.ResolutionRangeField />
          <ModelForm.GeographyField geographies={geographies} />
        </ModelForm.Section>

        {cloneModel.error ? (
          <p role="alert" className="text-sm text-destructive">
            {cloneModel.error.message}
          </p>
        ) : null}
      </ModelForm.Body>

      <ModelForm.Footer
        cancelLabel={MODEL_CLONE_LABELS.cancel}
        onCancel={onClose}
      >
        <ModelForm.Submit
          label={MODEL_CLONE_LABELS.submit}
          pendingLabel="משכפל…"
        />
      </ModelForm.Footer>
    </ModelForm.Dialog>
  );
}
