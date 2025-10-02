import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { Database, getDatabase } from "./lib/database";
import { VendorRepository } from "./repositories/vendor";
import { ProductRepository } from "./repositories/product";
import { ContractRepository } from "./repositories/contract";
import { PurchaseOptionRepository } from "./repositories/purchase-option";
import { UserRepository } from "./repositories/user";
import { EntitlementRepository } from "./repositories/entitlement";
import { HTTPException } from "hono/http-exception";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";

// Route definitions
import {
  healthzRoute,
  readyzRoute,
  serviceInfoRoute,
  openApiRoute,
} from "./routes/health";
import {
  createVendorRoute,
  getVendorRoute,
  listVendorsRoute,
} from "./routes/vendors";
import {
  createProductRoute,
  getProductRoute,
  updateProductRoute,
  deleteProductRoute,
  listProductsRoute,
} from "./routes/products";
import {
  createContractRoute,
  getContractRoute,
  updateContractRoute,
  deleteContractRoute,
  listContractsRoute,
} from "./routes/contracts";
import {
  createPurchaseOptionRoute,
  getPurchaseOptionRoute,
  updatePurchaseOptionRoute,
  deletePurchaseOptionRoute,
  listPurchaseOptionsRoute,
} from "./routes/purchase-options";
import {
  createUserRoute,
  getUserRoute,
  updateUserRoute,
  deleteUserRoute,
  listUsersRoute,
} from "./routes/users";
import {
  createEntitlementRoute,
  getEntitlementRoute,
  updateEntitlementRoute,
  deleteEntitlementRoute,
  listEntitlementsRoute,
} from "./routes/entitlements";
import { EventService } from "./services/events";

// Define environment type
type Env = {
  Variables: {
    db: Database;
    vendorRepo: VendorRepository;
    productRepo: ProductRepository;
    contractRepo: ContractRepository;
    purchaseOptionRepo: PurchaseOptionRepository;
    userRepo: UserRepository;
    entitlementRepo: EntitlementRepository;
    jwtPayload?: any;
  };
};

