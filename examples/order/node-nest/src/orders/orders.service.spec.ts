import { Test, TestingModule } from "@nestjs/testing";
import { OrdersService } from "./orders.service";
import { EventsService } from "../events/events.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderStatus } from "./dto/update-order.dto";

describe("OrdersService", () => {
  let service: OrdersService;
  let eventsService: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: EventsService,
          useValue: {
            publishOrderCreated: jest.fn(),
            publishOrderUpdated: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    eventsService = module.get<EventsService>(EventsService);
  });

  afterEach(async () => {
    await service.clear();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create an order successfully", async () => {
      const createOrderDto: CreateOrderDto = {
        customerId: "customer-123",
        items: ["item-1", "item-2"],
      };

      const order = await service.create(createOrderDto);

      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.customerId).toBe(createOrderDto.customerId);
      expect(order.items).toEqual(createOrderDto.items);
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.createdAt).toBeDefined();
      expect(order.updatedAt).toBeDefined();

      expect(eventsService.publishOrderCreated).toHaveBeenCalledWith(order);
    });
  });

  describe("findAll", () => {
    it("should return paginated orders", async () => {
      const createOrderDto: CreateOrderDto = {
        customerId: "customer-123",
        items: ["item-1"],
      };

      await service.create(createOrderDto);
      await service.create(createOrderDto);

      const result = await service.findAll(1, 0);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(1);
      expect(result.offset).toBe(0);
    });
  });

  describe("findOne", () => {
    it("should return an order by ID", async () => {
      const createOrderDto: CreateOrderDto = {
        customerId: "customer-123",
        items: ["item-1"],
      };

      const createdOrder = await service.create(createOrderDto);
      const foundOrder = await service.findOne(createdOrder.id);

      expect(foundOrder).toEqual(createdOrder);
    });

    it("should throw NotFoundException for non-existent order", async () => {
      await expect(service.findOne("non-existent-id")).rejects.toThrow(
        "Order with ID non-existent-id not found"
      );
    });
  });

  describe("update", () => {
    it("should update order status", async () => {
      const createOrderDto: CreateOrderDto = {
        customerId: "customer-123",
        items: ["item-1"],
      };

      const createdOrder = await service.create(createOrderDto);
      const updatedOrder = await service.update(createdOrder.id, {
        status: OrderStatus.PAID,
      });

      expect(updatedOrder.status).toBe(OrderStatus.PAID);
      expect(updatedOrder.updatedAt.getTime()).toBeGreaterThan(
        createdOrder.updatedAt.getTime()
      );

      expect(eventsService.publishOrderUpdated).toHaveBeenCalledWith(
        updatedOrder,
        OrderStatus.PENDING
      );
    });
  });
});
