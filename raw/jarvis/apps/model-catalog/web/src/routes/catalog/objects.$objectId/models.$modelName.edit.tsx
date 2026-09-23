import { isRoleAtLeast } from '@jarvis/model-catalog-contract';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/catalog/objects/$objectId/models/$modelName/edit',
)({
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
  component: () => null,
});
