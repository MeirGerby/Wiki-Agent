import type { CatalogObject, Category } from '@jarvis/model-catalog-contract';
import { ScrollArea } from '@jarvis/ui/components/ui/scroll-area';
import { CreateObjectModal } from '../create-object-modal';
import { ObjectCard } from './object-card';
import { ObjectListMessage } from './object-list-parts';

type ObjectListProps = {
  objects: readonly CatalogObject[];
  categories: readonly Category[];
  onCreated: (object: CatalogObject) => void;
  isLoading?: boolean;
  isError?: boolean;
};

export function ObjectList({
  objects,
  categories,
  onCreated,
  isLoading = false,
  isError = false,
}: ObjectListProps) {
  const categoryLabels = new Map(
    categories.map((category) => [category.englishName, category.hebrewName]),
  );

  return (
    <section className="flex min-h-0 w-[490px] shrink-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold">אובייקטים ({objects.length})</h2>

        <CreateObjectModal categories={categories} onCreated={onCreated} />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {isError ? (
          <ObjectListMessage tone="destructive">
            אירעה שגיאה בטעינת האובייקטים.
          </ObjectListMessage>
        ) : isLoading ? (
          <ObjectListMessage>טוען…</ObjectListMessage>
        ) : objects.length === 0 ? (
          <ObjectListMessage>אין אובייקטים שמתאימים לסינון.</ObjectListMessage>
        ) : (
          <ul className="flex flex-col gap-2 pl-3">
            {objects.map((object) => (
              <li key={object.englishName}>
                <ObjectCard
                  object={object}
                  categoryLabel={categoryLabels.get(object.categoryEnglishName)}
                />
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </section>
  );
}
