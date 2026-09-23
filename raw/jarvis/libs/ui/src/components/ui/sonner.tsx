import type * as React from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

// SAFETY: these are CSS custom properties, which CSSProperties doesn't type; sonner reads them by name.
const toasterStyle = {
  '--normal-bg': 'var(--popover)',
  '--normal-text': 'var(--popover-foreground)',
  '--normal-border': 'var(--border)',
} as React.CSSProperties;

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={toasterStyle}
      {...props}
    />
  );
}

export { Toaster };
