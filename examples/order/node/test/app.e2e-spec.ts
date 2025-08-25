import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { GlobalExceptionFilter } from "../src/common/filters/global-exception.filter";
import * as jwt from "jsonwebtoken";

describe("Orders API (e2e)", () => {
  let app: INestApplication;
  let validToken: string;
  let invalidToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Setup same pipes and filters as main application
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.init();

    // Generate test tokens
    const secret = "your-secret-key";
    validToken = jwt.sign(
      {
        sub: "user-123",
        scopes: ["orders.read", "orders.write"],
      },
      secret
    );

    invalidToken = jwt.sign(
      {
        sub: "user-123",
        scopes: ["invalid.scope"],
      },
      secret
    );
  });

  afterEach(async () => {
    await app.close();
  });

  describe("Service Info", () => {
    it("/ (GET) - should return service information", () => {
      return request(app.getHttpServer())
        .get("/")
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe("orders");
          expect(res.body.version).toBe("1.0.0");
        });
    });

    it("/openapi.json (GET) - should return OpenAPI specification", () => {
      return request(app.getHttpServer())
        .get("/openapi.json")
        .expect(200)
        .expect("Content-Type", /application\/json/)
        .expect((res) => {
          expect(res.body.openapi).toBeDefined();
          expect(res.body.info).toBeDefined();
          expect(res.body.info.title).toBe("Orders API");
          expect(res.body.info.version).toBe("1.0.0");
          expect(res.body.paths).toBeDefined();
        });
    });
  });

  describe("Health Endpoints", () => {
    it("/healthz (GET) - should return health status", () => {
      return request(app.getHttpServer())
        .get("/healthz")
        .expect(200)
        .expect({ status: "ok" });
    });

    it("/readyz (GET) - should return readiness status", () => {
      return request(app.getHttpServer())
        .get("/readyz")
        .expect(200)
        .expect({ status: "ok" });
    });
  });

  describe("Orders Endpoints", () => {
    it("/orders (POST) - should create order with valid token", () => {
      const createOrderDto = {
        customerId: "customer-123",
        items: ["item-1", "item-2"],
      };

      return request(app.getHttpServer())
        .post("/orders")
        .set("Authorization", `Bearer ${validToken}`)
        .send(createOrderDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.customerId).toBe(createOrderDto.customerId);
          expect(res.body.items).toEqual(createOrderDto.items);
          expect(res.body.status).toBe("pending");
          expect(res.body.createdAt).toBeDefined();
          expect(res.body.updatedAt).toBeDefined();
        });
    });

    it("/orders (POST) - should return 401 without token", () => {
      const createOrderDto = {
        customerId: "customer-123",
        items: ["item-1"],
      };

      return request(app.getHttpServer())
        .post("/orders")
        .send(createOrderDto)
        .expect(401)
        .expect((res) => {
          expect(res.body.type).toBe("unauthorized");
          expect(res.body.status).toBe(401);
        });
    });

    it("/orders (POST) - should return 403 with insufficient scopes", () => {
      const createOrderDto = {
        customerId: "customer-123",
        items: ["item-1"],
      };

      return request(app.getHttpServer())
        .post("/orders")
        .set("Authorization", `Bearer ${invalidToken}`)
        .send(createOrderDto)
        .expect(403)
        .expect((res) => {
          expect(res.body.type).toBe("forbidden");
          expect(res.body.status).toBe(403);
        });
    });

    it("/orders (POST) - should return 400 for invalid data", () => {
      const invalidOrderDto = {
        customerId: "",
        items: [], // Empty array should fail validation
      };

      return request(app.getHttpServer())
        .post("/orders")
        .set("Authorization", `Bearer ${validToken}`)
        .send(invalidOrderDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.type).toBe("validation_error");
          expect(res.body.status).toBe(400);
        });
    });

    it("/orders (GET) - should list orders", async () => {
      // First create an order
      const createOrderDto = {
        customerId: "customer-123",
        items: ["item-1"],
      };

      const createResponse = await request(app.getHttpServer())
        .post("/orders")
        .set("Authorization", `Bearer ${validToken}`)
        .send(createOrderDto)
        .expect(201);

      // Then list orders
      return request(app.getHttpServer())
        .get("/orders?limit=10&offset=0")
        .set("Authorization", `Bearer ${validToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.total).toBeDefined();
          expect(res.body.limit).toBe(10);
          expect(res.body.offset).toBe(0);
        });
    });

    it("/orders/:id (GET) - should get order by id", async () => {
      // First create an order
      const createOrderDto = {
        customerId: "customer-123",
        items: ["item-1"],
      };

      const createResponse = await request(app.getHttpServer())
        .post("/orders")
        .set("Authorization", `Bearer ${validToken}`)
        .send(createOrderDto)
        .expect(201);

      const orderId = createResponse.body.id;

      // Then get the order
      return request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set("Authorization", `Bearer ${validToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(orderId);
          expect(res.body.customerId).toBe(createOrderDto.customerId);
        });
    });

    it("/orders/:id (GET) - should return 404 for non-existent order", () => {
      return request(app.getHttpServer())
        .get("/orders/non-existent-id")
        .set("Authorization", `Bearer ${validToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.type).toBe("not_found");
          expect(res.body.status).toBe(404);
        });
    });

    it("/orders/:id (PATCH) - should update order status", async () => {
      // First create an order
      const createOrderDto = {
        customerId: "customer-123",
        items: ["item-1"],
      };

      const createResponse = await request(app.getHttpServer())
        .post("/orders")
        .set("Authorization", `Bearer ${validToken}`)
        .send(createOrderDto)
        .expect(201);

      const orderId = createResponse.body.id;
      const updateOrderDto = { status: "paid" };

      // Then update the order
      return request(app.getHttpServer())
        .patch(`/orders/${orderId}`)
        .set("Authorization", `Bearer ${validToken}`)
        .send(updateOrderDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(orderId);
          expect(res.body.status).toBe("paid");
          expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(
            new Date(createResponse.body.updatedAt).getTime()
          );
        });
    });
  });
});
