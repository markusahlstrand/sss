import { eq, and, desc } from "drizzle-orm";
import { Database } from "../lib/database";
import { vendors, type Vendor, type NewVendor } from "../lib/database/schema";

export class VendorRepository {
  constructor(private db: Database) {}

  async create(vendor: NewVendor): Promise<Vendor> {
    const now = new Date();
    const vendorToInsert = {
      ...vendor,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(vendors).values(vendorToInsert);
    const result = await this.findById(vendor.vendorId);
    if (!result) {
      throw new Error(`Failed to create vendor: ${vendor.vendorId}`);
    }
    return result;
  }

  async findById(vendorId: string): Promise<Vendor | null> {
    const result = await this.db
      .select()
      .from(vendors)
      .where(eq(vendors.vendorId, vendorId))
      .limit(1);

    return result[0] || null;
  }

  async list(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data: Vendor[]; total: number }> {
    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(vendors)
        .orderBy(desc(vendors.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ count: vendors.vendorId }).from(vendors),
    ]);

    return {
      data,
      total: countResult.length,
    };
  }

  async update(
    vendorId: string,
    updates: Partial<Omit<Vendor, "vendorId" | "createdAt">>
  ): Promise<Vendor | null> {
    await this.db
      .update(vendors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendors.vendorId, vendorId));

    return await this.findById(vendorId);
  }

  async delete(vendorId: string): Promise<boolean> {
    const result = await this.db
      .delete(vendors)
      .where(eq(vendors.vendorId, vendorId));

    return (result as any).changes > 0;
  }

  async exists(vendorId: string): Promise<boolean> {
    const result = await this.db
      .select({ vendorId: vendors.vendorId })
      .from(vendors)
      .where(eq(vendors.vendorId, vendorId))
      .limit(1);

    return result.length > 0;
  }
}
