import {
  isRoleAbove,
  PermissionSubjectType,
  Role,
} from '@jarvis/model-catalog-contract';
import { Button } from '@jarvis/ui/components/ui/button';
import { Card } from '@jarvis/ui/components/ui/card';
import { Input } from '@jarvis/ui/components/ui/input';
import { Label } from '@jarvis/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jarvis/ui/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import closeIcon from '../assets/close.svg';
import { useAuth } from '../contexts/auth-context';
import { logInfo } from '../logging/log';
import { useTRPC } from '../trpc';
import {
  ROLE_LABELS,
  SUBJECT_FIELD_LABELS,
  SUBJECT_FIELD_PLACEHOLDERS,
  SUBJECT_TYPE_LABELS,
} from '../utils/roles';
import { Icon } from './icon';

export function PermissionsPanel() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const canManageRole = (candidate: Role) =>
    user?.role === 'superadmin' || !isRoleAbove(candidate, 'viewer');

  const grantableRoles = Role.options.filter(canManageRole);

  const [subjectType, setSubjectType] = useState<PermissionSubjectType>('user');
  const [subject, setSubject] = useState('');
  const [role, setRole] = useState<Role>('viewer');
  const [formError, setFormError] = useState('');

  const listQuery = useQuery(trpc.permissions.list.queryOptions());

  const invalidateList = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.permissions.list.queryKey(),
    });

  const setPermission = useMutation(
    trpc.permissions.set.mutationOptions({
      onSuccess: (result) => {
        logInfo({
          event: 'permission.set',
          message: 'Permission set',
          subjectType: result.subjectType,
          role: result.role,
        });
        setSubject('');
        setFormError('');
        invalidateList();
      },
    }),
  );

  const removePermission = useMutation(
    trpc.permissions.remove.mutationOptions({
      onSuccess: () => {
        logInfo({ event: 'permission.removed', message: 'Permission removed' });
        invalidateList();
      },
    }),
  );

  function handleSubjectTypeChange(value: string) {
    const parsed = PermissionSubjectType.safeParse(value);
    if (!parsed.success) return;

    setSubjectType(parsed.data);
    setFormError('');
  }

  function handleRoleChange(value: string) {
    const parsed = Role.safeParse(value);
    if (parsed.success) setRole(parsed.data);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmed = subject.trim();

    if (trimmed === '') {
      setFormError('יש להזין מזהה');
      return;
    }

    setFormError('');
    setPermission.mutate({ subjectType, subject: trimmed, role });
  }

  const rows = listQuery.data ?? [];
  const submitError = formError || setPermission.error?.message || '';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Card className="border-line-subtle p-4 shadow-none">
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-end gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="permission-subject-type">סוג</Label>
            <Select value={subjectType} onValueChange={handleSubjectTypeChange}>
              <SelectTrigger id="permission-subject-type" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PermissionSubjectType.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {SUBJECT_TYPE_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="permission-subject">
              {SUBJECT_FIELD_LABELS[subjectType]}
            </Label>
            <Input
              id="permission-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder={SUBJECT_FIELD_PLACEHOLDERS[subjectType]}
              className="w-72"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="permission-role">הרשאה</Label>
            <Select value={role} onValueChange={handleRoleChange}>
              <SelectTrigger id="permission-role" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {grantableRoles.map((option) => (
                  <SelectItem key={option} value={option}>
                    {ROLE_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={setPermission.isPending}>
            שמור הרשאה
          </Button>
        </form>

        {submitError !== '' && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {submitError}
          </p>
        )}
      </Card>

      <Card className="min-h-0 flex-1 overflow-auto border-line-subtle p-4 shadow-none">
        {listQuery.isPending && <p className="text-sm">טוען הרשאות...</p>}

        {listQuery.isError && (
          <p role="alert" className="text-sm text-destructive">
            טעינת ההרשאות כשלה.
          </p>
        )}

        {!listQuery.isPending && !listQuery.isError && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">אין הרשאות מוגדרות.</p>
        )}

        {rows.length > 0 && (
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="p-2 font-medium">סוג</th>
                <th className="p-2 font-medium">מזהה</th>
                <th className="p-2 font-medium">הרשאה</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((permission) => (
                <tr
                  key={`${permission.subjectType}:${permission.subject}`}
                  className="border-t border-line-subtle"
                >
                  <td className="p-2">
                    {SUBJECT_TYPE_LABELS[permission.subjectType]}
                  </td>
                  <td className="p-2 font-mono">{permission.subject}</td>
                  <td className="p-2">{ROLE_LABELS[permission.role]}</td>
                  <td className="p-2 text-left">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={
                        removePermission.isPending ||
                        !canManageRole(permission.role)
                      }
                      onClick={() =>
                        removePermission.mutate({
                          subjectType: permission.subjectType,
                          subject: permission.subject,
                        })
                      }
                    >
                      <Icon src={closeIcon} size={12} label="הסר הרשאה" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {removePermission.error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {removePermission.error.message}
          </p>
        )}
      </Card>
    </div>
  );
}
