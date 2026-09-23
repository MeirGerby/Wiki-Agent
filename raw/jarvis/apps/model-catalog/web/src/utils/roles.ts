import type {
  PermissionSubjectType,
  Role,
} from '@jarvis/model-catalog-contract';

export const ROLE_LABELS: Record<Role, string> = {
  guest: 'אורח',
  viewer: 'צופה',
  admin: 'מנהל',
  superadmin: 'מנהל על',
};

export const SUBJECT_TYPE_LABELS: Record<PermissionSubjectType, string> = {
  user: 'משתמש',
  hierarchy: 'היררכיה',
};

export const SUBJECT_FIELD_LABELS: Record<PermissionSubjectType, string> = {
  user: 'מזהה משתמש',
  hierarchy: 'נתיב היררכיה',
};

export const SUBJECT_FIELD_PLACEHOLDERS: Record<PermissionSubjectType, string> =
  {
    user: 'user-id@unit-number',
    hierarchy: 'jarvis/531',
  };
