import type { Model } from '@jarvis/model-catalog-contract';
import { Button } from '@jarvis/ui/components/ui/button';
import { Input } from '@jarvis/ui/components/ui/input';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { useId, useState } from 'react';
import {
  MODEL_ACTION_LABELS,
  MODEL_EDIT_MESSAGES,
  SCORE_STEP,
  type ModelDetailKey,
} from '../../../data/catalog';
import { useCatalogSync } from '../../../catalog/use-catalog-sync';
import { logError, logInfo } from '../../../logging/log';
import { useTRPC } from '../../../trpc';
import {
  EditModelButton,
  ModelAction,
  ModelActionsMenu,
  ModelCardActions,
  ModelCardDetails,
  ModelCardFrame,
  ModelCardHeader,
  ModelCardTabs,
  ModelHeading,
  SPEC_CONTROL_WIDTH,
  SpecRow,
} from '../shared/model-card-parts';
import { ModelEditRow } from './model-edit-row';
import { useModelDetailSpecs } from './use-model-detail-specs';

type ScoreFieldName = 'recommendedScoreThreshold' | 'precision' | 'recall';

const SCORE_FIELD_BY_KEY = new Map<ModelDetailKey, ScoreFieldName>([
  ['recommendedScoreThreshold', 'recommendedScoreThreshold'],
  ['precision', 'precision'],
  ['recall', 'recall'],
]);

function toField(value: number | null): string {
  return value === null ? '' : String(value);
}

function toPatchNumber(value: string): number | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : Number(trimmed);
}

function scoreError(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;

  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) return MODEL_EDIT_MESSAGES.notANumber;
  if (parsed < 0 || parsed > 1) return MODEL_EDIT_MESSAGES.numberRange;

  return undefined;
}

export function ModelCardEdit({
  model,
  onSaved,
  onCancel,
  onDuplicate,
}: {
  model: Model;
  onSaved: () => void;
  onCancel: () => void;
  onDuplicate: () => void;
}) {
  const trpc = useTRPC();
  const { modelUpdated } = useCatalogSync();
  const [saveError, setSaveError] = useState<string | null>(null);

  const scoreFieldIds = {
    recommendedScoreThreshold: useId(),
    precision: useId(),
    recall: useId(),
  } satisfies Record<ScoreFieldName, string>;

  const detailSpecs = useModelDetailSpecs(model);

  const updateModel = useMutation(
    trpc.catalog.updateModel.mutationOptions({
      onSuccess: async () => {
        await modelUpdated();
        logInfo({
          event: 'model.updated',
          message: 'Model updated',
          modelId: model.englishName,
        });
        onSaved();
      },
      onError: (error) => {
        logError(
          { event: 'model.update.failed', message: 'Model update failed' },
          error,
        );
        setSaveError(MODEL_EDIT_MESSAGES.saveFailed);
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      recommendedScoreThreshold: toField(
        model.performance.recommendedScoreThreshold,
      ),
      precision: toField(model.performance.precision),
      recall: toField(model.performance.recall),
    },
    onSubmit: ({ value }) => {
      setSaveError(null);

      updateModel.mutate({
        id: model.id,
        performance: {
          recommendedScoreThreshold: toPatchNumber(
            value.recommendedScoreThreshold,
          ),
          precision: toPatchNumber(value.precision),
          recall: toPatchNumber(value.recall),
        },
      });
    },
  });

  return (
    <ModelCardFrame>
      <ModelCardHeader>
        <ModelHeading model={model} />
        <ModelCardActions>
          <EditModelButton pressed onClick={onCancel} />
          <ModelActionsMenu>
            <ModelAction onSelect={onDuplicate}>
              {MODEL_ACTION_LABELS.duplicate}
            </ModelAction>
          </ModelActionsMenu>
        </ModelCardActions>
      </ModelCardHeader>

      <ModelCardTabs>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <ModelCardDetails>
            {detailSpecs.map((spec) => {
              const fieldName = SCORE_FIELD_BY_KEY.get(spec.key);

              if (fieldName === undefined) {
                return <SpecRow key={spec.key} spec={spec} />;
              }

              return (
                <form.Field
                  key={spec.key}
                  name={fieldName}
                  validators={{ onChange: ({ value }) => scoreError(value) }}
                >
                  {(field) => (
                    <ModelEditRow
                      id={scoreFieldIds[fieldName]}
                      label={spec.label}
                      error={field.state.meta.errors[0] ?? undefined}
                    >
                      <Input
                        id={scoreFieldIds[fieldName]}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={1}
                        step={SCORE_STEP}
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        onBlur={field.handleBlur}
                        className={`h-8 text-end text-sm ${SPEC_CONTROL_WIDTH}`}
                      />
                    </ModelEditRow>
                  )}
                </form.Field>
              );
            })}
          </ModelCardDetails>

          {saveError ? (
            <p role="alert" className="text-sm text-destructive">
              {saveError}
            </p>
          ) : null}

          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isDirty: state.isDirty,
            })}
          >
            {({ canSubmit, isDirty }) => (
              <div className="flex gap-2 pt-3">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canSubmit || !isDirty || updateModel.isPending}
                >
                  שמור
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onCancel}
                  disabled={updateModel.isPending}
                >
                  ביטול
                </Button>
              </div>
            )}
          </form.Subscribe>
        </form>
      </ModelCardTabs>
    </ModelCardFrame>
  );
}
