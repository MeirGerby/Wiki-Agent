import type { CatalogObject } from '@jarvis/model-catalog-contract';
import { Badge } from '@jarvis/ui/components/ui/badge';
import { Card } from '@jarvis/ui/components/ui/card';
import { cn } from '@jarvis/ui/lib/utils';
import { Link } from '@tanstack/react-router';
import { BilingualName } from '../bilingual-name';
import { ObjectThumbnail } from './object-thumbnail';

export function ObjectCard({
  object,
  categoryLabel,
}: {
  object: CatalogObject;
  categoryLabel: string | undefined;
}) {
  return (
    <Link
      to="/catalog/objects/$objectId"
      params={{ objectId: object.englishName }}
      search={(prev) => prev}
      className="block rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {({ isActive }) => (
        <Card
          className={cn(
            'gap-0 border-line-subtle py-0 shadow-none transition-colors',
            '[contain-intrinsic-size:auto_88px] [content-visibility:auto]',
            isActive ? 'bg-selected' : 'hover:bg-accent',
          )}
        >
          <div
            aria-current={isActive || undefined}
            className="flex w-full items-start gap-3 p-3 text-right"
          >
            <ObjectThumbnail key={object.fileUrl} src={object.fileUrl} />

            <div className="flex flex-col gap-1">
              <BilingualName
                primary={object.hebrewName}
                secondary={object.englishName}
                className={cn(
                  'text-base font-bold',
                  isActive && 'text-muted-foreground',
                )}
              />

              <div className="flex items-center gap-1.5">
                {categoryLabel !== undefined && (
                  <Badge
                    variant="outline"
                    className="rounded-[4px] font-normal"
                  >
                    {categoryLabel}
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {modelCountLabel(object.modelCount)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </Link>
  );
}

function modelCountLabel(modelCount: number): string {
  if (modelCount === 1) return 'מודל אחד';
  return `${modelCount} מודלים`;
}
