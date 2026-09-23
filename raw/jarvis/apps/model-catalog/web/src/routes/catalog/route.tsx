import type { CatalogObject } from '@jarvis/model-catalog-contract';
import { Card } from '@jarvis/ui/components/ui/card';
import { Separator } from '@jarvis/ui/components/ui/separator';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import {
  parseCatalogSearch,
  resolveCategoryIds,
  useCatalogData,
} from '../../catalog/use-catalog-data';
import { AppHeader } from '../../components/app-header';
import { CategoryPanel } from '../../components/category-panel';
import { ObjectList } from '../../components/object-list';
import { logInfo } from '../../logging/log';

const SEARCH_LOG_DELAY_MS = 1_000;

export const Route = createFileRoute('/catalog')({
  validateSearch: parseCatalogSearch,
  loaderDeps: ({ search }) => ({
    q: search.q,
    categories: search.categories,
    geography: search.geography,
  }),
  loader: async ({ context: { queryClient, trpc }, deps }) => {
    const categories = await queryClient.ensureQueryData(
      trpc.catalog.categories.queryOptions(),
    );

    void queryClient.prefetchQuery(trpc.catalog.geographies.queryOptions());

    void queryClient.prefetchQuery(
      trpc.catalog.objects.queryOptions({
        categoryEnglishNames: resolveCategoryIds(
          { categories: deps.categories, q: deps.q },
          categories,
        ),
        query: deps.q ?? '',
        geography: deps.geography,
      }),
    );
  },
  component: CatalogLayout,
});

function CatalogLayout() {
  const navigate = Route.useNavigate();
  const {
    search,
    categories,
    categoryIds,
    geographies,
    objects,
    objectsPending,
    objectsError,
    objectsFetching,
  } = useCatalogData();

  const selectedCategories = new Set(categoryIds);

  function setQuery(next: string) {
    navigate({
      search: (prev) => ({ ...prev, q: next.trim() === '' ? undefined : next }),
      replace: true,
    });
  }

  function setGeography(next: string | undefined) {
    logInfo({
      event: 'geography.filter.changed',
      message: 'Geography filter changed',
      geography: next ?? null,
    });

    navigate({
      search: (prev) => ({ ...prev, geography: next }),
      replace: true,
    });
  }

  function toggleCategory(id: string) {
    logInfo({
      event: 'category.filter.changed',
      message: 'Category filter changed',
      categoryId: id,
    });

    const next = new Set(selectedCategories);
    if (!next.delete(id)) next.add(id);

    navigate({
      search: (prev) => ({ ...prev, categories: [...next].sort() }),
    });
  }

  function toggleAllCategories(selectAll: boolean) {
    logInfo({
      event: 'category.filter.changed',
      message: 'Category filter changed (all)',
      selectAll,
    });

    navigate({
      search: (prev) => ({
        ...prev,
        categories: selectAll ? undefined : [],
      }),
    });
  }

  function handleObjectCreated(object: CatalogObject) {
    navigate({
      to: '/catalog/objects/$objectId',
      params: { objectId: object.englishName },
      search: (prev) => ({
        q: undefined,
        geography: prev.geography,
        categories: prev.categories
          ? [
              ...new Set([...prev.categories, object.categoryEnglishName]),
            ].sort()
          : undefined,
      }),
    });
  }

  const term = search.q?.trim() ?? '';
  const resultCount = objects.length;

  useEffect(() => {
    if (term.length === 0 || objectsFetching) {
      return;
    }

    const timeout = setTimeout(() => {
      if (resultCount === 0) {
        logInfo({
          event: 'search.empty',
          message: 'Search returned no results',
          term,
          resultCount,
        });
      } else {
        logInfo({
          event: 'search.run',
          message: 'Search run',
          termLength: term.length,
          resultCount,
        });
      }
    }, SEARCH_LOG_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [term, objectsFetching, resultCount]);

  return (
    <div className="flex h-svh flex-col gap-4 overflow-hidden bg-background">
      <AppHeader
        query={search.q ?? ''}
        onQueryChange={setQuery}
        geographies={geographies}
        geography={search.geography}
        onGeographyChange={setGeography}
      />

      <div className="flex min-h-0 flex-1 gap-4 px-4 pb-4">
        <CategoryPanel
          categories={categories}
          selected={selectedCategories}
          onToggle={toggleCategory}
          onToggleAll={toggleAllCategories}
        />

        <Card className="min-h-0 min-w-0 flex-1 flex-row gap-4 border-line-subtle p-4 shadow-none">
          <ObjectList
            objects={objects}
            categories={categories}
            onCreated={handleObjectCreated}
            isLoading={objectsPending}
            isError={objectsError}
          />
          <Separator orientation="vertical" className="bg-line-subtle" />
          <Outlet />
        </Card>
      </div>
    </div>
  );
}
