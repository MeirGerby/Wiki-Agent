import type { Model, Spec } from '@jarvis/model-catalog-contract';
import { Badge } from '@jarvis/ui/components/ui/badge';
import { Button } from '@jarvis/ui/components/ui/button';
import { Card } from '@jarvis/ui/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@jarvis/ui/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@jarvis/ui/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@jarvis/ui/components/ui/tooltip';
import { cn } from '@jarvis/ui/lib/utils';
import { Pencil, X, type LucideIcon } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import chevronDownIcon from '../../../assets/chevron-down-link.svg';
import dotsVerticalIcon from '../../../assets/dots-vertical.svg';
import infoCircleIcon from '../../../assets/info-circle.svg';
import { Icon } from '../../icon';
import { StatusBadge } from './status-badge';

/** The design's active tab is purple with a matching underline, not shadcn's foreground. */
const TAB_TRIGGER_CLASS =
  'flex-none px-0 py-3 text-sm font-normal after:bottom-[-1px] after:bg-brand data-[state=active]:text-brand';

export const SPEC_ROW_CLASS = 'flex items-center gap-2 text-sm';
export const SPEC_LABEL_CLASS =
  'flex w-[140px] shrink-0 items-center gap-1 font-bold';
export const SPEC_CONTROL_WIDTH = 'w-[240px]';

export function ModelCardFrame({ children }: { children: ReactNode }) {
  return (
    <Card className="gap-4 border-line-subtle p-4 shadow-none">{children}</Card>
  );
}

export function ModelCardHeader({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}

export function ModelCardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-bold">{children}</h3>;
}

export function ModelCardActions({ children }: { children: ReactNode }) {
  return <div className="mr-auto flex items-center gap-2">{children}</div>;
}

export function ModelHeading({ model }: { model: Model }) {
  return (
    <>
      <ModelCardTitle>{model.hebrewName ?? model.englishName}</ModelCardTitle>
      {model.operationalStatus === undefined ? null : (
        <StatusBadge status={model.operationalStatus} />
      )}
    </>
  );
}

export function ModelCardDetails({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <dl className={cn('flex flex-col gap-2', className)}>{children}</dl>;
}

export function EditModelButton({
  pressed,
  onClick,
}: {
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(pressed && 'border-brand-strong text-brand')}
    >
      <Pencil aria-hidden="true" />
      <span className="sr-only">{pressed ? 'סיים עריכה' : 'ערוך'}</span>
    </Button>
  );
}

export function IconActionButton({
  icon: IconComponent,
  label,
  onClick,
  disabled,
  className,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          className={className}
          onClick={onClick}
          disabled={disabled}
        >
          <IconComponent aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function DestructiveIconButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <IconActionButton
      icon={X}
      label={label}
      onClick={onClick}
      disabled={disabled}
      className="border-destructive/30 text-destructive hover:bg-destructive/10"
    />
  );
}

export function ModelActionsMenu({ children }: { children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon-sm">
          <Icon src={dotsVerticalIcon} label="פעולות נוספות" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ModelAction({
  children,
  onSelect,
  disabled,
}: {
  children: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
}) {
  return (
    <DropdownMenuItem onSelect={onSelect} disabled={disabled}>
      {children}
    </DropdownMenuItem>
  );
}

export function ModelCardTabs({ children }: { children: ReactNode }) {
  return (
    <Tabs defaultValue="details">
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-8 rounded-none border-b border-line-subtle p-0"
      >
        <TabsTrigger value="details" className={TAB_TRIGGER_CLASS}>
          פרטים
        </TabsTrigger>
        <TabsTrigger value="research" className={TAB_TRIGGER_CLASS}>
          תחקור
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="flex flex-col gap-2 pt-2">
        {children}
      </TabsContent>

      <TabsContent value="research" className="pt-2">
        <p className="py-2 text-sm text-muted-foreground">
          אין נתוני תחקור להצגה.
        </p>
      </TabsContent>
    </Tabs>
  );
}

export function SpecRow({ spec }: { spec: Spec }) {
  return (
    <div className="flex gap-2 text-sm">
      <dt className={SPEC_LABEL_CLASS}>
        {spec.label}
        {spec.hint ? <SpecHint hint={spec.hint} /> : null}
      </dt>
      <dd className="min-w-0 text-detail-value [overflow-wrap:anywhere]">
        {spec.items === undefined ? (
          spec.value
        ) : spec.collapsible ? (
          <ExpandableSpecValue value={spec.value} items={spec.items} />
        ) : (
          <SpecBadgeList items={spec.items} />
        )}
      </dd>
    </div>
  );
}

function ExpandableSpecValue({
  value,
  items,
}: {
  value: string;
  items: readonly string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={() => setExpanded((wasExpanded) => !wasExpanded)}
        className="inline-flex items-center gap-1 self-start rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {value}
        <Icon
          src={chevronDownIcon}
          size={12}
          className={cn(
            'transition-transform duration-200 ease-out motion-reduce:transition-none',
            expanded && 'rotate-180',
          )}
        />
      </button>
      <div
        inert={!expanded || undefined}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none',
          expanded
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <SpecBadgeList id={listId} items={items} className="pt-2" />
        </div>
      </div>
    </div>
  );
}

function SpecBadgeList({
  id,
  items,
  className,
}: {
  id?: string;
  items: readonly string[];
  className?: string;
}) {
  return (
    <ul id={id} className={cn('flex flex-wrap gap-1', className)}>
      {items.map((item) => (
        <li key={item}>
          <Badge
            variant="outline"
            className="rounded-[4px] font-normal text-detail-value"
          >
            {item}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export function SpecHint({ hint }: { hint: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={hint}
          className="inline-flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Icon src={infoCircleIcon} size={12} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}
