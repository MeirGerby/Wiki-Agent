import { isRoleAtLeast } from '@jarvis/model-catalog-contract';
import { ErrorComponent } from '@jarvis/ui/components/error-component';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Outlet, createFileRoute, useParams } from '@tanstack/react-router';
import { useEffect, useMemo } from 'react';
import { useCatalogData } from '../../../catalog/use-catalog-data';
import { TrainingModelsProvider } from '../../../components/model-card/training/training-models-context';
import { ModelPanel } from '../../../components/model-panel';
import { useAuth } from '../../../contexts/auth-context';
import { logInfo } from '../../../logging/log';
import { useTRPC } from '../../../trpc';

export const Route = createFileRoute('/catalog/objects/$objectId')({
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: async ({ context: { queryClient, trpc }, params, deps }) => {
    await queryClient.ensureQueryData(
      trpc.catalog.object.queryOptions({
        englishName: params.objectId,
        query: deps.q ?? '',
      }),
    );
  },
  errorComponent: () => (
    <ErrorComponent
      title="האובייקט לא נמצא"
      message="ייתכן שהקישור שגוי או שהאובייקט הוסר."
    />
  ),
  component: ObjectRoute,
});

function ObjectRoute() {
  const { objectId } = Route.useParams();
  const trpc = useTRPC();
  const { q } = Route.useLoaderDeps();
  const { objects, search } = useCatalogData();
  const { data: models } = useSuspenseQuery(
    trpc.catalog.object.queryOptions({
      englishName: objectId,
      query: q ?? '',
    }),
  );
  const { user } = useAuth();
  const editingModelId = useParams({
    strict: false,
    select: (params) => params.modelName,
  });

  const title = objects.find(
    (object) => object.englishName === objectId,
  )?.hebrewName;
  const isSearching = search.q !== undefined;
  const canEdit = user != null && isRoleAtLeast(user.role, 'admin');

  const realModelEnglishNames = useMemo(
    () => new Set(models.map((model) => model.englishName)),
    [models],
  );

  useEffect(() => {
    logInfo({ event: 'object.opened', message: 'Object opened', objectId });
  }, [objectId]);

  return (
    <>
      <TrainingModelsProvider
        objectId={objectId}
        query={q ?? ''}
        enabled={canEdit}
        realModelEnglishNames={realModelEnglishNames}
      >
        <ModelPanel
          objectId={objectId}
          title={title}
          models={models}
          editingModelId={editingModelId}
          isSearching={isSearching}
          canEdit={canEdit}
        />
      </TrainingModelsProvider>
      <Outlet />
    </>
  );
}
