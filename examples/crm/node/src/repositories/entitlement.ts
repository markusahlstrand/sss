import { eq, and, desc, asc } from "drizzle-orm";
import { Database } from "../lib/database";
import { entitlements, type Entitlement, type NewEntitlement } from "../lib/database/schema";

export class EntitlementRepository {
  constructor(private db: Database) {}

  async create(vendorId: string, data: Omit<NewEntitlement, "vendorId">): Promise<Entitlement> {
    const newEntitlement: NewEntitlement = {
      ...data,
      vendorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.db.insert(entitlements).values(newEntitlement);
    const created = await this.findById(vendorId, data.entitlementId);
    if (!created) {
      throw new Error("Failed to create entitlement");
    }
    return created;
  }

  async findById(vendorId: string, entitlementId: string): Promise<Entitlement | null> {
    const result = await this.db
      .select()
      .from(entitlements)
      .where(and(eq(entitlements.vendorId, vendorId), eq(entitlements.entitlementId, entitlementId)))
      .limit(1);

    return result[0] || null;
  }

  async update(
    vendorId: string,
    entitlementId: string,
    data: Partial<Omit<NewEntitlement, "vendorId" | "entitlementId">>
  ): Promise<Entitlement | null> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await this.db
      .update(entitlements)
      .set(updateData)
      .where(and(eq(entitlements.vendorId, vendorId), eq(entitlements.entitlementId, entitlementId)));

    return this.findById(vendorId, entitlementId);
  }

  async delete(vendorId: string, entitlementId: string): Promise<boolean> {
    const existing = await this.findById(vendorId, entitlementId);
    if (!existing) {
      return false;
    }
    
    await this.db
      .delete(entitlements)
      .where(and(eq(entitlements.vendorId, vendorId), eq(entitlements.entitlementId, entitlementId)));

    return true;
  }

  async list(
    vendorId: string,
    limit = 20,
    offset = 0,
    status?: string,
    userId?: string
  ): Promise<{ data: Entitlement[]; total: number }> {
    const conditions = [eq(entitlements.vendorId, vendorId)];
    
    if (status) {
      conditions.push(eq(entitlements.status, status as any));
    }
    
    if (userId) {
      conditions.push(eq(entitlements.userId, userId));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(entitlements)
        .where(whereClause)
        .orderBy(desc(entitlements.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: entitlements.entitlementId })
        .from(entitlements)
        .where(whereClause),
    ]);

    return {
      data,
      total: totalResult.length,
    };
  }

  async findByUser(vendorId: string, userId: string): Promise<Entitlement[]> {
    return this.db
      .select()
      .from(entitlements)
      .where(and(eq(entitlements.vendorId, vendorId), eq(entitlements.userId, userId)))
      .orderBy(desc(entitlements.createdAt));
  }

  async findByProduct(vendorId: string, productId: string): Promise<Entitlement[]> {
    return this.db
      .select()
      .from(entitlements)
      .where(and(eq(entitlements.vendorId, vendorId), eq(entitlements.productId, productId)))
      .orderBy(desc(entitlements.createdAt));
  }

  async findActiveEntitlements(vendorId: string, userId: string): Promise<Entitlement[]> {
    return this.db
      .select()
      .from(entitlements)
      .where(and(
        eq(entitlements.vendorId, vendorId),
        eq(entitlements.userId, userId),
        eq(entitlements.status, "active")
      ))
      .orderBy(desc(entitlements.createdAt));
  }
}