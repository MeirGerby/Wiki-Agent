import type { Model } from '@jarvis/model-catalog-contract';
import { useMemo } from 'react';
import {
  useConfigContext,
  useGeographyTerms,
} from '../../../contexts/config-context';
import { modelDetailSpecs } from '../../../data/catalog';

const NO_LABELS: Record<string, string> = {};

export function useModelDetailSpecs(model: Model) {
  const { appConfig } = useConfigContext();
  const { singular } = useGeographyTerms();
  const geographyLabels = appConfig?.GEOGRAPHY_LABELS ?? NO_LABELS;
  const sensorGroupLabels = appConfig?.SENSOR_GROUP_LABELS ?? NO_LABELS;

  return useMemo(
    () =>
      modelDetailSpecs(
        model,
        {
          geographyLabel: singular,
          geographyLabels,
          sensorGroupLabels,
        },
        appConfig ? appConfig.RESOLUTION_UNIT : 'ק״מ',
      ),
    [model, singular, geographyLabels, sensorGroupLabels],
  );
}
