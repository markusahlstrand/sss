import { eq, and, desc, asc } from "drizzle-orm";
import { Database } from "../lib/database";
import { contracts, type Contract, type NewContract } from "../lib/database/schema";

export class ContractRepository {
  constructor(private db: Database) {}

  async create(vendorId: string, data: Omit<NewContract, "vendorId">): Promise<Contract> {
    const newContract: NewContract = {
      ...data,
      vendorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.db.insert(contracts).values(newContract);
    const created = await this.findById(vendorId, data.contractId);
    if (!created) {
      throw new Error("Failed to create contract");
    }
    return created;
  }

  async findById(vendorId: string, contractId: string): Promise<Contract | null> {
    const result = await this.db
      .select()
      .from(contracts)
      .where(and(eq(contracts.vendorId, vendorId), eq(contracts.contractId, contractId)))
      .limit(1);

    return result[0] || null;
  }

  async update(
    vendorId: string,
    contractId: string,
    data: Partial<Omit<NewContract, "vendorId" | "contractId">>
  ): Promise<Contract | null> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await this.db
      .update(contracts)
      .set(updateData)
      .where(and(eq(contracts.vendorId, vendorId), eq(contracts.contractId, contractId)));

    return this.findById(vendorId, contractId);
  }

  async delete(vendorId: string, contractId: string): Promise<boolean> {
    const existing = await this.findById(vendorId, contractId);
    if (!existing) {
      return false;
    }
    
    await this.db
      .delete(contracts)
      .where(and(eq(contracts.vendorId, vendorId), eq(contracts.contractId, contractId)));

    return true;
  }

  async list(
    vendorId: string,
    limit = 20,
    offset = 0
  ): Promise<{ data: Contract[]; total: number }> {
    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(contracts)
        .where(eq(contracts.vendorId, vendorId))
        .orderBy(desc(contracts.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: contracts.contractId })
        .from(contracts)
        .where(eq(contracts.vendorId, vendorId)),
    ]);

    return {
      data,
      total: totalResult.length,
    };
  }

  async findByProduct(vendorId: string, productId: string): Promise<Contract[]> {
    return this.db
      .select()
      .from(contracts)
      .where(and(eq(contracts.vendorId, vendorId), eq(contracts.productId, productId)))
      .orderBy(desc(contracts.createdAt));
  }
}