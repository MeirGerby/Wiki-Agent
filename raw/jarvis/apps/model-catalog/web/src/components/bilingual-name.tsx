type BilingualNameProps = {
  primary: string;
  secondary: string;
  className?: string;
};

export function BilingualName({
  primary,
  secondary,
  className,
}: BilingualNameProps) {
  return (
    <span dir="ltr" className={className}>
      <span className="font-normal text-muted-foreground">({secondary})</span>{' '}
      {primary}
    </span>
  );
}
