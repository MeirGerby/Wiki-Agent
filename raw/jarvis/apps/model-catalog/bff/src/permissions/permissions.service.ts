import { type Db, permissions, users } from '@jarvis/db';
import {
  DEFAULT_ROLE,
  hierarchyPathPrefixes,
  isRoleAbove,
  type Permission,
  type RemovePermissionInput,
  Role,
  type SetPermissionInput,
} from '@jarvis/model-catalog-contract';
import { TRPCError } from '@trpc/server';
import { and, eq, inArray, or } from 'drizzle-orm';

function toRole(value: string): Role {
  const parsed = Role.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_ROLE;
}

export class PermissionsService {
  private readonly db: Db;

  constructor({ db }: { db: Db }) {
    this.db = db;
  }

  private assertCanManageRole(actorRole: Role, role: Role) {
    if (actorRole !== 'superadmin' && isRoleAbove(role, 'viewer')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only a superadmin can manage a role above viewer',
      });
    }
  }

  async resolveRole(userId: string, hierarchy: string | null): Promise<Role> {
    const prefixes = hierarchy ? hierarchyPathPrefixes(hierarchy) : [];

    const rows = await this.db
      .select()
      .from(permissions)
      .where(
        or(
          and(
            eq(permissions.subjectType, 'user'),
            eq(permissions.subject, userId),
          ),
          prefixes.length > 0
            ? and(
                eq(permissions.subjectType, 'hierarchy'),
                inArray(permissions.subject, prefixes),
              )
            : undefined,
        ),
      );

    const userGrant = rows.find(
      (row) => row.subjectType === 'user' && row.subject === userId,
    );
    if (userGrant) return toRole(userGrant.role);

    const deepest = rows
      .filter(
        (row) =>
          row.subjectType === 'hierarchy' && prefixes.includes(row.subject),
      )
      .sort((a, b) => b.subject.length - a.subject.length)[0];

    return deepest ? toRole(deepest.role) : DEFAULT_ROLE;
  }

  async list(): Promise<Permission[]> {
    const rows = await this.db
      .select()
      .from(permissions)
      .orderBy(permissions.subjectType, permissions.subject);

    return rows.map((row) => ({
      subjectType: row.subjectType === 'hierarchy' ? 'hierarchy' : 'user',
      subject: row.subject,
      role: toRole(row.role),
    }));
  }

  async set(actorUserId: string, actorRole: Role, input: SetPermissionInput) {
    this.assertCanManageRole(actorRole, input.role);

    if (input.subjectType === 'user') {
      if (input.subject === actorUserId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You cannot change your own permission',
        });
      }

      const [existingUser] = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.userId, input.subject))
        .limit(1);

      if (!existingUser) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }
    }

    if (actorRole !== 'superadmin') {
      const [current] = await this.db
        .select()
        .from(permissions)
        .where(
          and(
            eq(permissions.subjectType, input.subjectType),
            eq(permissions.subject, input.subject),
          ),
        )
        .limit(1);

      if (current) this.assertCanManageRole(actorRole, toRole(current.role));
    }

    const [row] = await this.db
      .insert(permissions)
      .values({
        subjectType: input.subjectType,
        subject: input.subject,
        role: input.role,
      })
      .onConflictDoUpdate({
        target: [permissions.subjectType, permissions.subject],
        set: { role: input.role, updatedAt: new Date().toISOString() },
      })
      .returning();

    return {
      subjectType: input.subjectType,
      subject: row.subject,
      role: toRole(row.role),
    };
  }

  async remove(
    actorUserId: string,
    actorRole: Role,
    { subjectType, subject }: RemovePermissionInput,
  ) {
    const target = and(
      eq(permissions.subjectType, subjectType),
      eq(permissions.subject, subject),
    );

    const [row] = await this.db
      .select()
      .from(permissions)
      .where(target)
      .limit(1);

    if (!row) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Permission not found',
      });
    }

    if (subjectType === 'user' && subject === actorUserId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You cannot remove your own permission',
      });
    }

    this.assertCanManageRole(actorRole, toRole(row.role));

    await this.db.delete(permissions).where(target);

    return { subjectType, subject };
  }
}
