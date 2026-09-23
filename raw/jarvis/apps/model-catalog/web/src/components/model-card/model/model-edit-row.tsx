import { Label } from '@jarvis/ui/components/ui/label';
import { cn } from '@jarvis/ui/lib/utils';
import type { ReactNode } from 'react';
import { SPEC_LABEL_CLASS, SPEC_ROW_CLASS } from '../shared/model-card-parts';

export function ModelEditRow({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(SPEC_ROW_CLASS, 'flex-wrap', className)}>
      <dt className={SPEC_LABEL_CLASS}>
        <Label htmlFor={id}>{label}</Label>
      </dt>
      <dd className="flex flex-col gap-1">
        {children}
        {error ? (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </dd>
    </div>
  );
}
