import type { Geography, SensorGroup } from '@jarvis/model-catalog-contract';
import { Button } from '@jarvis/ui/components/ui/button';
import { Input } from '@jarvis/ui/components/ui/input';
import { Label } from '@jarvis/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jarvis/ui/components/ui/select';
import { Textarea } from '@jarvis/ui/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@jarvis/ui/components/ui/tooltip';
import { useField, useStore } from '@tanstack/react-form';
import { use, useId, type ReactNode } from 'react';
import wandIcon from '../../assets/wand.svg';
import { useSortedGeographies } from '../../catalog/use-sorted-geographies';
import {
  useConfigContext,
  useGeographyTerms,
} from '../../contexts/config-context';
import {
  MODEL_CREATE_LABELS,
  MODEL_CREATE_MESSAGES,
  MODEL_CREATE_PLACEHOLDERS,
  MODEL_ENGLISH_NAME_HINT,
} from '../../data/catalog';
import { firstMessage } from '../../utils/form-errors';
import { Icon } from '../icon';
import {
  formContext,
  useFieldContext,
  useFormContext,
} from './model-form-context';
import {
  TaggingClassesMultiSelect,
  type TaggingClassOption,
} from './tagging-classes-multi-select';

export const MODEL_FORM_LABEL_CLASS = 'w-[104px] shrink-0 text-sm font-normal';

const NAME_FIELD_CLASS = 'w-[70%]';
const PICKER_FIELD_CLASS = 'w-1/2';
const TAG_FIELD_CLASS = 'w-[85%]';

type ModelFieldApi<TData> = ReturnType<typeof useFieldContext<TData>>;

function useModelField<TData>(name: string): ModelFieldApi<TData> {
  return useField({ form: use(formContext), name });
}

