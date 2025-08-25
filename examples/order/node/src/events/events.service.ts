import { Injectable, Logger } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";

export interface CloudEvent {
  specversion: string;
  type: string;
  source: string;
  id: string;
  time: string;
  datacontenttype: string;
  data: any;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  async publishOrderCreated(orderData: any): Promise<void> {
    const event: CloudEvent = {
      specversion: "1.0",
      type: "order.created",
      source: "orders-service",
      id: uuidv4(),
      time: new Date().toISOString(),
      datacontenttype: "application/json",
      data: {
        id: orderData.id,
        customerId: orderData.customerId,
        items: orderData.items,
        status: orderData.status,
        createdAt: orderData.createdAt,
      },
    };

    // In a real implementation, this would publish to a message broker
    // For now, we'll just log the event
    this.logger.log(
      `Publishing event: ${JSON.stringify(event)}`,
      "EventsService"
    );

    // TODO: Implement actual event publishing (Kafka, RabbitMQ, etc.)
    // Example: await this.messageProducer.publish('order.created', event);
  }

  async publishOrderUpdated(
    orderData: any,
    previousStatus: string
  ): Promise<void> {
    const event: CloudEvent = {
      specversion: "1.0",
      type: "order.updated",
      source: "orders-service",
      id: uuidv4(),
      time: new Date().toISOString(),
      datacontenttype: "application/json",
      data: {
        id: orderData.id,
        status: orderData.status,
        previousStatus,
        updatedAt: orderData.updatedAt,
      },
    };

    // In a real implementation, this would publish to a message broker
    this.logger.log(
      `Publishing event: ${JSON.stringify(event)}`,
      "EventsService"
    );

    // TODO: Implement actual event publishing
    // Example: await this.messageProducer.publish('order.updated', event);
  }
}
