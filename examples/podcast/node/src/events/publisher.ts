import { CloudEvent as CE } from "cloudevents";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../telemetry";
import { PodcastEventType } from "./types";

export class EventPublisher {
  private source: string;

  constructor() {
    this.source = process.env.SERVICE_NAME || "podcast-service";
  }

  async publish(
    eventType: PodcastEventType,
    data: any,
    subject?: string
  ): Promise<void> {
    const event = new CE({
      specversion: "1.0",
      type: eventType,
      source: this.source,
      id: uuidv4(),
      time: new Date().toISOString(),
      data,
      subject,
    });

    // For development, log events. In production, send to message broker
    logger.info("Event published", {
      eventType,
      eventId: event.id,
      subject,
      data,
    });

    // TODO: In production, publish to message broker (e.g., Kafka, RabbitMQ, etc.)
    // Example:
    // await this.messageProducer.send({
    //   topic: eventType,
    //   messages: [{
    //     value: JSON.stringify(event),
    //   }],
    // });
  }
}
