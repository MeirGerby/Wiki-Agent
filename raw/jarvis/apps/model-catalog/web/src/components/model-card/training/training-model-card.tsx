import type { TrainingModel } from '@jarvis/model-catalog-contract';
import { trainingModelSpecs } from '../../../data/catalog';
import { StatusBadge } from '../shared/status-badge';
import { CancelTrainingAction } from './cancel-training-action';
import {
  ModelCardActions,
  ModelCardDetails,
  ModelCardFrame,
  ModelCardHeader,
  ModelCardTitle,
  SpecRow,
} from '../shared/model-card-parts';
import { RetryTrainingAction } from './retry-training-action';

export function TrainingModelCard({
  trainingModel,
  objectId,
}: {
  trainingModel: TrainingModel;
  objectId: string;
}) {
  return (
    <ModelCardFrame>
      <ModelCardHeader>
        <ModelCardTitle>{trainingModel.hebrewName}</ModelCardTitle>
        <StatusBadge status={trainingModel.status} />
        <ModelCardActions>
          {trainingModel.status === 'ERROR' ? (
            <RetryTrainingAction
              missionId={trainingModel.missionId}
              objectId={objectId}
            />
          ) : (
            <CancelTrainingAction
              missionId={trainingModel.missionId}
              objectId={objectId}
            />
          )}
        </ModelCardActions>
      </ModelCardHeader>

      <ModelCardDetails className="pt-2">
        {trainingModelSpecs(trainingModel).map((spec) => (
          <SpecRow key={spec.key} spec={spec} />
        ))}
      </ModelCardDetails>
    </ModelCardFrame>
  );
}
