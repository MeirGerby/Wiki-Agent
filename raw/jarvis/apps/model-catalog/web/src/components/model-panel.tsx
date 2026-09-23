import type { Model } from '@jarvis/model-catalog-contract';
import { Button } from '@jarvis/ui/components/ui/button';
import { ScrollArea } from '@jarvis/ui/components/ui/scroll-area';
import { Skeleton } from '@jarvis/ui/components/ui/skeleton';
import { Link, useNavigate } from '@tanstack/react-router';
import plusDarkIcon from '../assets/plus-dark.svg';
import { BilingualName } from './bilingual-name';
import { Icon } from './icon';
import { ModelCard } from './model-card/model/model-card';
import { TrainingModelCard } from './model-card/training/training-model-card';
import { useTrainingModels } from './model-card/training/training-models-context';

type ModelPanelProps = {
  objectId: string;
  title?: string;
  models: readonly Model[];
  editingModelId?: string;
  isSearching?: boolean;
  canEdit?: boolean;
};

export function ModelPanel({
  objectId,
  title,
  models,
  editingModelId,
  isSearching = false,
  canEdit = false,
}: ModelPanelProps) {
  const navigate = useNavigate();
  const {
    state: { trainingModels },
  } = useTrainingModels();
  const showsNoSearchResults =
    isSearching && models.length === 0 && trainingModels.length === 0;

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-6">
      <header className="flex flex-col gap-2 self-start text-sm">
        {title === undefined ? (
          <Skeleton className="h-7 w-40" />
        ) : (
          <h2 className="text-xl font-bold">
            <BilingualName primary={title} secondary={objectId} />
          </h2>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-bold">
            מודלים ({models.length + trainingModels.length})
          </h3>
          {canEdit ? (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link
                to="/catalog/objects/$objectId/models/new"
                params={{ objectId }}
                search={(prev) => prev}
              >
                צור מודל חדש
                <Icon src={plusDarkIcon} />
              </Link>
            </Button>
          ) : null}
        </div>

        <ScrollArea className="min-h-0 flex-1">
          {showsNoSearchResults ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              אין מודלים שמתאימים לחיפוש
            </p>
          ) : (
            <div className="flex flex-col gap-4 pl-3">
              {trainingModels.map((trainingModel) => (
                <TrainingModelCard
                  key={trainingModel.missionId}
                  trainingModel={trainingModel}
                  objectId={objectId}
                />
              ))}

              {models.map((model) => (
                <ModelCard
                  key={model.englishName}
                  model={model}
                  objectId={objectId}
                  canEdit={canEdit}
                  isEditing={model.englishName === editingModelId}
                  onEnterEdit={() =>
                    navigate({
                      to: '/catalog/objects/$objectId/models/$modelName/edit',
                      params: { objectId, modelName: model.englishName },
                      search: (prev) => prev,
                    })
                  }
                  onExitEdit={() =>
                    navigate({
                      to: '/catalog/objects/$objectId',
                      params: { objectId },
                      search: (prev) => prev,
                    })
                  }
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </section>
  );
}
