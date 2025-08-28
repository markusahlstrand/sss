import { HTTPException } from "hono/http-exception";
import type { Order, CreateOrder, UpdateOrder, Pagination } from "../schemas";
import { OrderRepository, type OrderWithItems } from "../db/repository";
import { EventsService } from "./events";
import { logger } from "../middleware/logger";

export class OrdersService {
  private orderRepository = new OrderRepository();
  private eventsService = new EventsService();

  async findAll(pagination: Pagination): Promise<Order[]> {
    const { limit, offset } = pagination;
    const ordersWithItems = await this.orderRepository.findAll(limit, offset);

    // Convert database format to API format
    const result = ordersWithItems.map(this.convertToApiFormat.bind(this));

    logger.info("Retrieved orders", {
      count: result.length,
      limit,
      offset,
    });

    return result;
  }

  async findById(id: string): Promise<Order> {
    const orderWithItems = await this.orderRepository.findById(id);

    if (!orderWithItems) {
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

    const order = this.convertToApiFormat(orderWithItems);

    logger.info("Retrieved order", {
      orderId: order.id,
      status: order.status,
    });

    return order;
  }

  async create(data: CreateOrder): Promise<Order> {
    const orderWithItems = await this.orderRepository.create(data);
    const order = this.convertToApiFormat(orderWithItems);

    logger.info("Created order", {
      orderId: order.id,
      customerId: order.customerId,
      totalAmount: order.totalAmount,
      itemCount: order.items.length,
    });

    // Publish order created event
    await this.eventsService.publishOrderCreated(order);

    return order;
  }

  async update(id: string, data: UpdateOrder): Promise<Order> {
    const orderWithItems = await this.orderRepository.update(id, data.status);
    const order = this.convertToApiFormat(orderWithItems);

    logger.info("Updated order", {
      orderId: order.id,
      newStatus: order.status,
    });

    // Publish order updated event
    await this.eventsService.publishOrderUpdated(order, data.status);

    return order;
  }

  async delete(id: string): Promise<void> {
    await this.orderRepository.delete(id);

    logger.info("Deleted order", {
      orderId: id,
    });
  }

  // Convert database format to API format
  private convertToApiFormat(orderWithItems: OrderWithItems): Order {
    return {
      id: orderWithItems.id,
      customerId: orderWithItems.customerId,
      items: orderWithItems.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: orderWithItems.totalAmount,
      status: orderWithItems.status as
        | "pending"
        | "confirmed"
        | "shipped"
        | "delivered",
      createdAt: orderWithItems.createdAt,
      updatedAt: orderWithItems.updatedAt,
    };
  }
}
