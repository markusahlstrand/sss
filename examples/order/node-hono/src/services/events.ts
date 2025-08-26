import { CloudEvent } from 'cloudevents';
import { logger } from '../middleware/logger';
import type { Order } from '../schemas';

export class EventsService {
  private readonly source = 'orders-service';
  private readonly version = '1.0.0';

  async publishOrderCreated(order: Order): Promise<void> {
    const event = new CloudEvent({
      type: 'order.created',
      source: this.source,
      id: crypto.randomUUID(),
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      specversion: '1.0',
      data: {
        id: order.id,
        customerId: order.customerId,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
      },
    });

    // In a real implementation, you would publish this to a message broker
    // For this example, we'll just log it
    logger.info('Publishing event', {
      type: event.type,
      id: event.id,
      source: event.source,
      data: event.data,
    });

    // Simulate async publishing
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  async publishOrderUpdated(order: Order, previousStatus: string): Promise<void> {
    const event = new CloudEvent({
      type: 'order.updated',
      source: this.source,
      id: crypto.randomUUID(),
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      specversion: '1.0',
      data: {
        id: order.id,
        status: order.status,
        previousStatus,
        updatedAt: order.updatedAt,
      },
    });

    logger.info('Publishing event', {
      type: event.type,
      id: event.id,
      source: event.source,
      data: event.data,
    });

    // Simulate async publishing
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
