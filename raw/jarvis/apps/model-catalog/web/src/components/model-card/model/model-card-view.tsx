import type { Model } from '@jarvis/model-catalog-contract';
import { Button } from '@jarvis/ui/components/ui/button';
import { useState } from 'react';
import chevronDownIcon from '../../../assets/chevron-down-link.svg';
import chevronUpIcon from '../../../assets/chevron-up.svg';
import {
  COLLAPSED_SPEC_COUNT,
  MODEL_ACTION_LABELS,
  type ModelDetailSpec,
} from '../../../data/catalog';
import { Icon } from '../../icon';
import {
  ModelAction,
  EditModelButton,
  ModelActionsMenu,
  ModelCardActions,
  ModelCardDetails,
  ModelCardFrame,
  ModelCardHeader,
  ModelCardTabs,
  ModelHeading,
  SpecRow,
} from '../shared/model-card-parts';

export function ModelCardView({
  model,
  specs,
  canEdit,
  onEdit,
  onDuplicate,
}: {
  model: Model;
  specs: readonly ModelDetailSpec[];
  canEdit: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const visibleSpecs = expanded ? specs : specs.slice(0, COLLAPSED_SPEC_COUNT);
  const canExpand = specs.length > COLLAPSED_SPEC_COUNT;

  return (
    <ModelCardFrame>
      <ModelCardHeader>
        <ModelHeading model={model} />
        {canEdit ? (
          <ModelCardActions>
            <EditModelButton pressed={false} onClick={onEdit} />
            <ModelActionsMenu>
              <ModelAction onSelect={onDuplicate}>
                {MODEL_ACTION_LABELS.duplicate}
              </ModelAction>
            </ModelActionsMenu>
          </ModelCardActions>
        ) : null}
      </ModelCardHeader>

      <ModelCardTabs>
        <ModelCardDetails>
          {visibleSpecs.map((spec) => (
            <SpecRow key={spec.key} spec={spec} />
          ))}
        </ModelCardDetails>

        {canExpand ? (
          <Button
            variant="link"
            size="sm"
            onClick={() => setExpanded((wasExpanded) => !wasExpanded)}
            className="h-auto gap-1 self-start p-0 font-normal"
          >
            {expanded ? 'הצג פחות' : 'הצג עוד'}
            <Icon src={expanded ? chevronUpIcon : chevronDownIcon} size={12} />
          </Button>
        ) : null}
      </ModelCardTabs>
    </ModelCardFrame>
  );
}
