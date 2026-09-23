import {
  CreateModelInput,
  type Geography,
  type SensorGroup,
  type TaggingClass,
} from '@jarvis/model-catalog-contract';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { useCatalogSync } from '../../catalog/use-catalog-sync';
import { MODEL_CREATE_LABELS, MODEL_CREATE_MESSAGES } from '../../data/catalog';
import { logError, logInfo } from '../../logging/log';
import { useTRPC } from '../../trpc';
import { ModelForm } from './model-form-dialog';
import { MODEL_FORM_LABEL_CLASS } from './model-form-parts';
import { useModelForm } from './use-model-form';

function emptyForm(objectId: string): CreateModelInput {
  return {
    objectEnglishName: objectId,
    hebrewName: '',
    englishName: '',
    description: undefined,
    sensorGroupName: undefined,
    minResolution: undefined,
    maxResolution: undefined,
    geographyName: undefined,
    positiveTaggingClassNames: [],
    emptyFieldsClassNames: [],
  };
}

export function CreateModelModal({
  objectId,
  sensorGroups,
  geographies,
  taggingClasses,
  taggingClassesFailed = false,
  taggingClassesLoading = false,
  onClose,
}: {
  objectId: string;
  sensorGroups: readonly SensorGroup[];
  geographies: readonly Geography[];
  taggingClasses: readonly TaggingClass[];
  taggingClassesFailed?: boolean;
  taggingClassesLoading?: boolean;
  onClose: () => void;
}) {
  const taggingClassOptions = useMemo(
    () =>
      taggingClasses.map((taggingClass) => ({
        value: taggingClass.className,
        label: taggingClass.hebrewName,
      })),
    [taggingClasses],
  );

  const trpc = useTRPC();
  const { trainingModelsChanged } = useCatalogSync();

  const createModel = useMutation(
    trpc.catalog.createModel.mutationOptions({
      onSuccess: async () => {
        toast.success(MODEL_CREATE_MESSAGES.createSucceeded);
        logInfo({
          event: 'model.create.ok',
          message: 'Model create succeeded',
          objectId,
        });
        await trainingModelsChanged();
        onClose();
      },
      onError: (error) => {
        logError(
          {
            event: 'model.create.failed',
            message: 'Model create failed',
            objectId,
          },
          error,
        );
      },
    }),
  );

  const form = useModelForm({
    defaultValues: emptyForm(objectId),
    validators: {
      onMount: CreateModelInput,
      onChange: CreateModelInput,
    },
    onSubmit: async ({ value }) => {
      logInfo({
        event: 'model.create.attempted',
        message: 'Model create attempted',
        objectId: value.objectEnglishName,
      });
      await createModel.mutateAsync(value).catch(() => undefined);
    },
  });

  return (
    <ModelForm.Dialog
      form={form}
      title={MODEL_CREATE_LABELS.title}
      onClose={onClose}
    >
      <ModelForm.Body>
        <div className="flex items-center gap-2">
          <span className={MODEL_FORM_LABEL_CLASS}>
            {MODEL_CREATE_LABELS.objectName}
          </span>
          <span className="flex-1 text-sm">
            <bdi>{objectId}</bdi>
          </span>
        </div>

        <ModelForm.HebrewNameField />
        <ModelForm.EnglishNameField />
        <ModelForm.DescriptionField />

        <ModelForm.Section title={MODEL_CREATE_LABELS.modelDetailsSection}>
          <ModelForm.SensorGroupField sensorGroups={sensorGroups} />
          <ModelForm.ResolutionRangeField />
          <ModelForm.GeographyField geographies={geographies} />
        </ModelForm.Section>

        <ModelForm.Section title={MODEL_CREATE_LABELS.taggingClassSection}>
          {taggingClassesFailed && (
            <p role="alert" className="text-sm text-destructive">
              {MODEL_CREATE_MESSAGES.taggingClassesFailed}
            </p>
          )}
          <ModelForm.PositiveTaggingClassesField
            options={taggingClassOptions}
            disabled={taggingClassesLoading || taggingClassesFailed}
          />
          <ModelForm.EmptyFieldsClassesField
            options={taggingClassOptions}
            disabled={taggingClassesLoading || taggingClassesFailed}
          />
        </ModelForm.Section>

        {createModel.error ? (
          <p role="alert" className="text-sm text-destructive">
            {createModel.error.message}
          </p>
        ) : null}
      </ModelForm.Body>

      <ModelForm.Footer
        cancelLabel={MODEL_CREATE_LABELS.cancel}
        onCancel={onClose}
      >
        <ModelForm.Submit
          label={MODEL_CREATE_LABELS.submit}
          pendingLabel="יוצר…"
        />
      </ModelForm.Footer>
    </ModelForm.Dialog>
  );
}
