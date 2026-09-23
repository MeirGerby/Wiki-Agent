import type { Model } from '@jarvis/model-catalog-contract';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTRPC } from '../../../trpc';
import { CloneModelModal } from '../../model-form/clone-model-modal';
import { ModelCardEdit } from './model-card-edit';
import { ModelCardView } from './model-card-view';
import { useModelDetailSpecs } from './use-model-detail-specs';

type ModelCardProps = {
  model: Model;
  objectId: string;
  isEditing: boolean;
  canEdit: boolean;
  onEnterEdit: () => void;
  onExitEdit: () => void;
};

export function ModelCard({
  model,
  objectId,
  isEditing,
  canEdit,
  onEnterEdit,
  onExitEdit,
}: ModelCardProps) {
  const detailSpecs = useModelDetailSpecs(model);
  const [isCloning, setIsCloning] = useState(false);

  const trpc = useTRPC();
  const sensorGroups =
    useQuery({
      ...trpc.catalog.sensorGroups.queryOptions(),
      enabled: isCloning,
    }).data ?? [];
  const geographies =
    useQuery({
      ...trpc.catalog.geographies.queryOptions(),
      enabled: isCloning,
    }).data ?? [];

  return (
    <>
      {isEditing ? (
        <ModelCardEdit
          model={model}
          onSaved={onExitEdit}
          onCancel={onExitEdit}
          onDuplicate={() => setIsCloning(true)}
        />
      ) : (
        <ModelCardView
          model={model}
          specs={detailSpecs}
          canEdit={canEdit}
          onEdit={onEnterEdit}
          onDuplicate={() => setIsCloning(true)}
        />
      )}

      {isCloning ? (
        <CloneModelModal
          sourceModel={model}
          sourceId={model.id}
          objectId={objectId}
          sensorGroups={sensorGroups}
          geographies={geographies}
          onClose={() => setIsCloning(false)}
        />
      ) : null}
    </>
  );
}