function ModalRow({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Label htmlFor={htmlFor} className={MODEL_FORM_LABEL_CLASS}>
          {label}
        </Label>
        <div className="flex flex-1 items-center gap-2">{children}</div>
      </div>
      {error ? (
        <p className="pr-[112px] text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

function touchedError(meta: {
  isTouched: boolean;
  errors: readonly unknown[];
}): string | undefined {
  return meta.isTouched ? firstMessage(meta.errors) : undefined;
}

function EnglishNameHint() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={MODEL_ENGLISH_NAME_HINT}
          className="inline-flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Icon src={wandIcon} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{MODEL_ENGLISH_NAME_HINT}</TooltipContent>
    </Tooltip>
  );
}

export function HebrewNameField() {
  const field = useModelField<string>('hebrewName');
  const id = useId();
  const error = touchedError(field.state.meta);

  return (
    <ModalRow label={MODEL_CREATE_LABELS.hebrewName} htmlFor={id} error={error}>
      <Input
        id={id}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        placeholder={MODEL_CREATE_PLACEHOLDERS.hebrewName}
        aria-invalid={error !== undefined}
        className={`h-8 text-sm ${NAME_FIELD_CLASS}`}
      />
    </ModalRow>
  );
}

export function EnglishNameField() {
  const field = useModelField<string>('englishName');
  const id = useId();
  const error = touchedError(field.state.meta);

  return (
    <ModalRow
      label={MODEL_CREATE_LABELS.englishName}
      htmlFor={id}
      error={error}
    >
      <Input
        id={id}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        placeholder={MODEL_CREATE_PLACEHOLDERS.englishName}
        dir="ltr"
        aria-invalid={error !== undefined}
        className={`h-8 text-right text-sm ${NAME_FIELD_CLASS}`}
      />
      <EnglishNameHint />
    </ModalRow>
  );
}

export function DescriptionField() {
  const field = useModelField<string | undefined>('description');
  const id = useId();

  return (
    <div className="flex items-start gap-2">
      <Label htmlFor={id} className={`${MODEL_FORM_LABEL_CLASS} pt-2`}>
        {MODEL_CREATE_LABELS.description}
      </Label>
      <Textarea
        id={id}
        name={field.name}
        value={field.state.value ?? ''}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        placeholder={MODEL_CREATE_PLACEHOLDERS.description}
        className="min-h-[88px] flex-1 text-sm"
      />
    </div>
  );
}

export function SensorGroupField({
  sensorGroups,
}: {
  sensorGroups: readonly SensorGroup[];
}) {
  const field = useModelField<string | undefined>('sensorGroupName');
  const { appConfig } = useConfigContext();
  const labels = appConfig?.SENSOR_GROUP_LABELS ?? {};

  return (
    <ModalRow label={MODEL_CREATE_LABELS.sensorGroup}>
      <Select
        dir="rtl"
        value={field.state.value}
        onValueChange={(next) => {
          if (next === field.state.value) return;
          field.form.setFieldValue('minResolution', undefined);
          field.form.setFieldValue('maxResolution', undefined);
          field.handleChange(next);
        }}
      >
        <SelectTrigger className={PICKER_FIELD_CLASS} onBlur={field.handleBlur}>
          <SelectValue placeholder={MODEL_CREATE_PLACEHOLDERS.sensorGroup} />
        </SelectTrigger>
        <SelectContent>
          {sensorGroups.map((group) => (
            <SelectItem key={group.name} value={group.name}>
              {labels[group.name] ?? group.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ModalRow>
  );
}

export function GeographyField({
  geographies,
}: {
  geographies: readonly Geography[];
}) {
  const field = useModelField<string | undefined>('geographyName');
  const { appConfig } = useConfigContext();
  const labels = appConfig?.GEOGRAPHY_LABELS ?? {};
  const { singular } = useGeographyTerms();
  const sortedGeographies = useSortedGeographies(geographies);

  return (
    <ModalRow label={singular}>
      <Select
        dir="rtl"
        value={field.state.value}
        onValueChange={field.handleChange}
      >
        <SelectTrigger className={PICKER_FIELD_CLASS} onBlur={field.handleBlur}>
          <SelectValue placeholder={`בחר ${singular}`} />
        </SelectTrigger>
        <SelectContent>
          {sortedGeographies.map((area) => (
            <SelectItem key={area.name} value={area.name}>
              {labels[area.name] ?? area.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ModalRow>
  );
}

function TaggingClassesField({
  name,
  label,
  placeholder,
  options,
  disabled,
}: {
  name: string;
  label: string;
  placeholder: string;
  options: readonly TaggingClassOption[];
  disabled?: boolean;
}) {
  const field = useModelField<string[]>(name);

  return (
    <ModalRow label={label}>
      <TaggingClassesMultiSelect
        options={options}
        value={field.state.value}
        onValueChange={field.handleChange}
        placeholder={placeholder}
        searchPlaceholder={MODEL_CREATE_PLACEHOLDERS.taggingClassSearch}
        emptyText={MODEL_CREATE_MESSAGES.taggingClassesNoResults}
        className={TAG_FIELD_CLASS}
        disabled={disabled}
      />
    </ModalRow>
  );
}

export function PositiveTaggingClassesField({
  options,
  disabled,
}: {
  options: readonly TaggingClassOption[];
  disabled?: boolean;
}) {
  return (
    <TaggingClassesField
      name="positiveTaggingClassNames"
      label={MODEL_CREATE_LABELS.positiveTaggingClasses}
      placeholder={MODEL_CREATE_PLACEHOLDERS.positiveTaggingClasses}
      options={options}
      disabled={disabled}
    />
  );
}

export function EmptyFieldsClassesField({
  options,
  disabled,
}: {
  options: readonly TaggingClassOption[];
  disabled?: boolean;
}) {
  return (
    <TaggingClassesField
      name="emptyFieldsClassNames"
      label={MODEL_CREATE_LABELS.emptyFields}
      placeholder={MODEL_CREATE_PLACEHOLDERS.emptyFields}
      options={options}
      disabled={disabled}
    />
  );
}

const NO_RESOLUTIONS: readonly number[] = [];

function withCurrent(
  values: readonly number[],
  current: number | undefined,
): readonly number[] {
  if (current === undefined || values.includes(current)) return values;
  return [...values, current].sort((a, b) => a - b);
}

function ResolutionSelect({
  label,
  value,
  options,
  disabled,
  onChange,
  onBlur,
}: {
  label: string;
  value: number | undefined;
  options: readonly number[];
  disabled: boolean;
  onChange: (value: number) => void;
  onBlur: () => void;
}) {
  return (
    <>
      <span className="text-sm text-muted-foreground">{label}</span>
      <Select
        dir="rtl"
        value={value === undefined ? '' : String(value)}
        disabled={disabled}
        onValueChange={(next) => onChange(Number(next))}
      >
        <SelectTrigger
          aria-label={`${MODEL_CREATE_LABELS.resolution} ${label}`}
          className="w-28"
          onBlur={onBlur}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

export function ResolutionRangeField() {
  const maxField = useModelField<number | undefined>('maxResolution');
  const maxResolution = maxField.state.value;
  const minResolution: number | undefined = useStore(
    maxField.form.store,
    (state) => state.values.minResolution,
  );
  const sensorGroupName: string | undefined = useStore(
    maxField.form.store,
    (state) => state.values.sensorGroupName,
  );
  const { appConfig } = useConfigContext();
  const error = firstMessage(maxField.state.meta.errors);

  const disabled = sensorGroupName === undefined;
  const values = disabled
    ? NO_RESOLUTIONS
    : (appConfig?.RESOLUTION_OPTIONS[sensorGroupName] ?? NO_RESOLUTIONS);

  const minOptions = withCurrent(values, minResolution).filter(
    (value) => maxResolution === undefined || value <= maxResolution,
  );
  const maxOptions = withCurrent(values, maxResolution).filter(
    (value) => minResolution === undefined || value >= minResolution,
  );

  return (
    <ModalRow label={MODEL_CREATE_LABELS.resolution} error={error}>
      <ResolutionSelect
        label="מ"
        value={minResolution}
        options={minOptions}
        disabled={disabled}
        onChange={(next) => maxField.form.setFieldValue('minResolution', next)}
        onBlur={maxField.handleBlur}
      />
      <ResolutionSelect
        label="עד"
        value={maxResolution}
        options={maxOptions}
        disabled={disabled}
        onChange={maxField.handleChange}
        onBlur={maxField.handleBlur}
      />
      {appConfig?.RESOLUTION_UNIT ? (
        <span className="text-sm text-muted-foreground">
          {appConfig.RESOLUTION_UNIT}
        </span>
      ) : null}
    </ModalRow>
  );
}

export function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={(state) => [state.canSubmit, state.isSubmitting] as const}
    >
      {([canSubmit, isSubmitting]) => (
        <Button type="submit" size="sm" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? pendingLabel : label}
        </Button>
      )}
    </form.Subscribe>
  );
}
