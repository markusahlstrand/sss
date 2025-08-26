import { HTTPException } from 'hono/http-exception';
import { v4 as uuidv4 } from 'uuid';
import type { Order, CreateOrder, UpdateOrder, Pagination } from '../schemas';
import { EventsService } from './events';
import { logger } from '../middleware/logger';

export class OrdersService {
  private orders: Order[] = [];
  private eventsService = new EventsService();

  async findAll(pagination: Pagination): Promise<Order[]> {
    const { limit, offset } = pagination;
    const result = this.orders.slice(offset, offset + limit);
    
    logger.info('Retrieved orders', {
      count: result.length,
      total: this.orders.length,
      limit,
      offset,
    });

    return result;
  }

  async findById(id: string): Promise<Order> {
    const order = this.orders.find((o) => o.id === id);
    
    if (!order) {
      const problem = {
        type: 'not_found',
        title: 'Not Found',
        status: 404,
        detail: `Order with id ${id} not found`,
        instance: `/orders/${id}`,
      };

      throw new HTTPException(404, {
        message: JSON.stringify(problem),
      });
    }

    logger.info('Retrieved order', {
      orderId: order.id,
      status: order.status,
    });

    return order;
  }

  async create(data: CreateOrder): Promise<Order> {
    const now = new Date().toISOString();
    
    const order: Order = {
      id: uuidv4(),
      customerId: data.customerId,
      items: data.items,
      totalAmount: data.totalAmount,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    this.orders.push(order);

    logger.info('Created order', {
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
    const order = await this.findById(id); // This will throw if not found
    const previousStatus = order.status;
    
    // Update order
    order.status = data.status;
    order.updatedAt = new Date().toISOString();

    logger.info('Updated order', {
      orderId: order.id,
      previousStatus,
      newStatus: order.status,
    });

    // Publish order updated event
    await this.eventsService.publishOrderUpdated(order, previousStatus);

    return order;
  }

  async delete(id: string): Promise<void> {
    const index = this.orders.findIndex((o) => o.id === id);
    
    if (index === -1) {
      const problem = {
        type: 'not_found',
        title: 'Not Found',
        status: 404,
        detail: `Order with id ${id} not found`,
        instance: `/orders/${id}`,
      };

      throw new HTTPException(404, {
        message: JSON.stringify(problem),
      });
    }

    this.orders.splice(index, 1);

    logger.info('Deleted order', {
      orderId: id,
    });
  }
}
