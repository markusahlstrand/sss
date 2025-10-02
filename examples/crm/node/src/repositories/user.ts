import { eq, and, desc, like } from "drizzle-orm";
import { Database } from "../lib/database";
import { users, type User, type NewUser } from "../lib/database/schema";

export class UserRepository {
  constructor(private db: Database) {}

  async create(vendorId: string, data: Omit<NewUser, "vendorId">): Promise<User> {
    const newUser: NewUser = {
      ...data,
      vendorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.db.insert(users).values(newUser);
    const created = await this.findById(vendorId, data.userId);
    if (!created) {
      throw new Error("Failed to create user");
    }
    return created;
  }

  async findById(vendorId: string, userId: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(and(eq(users.vendorId, vendorId), eq(users.userId, userId)))
      .limit(1);

    return result[0] || null;
  }

  async findByEmail(vendorId: string, email: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(and(eq(users.vendorId, vendorId), eq(users.email, email)))
      .limit(1);

    return result[0] || null;
  }

  async update(
    vendorId: string,
    userId: string,
    data: Partial<Omit<NewUser, "vendorId" | "userId">>
  ): Promise<User | null> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await this.db
      .update(users)
      .set(updateData)
      .where(and(eq(users.vendorId, vendorId), eq(users.userId, userId)));

    return this.findById(vendorId, userId);
  }

  async delete(vendorId: string, userId: string): Promise<boolean> {
    const existing = await this.findById(vendorId, userId);
    if (!existing) {
      return false;
    }
    
    await this.db
      .delete(users)
      .where(and(eq(users.vendorId, vendorId), eq(users.userId, userId)));

    return true;
  }

  async list(
    vendorId: string,
    limit = 20,
    offset = 0,
    emailFilter?: string
  ): Promise<{ data: User[]; total: number }> {
    const baseWhere = eq(users.vendorId, vendorId);
    const whereClause = emailFilter 
      ? and(baseWhere, like(users.email, `%${emailFilter}%`))
      : baseWhere;

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: users.userId })
        .from(users)
        .where(whereClause),
    ]);

    return {
      data,
      total: totalResult.length,
    };
  }
}