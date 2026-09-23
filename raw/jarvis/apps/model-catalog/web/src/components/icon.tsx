import { cn } from '@jarvis/ui/lib/utils';

type IconProps = {
  /** A URL from `src/assets` — these are the exact SVGs exported from the design. */
  src: string;
  /** Omit for decorative icons; required when the icon is a control's only content. */
  label?: string;
  /** Native hover tooltip — the design's tooltip popover, without the popover. */
  title?: string;
  size?: 12 | 16;
  className?: string;
};

/**
 * Renders an exported design asset at a fixed box. The assets are re-framed to a square
 * viewBox at export size, so a plain width/height render matches the design's stroke weight.
 */
export function Icon({ src, label, title, size = 16, className }: IconProps) {
  return (
    <img
      src={src}
      alt={label ?? ''}
      title={title}
      aria-hidden={label === undefined || undefined}
      width={size}
      height={size}
      className={cn('block shrink-0', className)}
      style={{ width: size, height: size }}
    />
  );
}
