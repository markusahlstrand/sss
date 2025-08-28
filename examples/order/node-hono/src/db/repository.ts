import { eq } from "drizzle-orm";
import { db } from "../db";
import { orders, orderItems } from "./schema";
import type {
  Order as DbOrder,
  NewOrder,
  OrderItem as DbOrderItem,
  NewOrderItem,
} from "./schema";
import { v4 as uuidv4 } from "uuid";
import type { CreateOrder, DatabaseOrderItem } from "../schemas";
import { HTTPException } from "hono/http-exception";

export interface OrderWithItems {
  id: string;
  customerId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: DatabaseOrderItem[];
}

export class OrderRepository {
  async findById(id: string): Promise<OrderWithItems | null> {
    const order = await db.select().from(orders).where(eq(orders.id, id)).get();

    if (!order) {
      return null;
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id))
      .all();

    return this.mapDbOrderToApiFormat(order, items);
  }

  async findAll(limit: number, offset: number): Promise<OrderWithItems[]> {
    const ordersList = await db
      .select()
      .from(orders)
      .limit(limit)
      .offset(offset)
      .all();

    const ordersWithItems: OrderWithItems[] = [];

    for (const order of ordersList) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id))
        .all();
      ordersWithItems.push(this.mapDbOrderToApiFormat(order, items));
    }

    return ordersWithItems;
  }

  async create(orderData: CreateOrder): Promise<OrderWithItems> {
    const orderId = uuidv4();
    const now = new Date().toISOString();

    return db.transaction(async (tx) => {
      // Insert order
      const newOrder: NewOrder = {
        id: orderId,
        customerId: orderData.customerId,
        totalAmount: orderData.totalAmount,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };

      await tx.insert(orders).values(newOrder);

      // Insert order items
      const newItems: NewOrderItem[] = orderData.items.map((item) => ({
        id: uuidv4(),
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));

      await tx.insert(orderItems).values(newItems);

      // Return the created order with items
      const createdOrder = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .get();
      const createdItems = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId))
        .all();

      if (!createdOrder) {
        throw new Error("Failed to create order");
      }

      return this.mapDbOrderToApiFormat(createdOrder, createdItems);
    });
  }

  async update(id: string, status: string): Promise<OrderWithItems> {
    const existingOrder = await this.findById(id);

    if (!existingOrder) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: `Order with id ${id} not found`,
        instance: `/orders/${id}`,
      };

      throw new HTTPException(404, {
        message: JSON.stringify(problem),
      });
    }

    const now = new Date().toISOString();

    await db
      .update(orders)
      .set({ status, updatedAt: now })
      .where(eq(orders.id, id));

    // Return updated order
    const updatedOrder = await this.findById(id);

    if (!updatedOrder) {
      throw new Error("Failed to retrieve updated order");
    }

    return updatedOrder;
  }

  async delete(id: string): Promise<void> {
    const existingOrder = await this.findById(id);

    if (!existingOrder) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: `Order with id ${id} not found`,
        instance: `/orders/${id}`,
      };

      throw new HTTPException(404, {
        message: JSON.stringify(problem),
      });
    }

    await db.transaction(async (tx) => {
      // Delete order items first (foreign key constraint)
      await tx.delete(orderItems).where(eq(orderItems.orderId, id));

      // Delete order
      await tx.delete(orders).where(eq(orders.id, id));
    });
  }

  async count(): Promise<number> {
    const result = await db.select().from(orders).all();
    return result.length;
  }

  // Map database format to API format
  private mapDbOrderToApiFormat(
    order: DbOrder,
    items: DbOrderItem[]
  ): OrderWithItems {
    return {
      id: order.id,
      customerId: order.customerId,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
    };
  }
}
