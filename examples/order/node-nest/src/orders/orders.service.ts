import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto, OrderStatus } from "./dto/update-order.dto";
import { Order } from "./entities/order.entity";
import { EventsService } from "../events/events.service";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private orders: Map<string, Order> = new Map();

  constructor(private eventsService: EventsService) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const orderId = uuidv4();
    const now = new Date();

    const order: Order = {
      id: orderId,
      status: OrderStatus.PENDING,
      customerId: createOrderDto.customerId,
      items: createOrderDto.items,
      createdAt: now,
      updatedAt: now,
    };

    this.orders.set(orderId, order);

    this.logger.log(
      `Order created: ${orderId} for customer: ${createOrderDto.customerId}`,
      "OrdersService"
    );

    // Publish order created event
    await this.eventsService.publishOrderCreated(order);

    return order;
  }

  async findAll(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data: Order[]; total: number; limit: number; offset: number }> {
    const allOrders = Array.from(this.orders.values());
    const data = allOrders.slice(offset, offset + limit);

    return {
      data,
      total: allOrders.length,
      limit,
      offset,
    };
  }

  async findOne(id: string): Promise<Order> {
    const order = this.orders.get(id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    const previousStatus = order.status;

    order.status = updateOrderDto.status;
    order.updatedAt = new Date();

    this.orders.set(id, order);

    this.logger.log(
      `Order ${id} status updated from ${previousStatus} to ${updateOrderDto.status}`,
      "OrdersService"
    );

    // Publish order updated event
    await this.eventsService.publishOrderUpdated(order, previousStatus);

    return order;
  }

  // For testing purposes - this would normally be handled by a database
  async clear(): Promise<void> {
    this.orders.clear();
  }
}
