import { eq, and, desc } from "drizzle-orm";
import { Database } from "../lib/database";
import {
  products,
  type Product,
  type NewProduct,
} from "../lib/database/schema";

export class ProductRepository {
  constructor(private db: Database) {}

  async create(vendorId: string, product: Omit<NewProduct, 'vendorId' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const now = new Date();
    const productToInsert = {
      ...product,
      vendorId,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(products).values(productToInsert);
    const result = await this.findById(vendorId, product.productId);
    if (!result) {
      throw new Error(`Failed to create product: ${product.productId}`);
    }
    return result;
  }

  async findById(vendorId: string, productId: string): Promise<Product | null> {
    const result = await this.db
      .select()
      .from(products)
      .where(
        and(eq(products.vendorId, vendorId), eq(products.productId, productId))
      )
      .limit(1);

    return result[0] || null;
  }

  async list(limit: number = 20, offset: number = 0): Promise<{ data: Product[]; total: number }> {
    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(products)
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: products.productId })
        .from(products),
    ]);

    return {
      data,
      total: countResult.length,
    };
  }

  async listByVendor(
    vendorId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data: Product[]; total: number }> {
    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(products)
        .where(eq(products.vendorId, vendorId))
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: products.productId })
        .from(products)
        .where(eq(products.vendorId, vendorId)),
    ]);

    return {
      data,
      total: countResult.length,
    };
  }

  async update(
    vendorId: string,
    productId: string,
    updates: Partial<Omit<Product, "vendorId" | "productId" | "createdAt">>
  ): Promise<Product | null> {
    await this.db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(
        and(eq(products.vendorId, vendorId), eq(products.productId, productId))
      );

    return await this.findById(vendorId, productId);
  }

  async delete(vendorId: string, productId: string): Promise<boolean> {
    const result = await this.db
      .delete(products)
      .where(
        and(eq(products.vendorId, vendorId), eq(products.productId, productId))
      );

    return (result as any).changes > 0;
  }

  async exists(vendorId: string, productId: string): Promise<boolean> {
    const result = await this.db
      .select({ productId: products.productId })
      .from(products)
      .where(
        and(eq(products.vendorId, vendorId), eq(products.productId, productId))
      )
      .limit(1);

    return result.length > 0;
  }
}
