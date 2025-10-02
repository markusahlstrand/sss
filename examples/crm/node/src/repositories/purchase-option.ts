import { eq, and, desc, asc } from "drizzle-orm";
import { Database } from "../lib/database";
import { purchaseOptions, type PurchaseOption, type NewPurchaseOption } from "../lib/database/schema";

export class PurchaseOptionRepository {
  constructor(private db: Database) {}

  async create(vendorId: string, data: Omit<NewPurchaseOption, "vendorId">): Promise<PurchaseOption> {
    const newPurchaseOption: NewPurchaseOption = {
      ...data,
      vendorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.db.insert(purchaseOptions).values(newPurchaseOption);
    const created = await this.findById(vendorId, data.purchaseOptionId);
    if (!created) {
      throw new Error("Failed to create purchase option");
    }
    return created;
  }

  async findById(vendorId: string, purchaseOptionId: string): Promise<PurchaseOption | null> {
    const result = await this.db
      .select()
      .from(purchaseOptions)
      .where(and(eq(purchaseOptions.vendorId, vendorId), eq(purchaseOptions.purchaseOptionId, purchaseOptionId)))
      .limit(1);

    return result[0] || null;
  }

  async update(
    vendorId: string,
    purchaseOptionId: string,
    data: Partial<Omit<NewPurchaseOption, "vendorId" | "purchaseOptionId">>
  ): Promise<PurchaseOption | null> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await this.db
      .update(purchaseOptions)
      .set(updateData)
      .where(and(eq(purchaseOptions.vendorId, vendorId), eq(purchaseOptions.purchaseOptionId, purchaseOptionId)));

    return this.findById(vendorId, purchaseOptionId);
  }

  async delete(vendorId: string, purchaseOptionId: string): Promise<boolean> {
    const existing = await this.findById(vendorId, purchaseOptionId);
    if (!existing) {
      return false;
    }
    
    await this.db
      .delete(purchaseOptions)
      .where(and(eq(purchaseOptions.vendorId, vendorId), eq(purchaseOptions.purchaseOptionId, purchaseOptionId)));

    return true;
  }

  async list(
    vendorId: string,
    limit = 20,
    offset = 0
  ): Promise<{ data: PurchaseOption[]; total: number }> {
    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(purchaseOptions)
        .where(eq(purchaseOptions.vendorId, vendorId))
        .orderBy(desc(purchaseOptions.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: purchaseOptions.purchaseOptionId })
        .from(purchaseOptions)
        .where(eq(purchaseOptions.vendorId, vendorId)),
    ]);

    return {
      data,
      total: totalResult.length,
    };
  }

  async findByProduct(vendorId: string, productId: string): Promise<PurchaseOption[]> {
    return this.db
      .select()
      .from(purchaseOptions)
      .where(and(eq(purchaseOptions.vendorId, vendorId), eq(purchaseOptions.productId, productId)))
      .orderBy(asc(purchaseOptions.price));
  }
}