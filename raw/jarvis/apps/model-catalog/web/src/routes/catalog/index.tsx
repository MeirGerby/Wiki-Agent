import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/catalog/')({
  component: EmptyModelPanel,
});

function EmptyModelPanel() {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-6">
      <header className="flex flex-col gap-2 self-start text-sm">
        <h2 className="text-xl font-bold">—</h2>
      </header>

      <p className="text-sm text-muted-foreground">
        בחר אובייקט מהרשימה כדי לראות את המודלים שלו.
      </p>
    </section>
  );
}
