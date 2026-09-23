import { type Db, type User, users } from '@jarvis/db';
import { eq } from 'drizzle-orm';

export type SigninFields = {
  fullName?: string;
  email?: string;
  hierarchy?: string;
  displayName?: string;
};

export class UsersService {
  private readonly db: Db;

  constructor({ db }: { db: Db }) {
    this.db = db;
  }

  async createNewUserIfNecessary(userId: string, fields: SigninFields) {
    const { fullName, email, hierarchy, displayName } = fields;

    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (existingUser) {
      const updateData: Partial<typeof users.$inferInsert> = {};
      if (email && email !== existingUser.email) updateData.email = email;
      if (fullName && fullName !== existingUser.fullName)
        updateData.fullName = fullName;
      if (hierarchy && hierarchy !== existingUser.hierarchy)
        updateData.hierarchy = hierarchy;
      if (displayName && displayName !== existingUser.displayName)
        updateData.displayName = displayName;

      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date().toISOString();

        const [updatedUser] = await this.db
          .update(users)
          .set(updateData)
          .where(eq(users.id, existingUser.id))
          .returning();

        return { user: updatedUser, isNewUser: false, wasUpdated: true };
      }

      return { user: existingUser, isNewUser: false, wasUpdated: false };
    }

    const [newUser] = await this.db
      .insert(users)
      .values({
        userId,
        email: email ?? null,
        fullName: fullName ?? null,
        hierarchy: hierarchy ?? null,
        displayName: displayName ?? null,
      })
      .returning();

    return { user: newUser, isNewUser: true, wasUpdated: false };
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  }
}
