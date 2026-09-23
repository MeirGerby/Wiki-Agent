import {
  isRoleAtLeast,
  type TaggingClass,
} from '@jarvis/model-catalog-contract';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { CreateModelModal } from '../../../components/model-form/create-model-modal';
import { useTRPC } from '../../../trpc';

const EMPTY_TAGGING_CLASSES: readonly TaggingClass[] = [];

export const Route = createFileRoute('/catalog/objects/$objectId/models/new')({
  beforeLoad: ({ context, params }) => {
    const role = context.auth.user?.role;

    if (!role || !isRoleAtLeast(role, 'admin')) {
      throw redirect({
        to: '/catalog/objects/$objectId',
        params: { objectId: params.objectId },
        search: (prev) => prev,
      });
    }
  },
  loader: ({ context: { queryClient, trpc } }) => {
    void queryClient.prefetchQuery(trpc.catalog.sensorGroups.queryOptions());
    void queryClient.prefetchQuery(trpc.catalog.geographies.queryOptions());
    void queryClient.prefetchQuery(trpc.catalog.taggingClasses.queryOptions());
  },
  component: CreateModelRoute,
});

function CreateModelRoute() {
  const { objectId } = Route.useParams();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const sensorGroups =
    useQuery(trpc.catalog.sensorGroups.queryOptions()).data ?? [];
  const geographies =
    useQuery(trpc.catalog.geographies.queryOptions()).data ?? [];
  const taggingClassesQuery = useQuery(
    trpc.catalog.taggingClasses.queryOptions(),
  );
  const taggingClasses = taggingClassesQuery.data ?? EMPTY_TAGGING_CLASSES;

  function close() {
    navigate({
      to: '/catalog/objects/$objectId',
      params: { objectId },
      search: (prev) => prev,
    });
  }

  return (
    <CreateModelModal
      objectId={objectId}
      sensorGroups={sensorGroups}
      geographies={geographies}
      taggingClasses={taggingClasses}
      taggingClassesLoading={taggingClassesQuery.isPending}
      taggingClassesFailed={taggingClassesQuery.isError}
      onClose={close}
    />
  );
}
