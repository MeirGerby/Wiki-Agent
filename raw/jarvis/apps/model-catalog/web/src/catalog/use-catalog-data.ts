import type {
  Category,
  CatalogObject,
  Geography,
} from '@jarvis/model-catalog-contract';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { useTRPC } from '../trpc';

const catalogRoute = getRouteApi('/catalog');

export type CatalogSearch = {
  q?: string;
  categories?: readonly string[];
  geography?: string;
};

export function parseCatalogSearch(
  // eslint-disable-next-line anti-slop/no-unsafe-dictionary-type -- URL-search parser boundary
  input: Record<string, unknown>,
): CatalogSearch {
  const search: CatalogSearch = {};

  /* eslint-disable anti-slop/no-runtime-typeof -- raw URL-search values arrive untyped here */
  if (typeof input.q === 'string' && input.q.trim() !== '') {
    search.q = input.q;
  }

  if (Array.isArray(input.categories)) {
    search.categories = input.categories.filter((id) => typeof id === 'string');
  } else if (typeof input.categories === 'string' && input.categories !== '') {
    search.categories = [input.categories];
  }

  if (typeof input.geography === 'string' && input.geography.trim() !== '') {
    search.geography = input.geography;
  }
  /* eslint-enable anti-slop/no-runtime-typeof */

  return search;
}

export function resolveCategoryIds(
  search: CatalogSearch,
  categories: readonly Category[],
): string[] {
  const ids =
    search.categories ?? categories.map((category) => category.englishName);
  return [...ids].sort();
}

export type CatalogData = {
  search: CatalogSearch;
  categories: readonly Category[];
  categoriesPending: boolean;
  categoryIds: string[];
  geographies: readonly Geography[];
  objects: readonly CatalogObject[];
  objectsPending: boolean;
  objectsFetching: boolean;
  objectsError: boolean;
};

export function useCatalogData(): CatalogData {
  const trpc = useTRPC();
  const search = catalogRoute.useSearch();

  const categoriesQuery = useQuery(trpc.catalog.categories.queryOptions());
  const categories = categoriesQuery.data ?? [];
  const categoryIds = resolveCategoryIds(search, categories);

  const geographiesQuery = useQuery(trpc.catalog.geographies.queryOptions());

  const objectsQuery = useQuery({
    ...trpc.catalog.objects.queryOptions({
      categoryEnglishNames: categoryIds,
      query: search.q ?? '',
      geography: search.geography,
    }),
    placeholderData: keepPreviousData,
  });

  return {
    search,
    categories,
    categoriesPending: categoriesQuery.isPending,
    categoryIds,
    geographies: geographiesQuery.data ?? [],
    objects: objectsQuery.data ?? [],
    objectsPending: objectsQuery.isPending,
    objectsFetching: objectsQuery.isFetching,
    objectsError: objectsQuery.isError,
  };
}
