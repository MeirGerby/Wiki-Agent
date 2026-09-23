import type { Geography } from '@jarvis/model-catalog-contract';
import { useMemo } from 'react';
import { useConfigContext } from '../contexts/config-context';

export function sortGeographies(
  geographies: readonly Geography[],
  labels: Record<string, string>,
  pinned: string | undefined,
): Geography[] {
  const labelOf = (area: Geography) => labels[area.name] ?? area.name;

  return [...geographies].sort((a, b) => {
    const aIsPinned = a.name === pinned;
    const bIsPinned = b.name === pinned;

    if (aIsPinned !== bIsPinned) return aIsPinned ? -1 : 1;

    return labelOf(a).localeCompare(labelOf(b), 'he');
  });
}

export function useSortedGeographies(
  geographies: readonly Geography[],
): Geography[] {
  const { appConfig } = useConfigContext();
  const labels = appConfig?.GEOGRAPHY_LABELS;
  const pinned = appConfig?.PINNED_GEOGRAPHY;

  return useMemo(
    () => sortGeographies(geographies, labels ?? {}, pinned),
    [geographies, labels, pinned],
  );
}
