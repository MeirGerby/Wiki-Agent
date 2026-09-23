import { cn } from '@jarvis/ui/lib/utils';
import type { ReactNode } from 'react';

export function ObjectListMessage({
  tone = 'muted',
  children,
}: {
  tone?: 'muted' | 'destructive';
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        'py-8 text-center text-sm',
        tone === 'destructive' ? 'text-destructive' : 'text-muted-foreground',
      )}
    >
      {children}
    </p>
  );
}
