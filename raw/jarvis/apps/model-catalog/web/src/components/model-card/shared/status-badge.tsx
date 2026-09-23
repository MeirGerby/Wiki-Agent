import type {
  OperationalStatus,
  TrainingStatus,
} from '@jarvis/model-catalog-contract';
import { Badge } from '@jarvis/ui/components/ui/badge';
import { cn } from '@jarvis/ui/lib/utils';
import clockIcon from '../../../assets/clock.svg';
import checkIcon from '../../../assets/tag-check.svg';
import { Icon } from '../../icon';

export type BadgeStatus = OperationalStatus | TrainingStatus;

/** Ant's status tag is a square-cornered badge; shadcn's default is a pill, hence the radius. */
const STATUS_STYLES = {
  OPERATIONAL: {
    label: 'מבצעי',
    icon: checkIcon,
    className: 'border-success-border bg-success-bg text-success',
  },
  EXPERIMENTAL: {
    label: 'לא מבצעי',
    icon: clockIcon,
    className: 'border-border bg-muted text-foreground',
  },
  NOT_STARTED: {
    label: 'ממתין לאימון',
    icon: clockIcon,
    className: 'border-border bg-muted text-foreground',
  },
  RUNNING: {
    label: 'באימון',
    icon: clockIcon,
    className: 'border-brand/30 bg-brand/10 text-brand',
  },
  ERROR: {
    label: 'נכשל',
    icon: undefined,
    className: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
} as const satisfies Record<
  BadgeStatus,
  { label: string; icon: string | undefined; className: string }
>;

export function StatusBadge({
  status,
  className,
}: {
  status: BadgeStatus;
  className?: string;
}) {
  const style = STATUS_STYLES[status];

  return (
    <Badge
      variant="outline"
      className={cn('rounded-[4px] font-normal', style.className, className)}
    >
      {style.label}
      {style.icon ? <Icon src={style.icon} size={12} /> : null}
    </Badge>
  );
}
