import { isRoleAtLeast } from '@jarvis/model-catalog-contract';
import { Button } from '@jarvis/ui/components/ui/button';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import chevronRightIcon from '../assets/chevron-right.svg';
import { Icon } from '../components/icon';
import { PermissionsPanel } from '../components/permissions-panel';

export const Route = createFileRoute('/permissions')({
  beforeLoad: ({ context }) => {
    const role = context.auth.user?.role;
    if (!role || !isRoleAtLeast(role, 'admin')) {
      throw redirect({ to: '/' });
    }
  },
  component: PermissionsPage,
});

function PermissionsPage() {
  return (
    <div className="flex h-svh flex-col gap-4 overflow-hidden bg-background p-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon-sm" asChild>
          <Link to="/">
            <Icon src={chevronRightIcon} label="חזרה לקטלוג" />
          </Link>
        </Button>
        <h1 className="text-lg font-bold">ניהול הרשאות</h1>
      </div>

      <PermissionsPanel />
    </div>
  );
}
