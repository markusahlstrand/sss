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

export class EventService {
  private source: string;

  constructor(source = "crm-service") {
    this.source = source;
  }

  private createEvent(type: string, data: any): CloudEvent {
    return {
      specversion: "1.0",
      type,
      source: this.source,
      id: uuidv4(),
      time: new Date().toISOString(),
      datacontenttype: "application/json",
      data,
    };
  }

  async publishVendorCreated(data: { vendorId: string; name: string }) {
    const event = this.createEvent("vendor.created", data);
    await this.publish(event);
  }

  async publishVendorUpdated(data: { vendorId: string; name: string }) {
    const event = this.createEvent("vendor.updated", data);
    await this.publish(event);
  }

  async publishProductCreated(data: {
    vendorId: string;
    productId: string;
    type: string;
  }) {
    const event = this.createEvent("product.created", data);
    await this.publish(event);
  }

  async publishProductUpdated(data: {
    vendorId: string;
    productId: string;
    type: string;
  }) {
    const event = this.createEvent("product.updated", data);
    await this.publish(event);
  }

  async publishBundleItemAdded(data: {
    vendorId: string;
    productId: string;
    childProductId: string;
  }) {
    const event = this.createEvent("bundleItem.added", data);
    await this.publish(event);
  }

  async publishContractCreated(data: {
    vendorId: string;
    contractId: string;
    productId: string;
  }) {
    const event = this.createEvent("contract.created", data);
    await this.publish(event);
  }

  async publishPurchaseOptionCreated(data: {
    vendorId: string;
    purchaseOptionId: string;
    productId: string;
  }) {
    const event = this.createEvent("purchaseOption.created", data);
    await this.publish(event);
  }

  async publishUserCreated(data: {
    vendorId: string;
    userId: string;
    email: string;
  }) {
    const event = this.createEvent("user.created", data);
    await this.publish(event);
  }

  async publishEntitlementGranted(data: {
    vendorId: string;
    entitlementId: string;
    userId: string;
    productId: string;
    purchaseOptionId: string;
  }) {
    const event = this.createEvent("entitlement.granted", data);
    await this.publish(event);
  }

  async publishEntitlementRevoked(data: {
    vendorId: string;
    entitlementId: string;
  }) {
    const event = this.createEvent("entitlement.revoked", data);
    await this.publish(event);
  }

  private async publish(event: CloudEvent) {
    // In development, log to console
    // In production, this would publish to a message broker (e.g., Kafka, RabbitMQ, AWS EventBridge)
    console.log("📢 Event Published:", JSON.stringify(event, null, 2));

    // For Cloudflare Workers, you could send to:
    // - Cloudflare Queues
    // - External webhook
    // - Analytics engine
    // - KV store for event log

    // Example: Store in KV for audit trail
    // if (this.kv) {
    //   await this.kv.put(`events:${event.id}`, JSON.stringify(event));
    // }
  }
}

// Export singleton instance
export const eventService = new EventService();
