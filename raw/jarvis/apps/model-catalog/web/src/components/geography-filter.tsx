import type { Geography } from '@jarvis/model-catalog-contract';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jarvis/ui/components/ui/select';
import { useSortedGeographies } from '../catalog/use-sorted-geographies';
import {
  useConfigContext,
  useGeographyTerms,
} from '../contexts/config-context';

export const ALL_GEOGRAPHIES = '__all__';

type GeographyFilterProps = {
  geographies: readonly Geography[];
  value?: string;
  onChange: (geography: string | undefined) => void;
};

export function GeographyFilter({
  geographies,
  value,
  onChange,
}: GeographyFilterProps) {
  const { appConfig } = useConfigContext();
  const geographyLabels = appConfig?.GEOGRAPHY_LABELS ?? {};
  const { singular, plural } = useGeographyTerms();
  const sortedGeographies = useSortedGeographies(geographies);
  const allGeographiesLabel = `כל ה${plural}`;

  return (
    <Select
      value={value ?? ALL_GEOGRAPHIES}
      onValueChange={(next) =>
        onChange(next === ALL_GEOGRAPHIES ? undefined : next)
      }
    >
      <SelectTrigger
        size="sm"
        className="w-[180px] text-sm shadow-none"
        aria-label={`סנן לפי ${singular}`}
      >
        <SelectValue placeholder={allGeographiesLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_GEOGRAPHIES}>{allGeographiesLabel}</SelectItem>
        {sortedGeographies.map((area) => (
          <SelectItem key={area.name} value={area.name}>
            {geographyLabels[area.name] ?? area.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