export function createApp(database?: D1Database) {
  const app = new OpenAPIHono<Env>();

  // Middleware
  app.use("*", cors());
  app.use("*", errorHandler());

  // Initialize database and repositories
  const db = database ? getDatabase(database) : null;
  const vendorRepo = db ? new VendorRepository(db) : null;
  const productRepo = db ? new ProductRepository(db) : null;
  const contractRepo = db ? new ContractRepository(db) : null;
  const purchaseOptionRepo = db ? new PurchaseOptionRepository(db) : null;
  const userRepo = db ? new UserRepository(db) : null;
  const entitlementRepo = db ? new EntitlementRepository(db) : null;

  // Store database connection and repositories for use in routes
  app.use("*", async (c, next) => {
    if (db && vendorRepo && productRepo && contractRepo && purchaseOptionRepo && userRepo && entitlementRepo) {
      c.set("db", db);
      c.set("vendorRepo", vendorRepo);
      c.set("productRepo", productRepo);
      c.set("contractRepo", contractRepo);
      c.set("purchaseOptionRepo", purchaseOptionRepo);
      c.set("userRepo", userRepo);
      c.set("entitlementRepo", entitlementRepo);
    }
    await next();
  });

  // Health check routes (no auth required)
  app.openapi(healthzRoute, async (c) => {
    return c.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  });

  app.openapi(readyzRoute, async (c) => {
    const db = c.get("db") as Database;
    let dbStatus = "unavailable";

    if (db) {
      try {
        // Simple database connectivity check
        await db.run("SELECT 1" as any);
        dbStatus = "connected";
      } catch (error) {
        dbStatus = "error";
      }
    }

    const isReady = dbStatus === "connected";
    const status = isReady ? 200 : 503;

    return c.json(
      {
        status: isReady ? "ready" : "not ready",
        timestamp: new Date().toISOString(),
        database: dbStatus,
      },
      status
    );
  });

  // Service info route (no auth required)
  app.openapi(serviceInfoRoute, async (c) => {
    return c.json({
      name: "crm-service",
      version: "1.0.0",
    });
  });

  // OpenAPI JSON endpoint (no auth required)
  app.openapi(openApiRoute, async (c) => {
    const document = app.getOpenAPIDocument({
      openapi: "3.0.0",
      info: {
        version: "1.0.0",
        title: "CRM Service API",
        description:
          "Service Standard v1 compliant CRM API for multi-vendor customer relationship management",
      },
      servers: [
        {
          url: "/",
          description: "Current server",
        },
      ],
    });

    return c.json(document);
  });

  // Swagger UI (no auth required)
  app.get("/docs", swaggerUI({ url: "/openapi.json" }));

  // All vendor routes require authentication
  app.use("/vendors/*", authMiddleware());

  // Vendor routes (protected by middleware)
  app.openapi(createVendorRoute, async (c) => {
    const vendorRepo = c.get("vendorRepo");
    if (!vendorRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const body = c.req.valid("json");

    // Check if vendor already exists
    const existingVendor = await vendorRepo.findById(body.vendorId);
    if (existingVendor) {
      const problem = {
        type: "conflict",
        title: "Conflict",
        status: 409,
        detail: "Vendor with this ID already exists",
        instance: c.req.path,
      };
      throw new HTTPException(409, { message: JSON.stringify(problem) });
    }

    const vendor = await vendorRepo.create(body);

    // Transform null metadata to undefined for API response
    const apiVendor = {
      ...vendor,
      metadata: vendor.metadata ?? undefined,
    };

    return c.json(apiVendor, 201);
  });

  app.openapi(getVendorRoute, async (c) => {
    const vendorRepo = c.get("vendorRepo");
    if (!vendorRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId } = c.req.valid("param");
    const vendor = await vendorRepo.findById(vendorId);

    if (!vendor) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "Vendor not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    // Transform database object to API response format
    const apiVendor = {
      vendorId: vendor.vendorId,
      name: vendor.name,
      metadata: vendor.metadata ?? undefined,
      createdAt: vendor.createdAt.toISOString(),
      updatedAt: vendor.updatedAt.toISOString(),
    };

    return c.json(apiVendor);
  });

  app.openapi(listVendorsRoute, async (c) => {
    const vendorRepo = c.get("vendorRepo");
    if (!vendorRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { limit, offset } = c.req.valid("query");
    const result = await vendorRepo.list(limit, offset);

    // Transform null metadata to undefined for API response
    const apiVendors = result.data.map((vendor) => ({
      ...vendor,
      metadata: vendor.metadata ?? undefined,
    }));

    return c.json({
      data: apiVendors,
      total: result.total,
      limit,
      offset,
    });
  });

  // All other routes require authentication  
  app.use("/vendors/*/products/*", authMiddleware());
  app.use("/vendors/*/contracts/*", authMiddleware());
  app.use("/vendors/*/purchase-options/*", authMiddleware());
  app.use("/vendors/*/users/*", authMiddleware());
  app.use("/vendors/*/entitlements/*", authMiddleware());

  // Product routes
  app.openapi(createProductRoute, async (c) => {
    const productRepo = c.get("productRepo");
    if (!productRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId } = c.req.valid("param");
    const body = c.req.valid("json");

    const product = await productRepo.create(vendorId, body);
    return c.json(product, 201);
  });

  app.openapi(getProductRoute, async (c) => {
    const productRepo = c.get("productRepo");
    if (!productRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId, productId } = c.req.valid("param");
    const product = await productRepo.findById(vendorId, productId);

    if (!product) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "Product not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    return c.json(product);
  });

  app.openapi(updateProductRoute, async (c) => {
    const productRepo = c.get("productRepo");
    if (!productRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId, productId } = c.req.valid("param");
    const body = c.req.valid("json");

    const product = await productRepo.update(vendorId, productId, body);
    if (!product) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "Product not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    return c.json(product);
  });

  app.openapi(deleteProductRoute, async (c) => {
    const productRepo = c.get("productRepo");
    if (!productRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId, productId } = c.req.valid("param");
    const deleted = await productRepo.delete(vendorId, productId);

    if (!deleted) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "Product not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    return new Response("", { status: 204 });
  });

  app.openapi(listProductsRoute, async (c) => {
    const productRepo = c.get("productRepo");
    if (!productRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId } = c.req.valid("param");
    const { limit, offset } = c.req.valid("query");
    const result = await productRepo.listByVendor(vendorId, limit, offset);

    return c.json({
      data: result.data,
      total: result.total,
      limit,
      offset,
    });
  });

  // All contract routes require authentication
  app.use("/vendors/*/contracts/*", authMiddleware());

  // Contract routes (protected by middleware)
  app.openapi(createContractRoute, async (c) => {
    const contractRepo = c.get("contractRepo");
    if (!contractRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId } = c.req.valid("param");
    const body = c.req.valid("json");
    const contract = await contractRepo.create(vendorId, body);

    // Publish event
    const eventService = new EventService();
    await eventService.publishContractCreated({
      vendorId: contract.vendorId,
      contractId: contract.contractId,
      productId: contract.productId,
    });

    return c.json(contract, 201);
  });

  app.openapi(getContractRoute, async (c) => {
    const contractRepo = c.get("contractRepo");
    if (!contractRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId, contractId } = c.req.valid("param");
    const contract = await contractRepo.findById(vendorId, contractId);

    if (!contract) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "Contract not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    return c.json(contract);
  });

  app.openapi(updateContractRoute, async (c) => {
    const contractRepo = c.get("contractRepo");
    if (!contractRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId, contractId } = c.req.valid("param");
    const body = c.req.valid("json");
    const contract = await contractRepo.update(vendorId, contractId, body);

    if (!contract) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "Contract not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    return c.json(contract);
  });

  app.openapi(deleteContractRoute, async (c) => {
    const contractRepo = c.get("contractRepo");
    if (!contractRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId, contractId } = c.req.valid("param");
    const deleted = await contractRepo.delete(vendorId, contractId);

    if (!deleted) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "Contract not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    return new Response("", { status: 204 });
  });

  app.openapi(listContractsRoute, async (c) => {
    const contractRepo = c.get("contractRepo");
    if (!contractRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId } = c.req.valid("param");
    const { limit, offset } = c.req.valid("query");
    const result = await contractRepo.list(vendorId, limit, offset);

    return c.json({
      data: result.data,
      total: result.total,
      limit,
      offset,
    });
  });

  // All purchase option routes require authentication
  app.use("/vendors/*/purchase-options/*", authMiddleware());

  // Purchase Option routes (protected by middleware)
  app.openapi(createPurchaseOptionRoute, async (c) => {
    const purchaseOptionRepo = c.get("purchaseOptionRepo");
    if (!purchaseOptionRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId } = c.req.valid("param");
    const body = c.req.valid("json");
    const purchaseOption = await purchaseOptionRepo.create(vendorId, body);

    // Publish event
    const eventService = new EventService();
    await eventService.publishPurchaseOptionCreated({
      vendorId: purchaseOption.vendorId,
      purchaseOptionId: purchaseOption.purchaseOptionId,
      productId: purchaseOption.productId,
    });

    return c.json(purchaseOption, 201);
  });

  app.openapi(getPurchaseOptionRoute, async (c) => {
    const purchaseOptionRepo = c.get("purchaseOptionRepo");
    if (!purchaseOptionRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId, purchaseOptionId } = c.req.valid("param");
    const purchaseOption = await purchaseOptionRepo.findById(vendorId, purchaseOptionId);

    if (!purchaseOption) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "Purchase option not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    return c.json(purchaseOption);
  });

  app.openapi(updatePurchaseOptionRoute, async (c) => {
    const purchaseOptionRepo = c.get("purchaseOptionRepo");
    if (!purchaseOptionRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId, purchaseOptionId } = c.req.valid("param");
    const body = c.req.valid("json");
    const purchaseOption = await purchaseOptionRepo.update(vendorId, purchaseOptionId, body);

    if (!purchaseOption) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "Purchase option not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    return c.json(purchaseOption);
  });

  app.openapi(deletePurchaseOptionRoute, async (c) => {
    const purchaseOptionRepo = c.get("purchaseOptionRepo");
    if (!purchaseOptionRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId, purchaseOptionId } = c.req.valid("param");
    const deleted = await purchaseOptionRepo.delete(vendorId, purchaseOptionId);

    if (!deleted) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "Purchase option not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    return new Response("", { status: 204 });
  });

  app.openapi(listPurchaseOptionsRoute, async (c) => {
    const purchaseOptionRepo = c.get("purchaseOptionRepo");
    if (!purchaseOptionRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId } = c.req.valid("param");
    const { limit, offset } = c.req.valid("query");
    const result = await purchaseOptionRepo.list(vendorId, limit, offset);

    return c.json({
      data: result.data,
      total: result.total,
      limit,
      offset,
    });
  });

  // All user routes require authentication
  app.use("/vendors/*/users/*", authMiddleware());

  // User routes (protected by middleware)
  app.openapi(createUserRoute, async (c) => {
    const userRepo = c.get("userRepo");
    if (!userRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId } = c.req.valid("param");
    const body = c.req.valid("json");

    // Check if user already exists
    const existingUser = await userRepo.findById(vendorId, body.userId);
    if (existingUser) {
      const problem = {
        type: "conflict",
        title: "Conflict",
        status: 409,
        detail: "User with this ID already exists",
        instance: c.req.path,
      };
      throw new HTTPException(409, { message: JSON.stringify(problem) });
    }

    const user = await userRepo.create(vendorId, body);

    // Publish event
    const eventService = new EventService();
    await eventService.publishUserCreated({
      vendorId: user.vendorId,
      userId: user.userId,
      email: user.email,
    });

    // Transform database object to API response format
    const apiUser = {
      vendorId: user.vendorId,
      userId: user.userId,
      email: user.email,
      profile: user.profile ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return c.json(apiUser, 201);
  });

  app.openapi(getUserRoute, async (c) => {
    const userRepo = c.get("userRepo");
    if (!userRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId, userId } = c.req.valid("param");
    const user = await userRepo.findById(vendorId, userId);

    if (!user) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "User not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    // Transform database object to API response format
    const apiUser = {
      vendorId: user.vendorId,
      userId: user.userId,
      email: user.email,
      profile: user.profile ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return c.json(apiUser);
  });

  app.openapi(updateUserRoute, async (c) => {
    const userRepo = c.get("userRepo");
    if (!userRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId, userId } = c.req.valid("param");
    const body = c.req.valid("json");
    const user = await userRepo.update(vendorId, userId, body);

    if (!user) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "User not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    // Transform database object to API response format
    const apiUser = {
      vendorId: user.vendorId,
      userId: user.userId,
      email: user.email,
      profile: user.profile ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return c.json(apiUser);
  });

  app.openapi(deleteUserRoute, async (c) => {
    const userRepo = c.get("userRepo");
    if (!userRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId, userId } = c.req.valid("param");
    const deleted = await userRepo.delete(vendorId, userId);

    if (!deleted) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "User not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    return new Response("", { status: 204 });
  });

  app.openapi(listUsersRoute, async (c) => {
    const userRepo = c.get("userRepo");
    if (!userRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId } = c.req.valid("param");
    const { limit, offset } = c.req.valid("query");
    const result = await userRepo.list(vendorId, limit, offset);

    // Transform database objects to API response format
    const apiUsers = result.data.map(user => ({
      vendorId: user.vendorId,
      userId: user.userId,
      email: user.email,
      profile: user.profile ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return c.json({
      data: apiUsers,
      total: result.total,
      limit,
      offset,
    });
  });

  // All entitlement routes require authentication
  app.use("/vendors/*/entitlements/*", authMiddleware());

  // Entitlement routes (protected by middleware)
  app.openapi(createEntitlementRoute, async (c) => {
    const entitlementRepo = c.get("entitlementRepo");
    if (!entitlementRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId } = c.req.valid("param");
    const body = c.req.valid("json");
    const entitlement = await entitlementRepo.create(vendorId, body);

    // Publish event
    const eventService = new EventService();
    await eventService.publishEntitlementGranted({
      vendorId: entitlement.vendorId,
      entitlementId: entitlement.entitlementId,
      userId: entitlement.userId,
      productId: entitlement.productId,
      purchaseOptionId: entitlement.purchaseOptionId,
    });

    return c.json(entitlement, 201);
  });

  app.openapi(getEntitlementRoute, async (c) => {
    const entitlementRepo = c.get("entitlementRepo");
    if (!entitlementRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId, entitlementId } = c.req.valid("param");
    const entitlement = await entitlementRepo.findById(vendorId, entitlementId);

    if (!entitlement) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "Entitlement not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    return c.json(entitlement);
  });

  app.openapi(updateEntitlementRoute, async (c) => {
    const entitlementRepo = c.get("entitlementRepo");
    if (!entitlementRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId, entitlementId } = c.req.valid("param");
    const body = c.req.valid("json");
    const entitlement = await entitlementRepo.update(vendorId, entitlementId, body);

    if (!entitlement) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "Entitlement not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    return c.json(entitlement);
  });

  app.openapi(deleteEntitlementRoute, async (c) => {
    const entitlementRepo = c.get("entitlementRepo");
    if (!entitlementRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId, entitlementId } = c.req.valid("param");
    const deleted = await entitlementRepo.delete(vendorId, entitlementId);

    if (!deleted) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "Entitlement not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    return new Response("", { status: 204 });
  });

  app.openapi(listEntitlementsRoute, async (c) => {
    const entitlementRepo = c.get("entitlementRepo");
    if (!entitlementRepo) {
      throw new HTTPException(500, { message: "Database not available" });
    }

    const { vendorId } = c.req.valid("param");
    const { limit, offset } = c.req.valid("query");
    const result = await entitlementRepo.list(vendorId, limit, offset);

    return c.json({
      data: result.data,
      total: result.total,
      limit,
      offset,
    });
  });

  return app;
}
