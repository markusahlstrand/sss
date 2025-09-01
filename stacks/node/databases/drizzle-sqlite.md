# Drizzle + SQLite - Node.js Database Stack

**Drizzle ORM with SQLite** provides an excellent type-safe database layer for Service Standard v1 applications. For all modern Node.js projects, use [`@libsql/client`](https://www.npmjs.com/package/@libsql/client) as the SQLite driver. This avoids native build issues and works for both local and distributed (Turso) SQLite.

## Overview

**Drizzle ORM** is a modern TypeScript-first ORM that generates types from your schema definitions, providing:

- ✅ **Full type safety** with compile-time schema validation
- ✅ **SQL-like query API** that feels natural and performant
- ✅ **Zero runtime overhead** with compile-time query building
- ✅ **Migration management** with versioned schema changes
- ✅ **Excellent IDE support** with auto-completion and type checking
- ✅ **SQLite compatibility** for simple deployment and development

**SQLite** provides:

- ✅ **Zero configuration** - single file database
- ✅ **Embedded database** - no separate server required
- ✅ **ACID compliance** with full transactional support
- ✅ **Production ready** - used by major applications
- ✅ **Easy backups** - simple file copying
- ✅ **Cross-platform** - works everywhere Node.js runs

## Quick Start

### Installation

```bash
# Core Drizzle dependencies
npm install drizzle-orm
npm install -D drizzle-kit

# SQLite driver (recommended for all Node.js versions)
npm install @libsql/client
```

### Project Structure

```
src/
├── db/
│   ├── index.ts           # Database connection and client
│   ├── schema.ts          # Drizzle schema definitions
│   └── migrations/        # Generated migration files
├── orders/
│   ├── models.ts          # Business models and DTOs
│   ├── repository.ts      # Data access layer
│   └── service.ts         # Business logic
└── main.ts
```

## Configuration

### 1. Database Configuration (`src/db/index.ts`)

```typescript
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/app.db",
});
export const db = drizzle(client, { schema });
```

### 2. Schema Definition (`src/db/schema.ts`)

```typescript
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Orders table
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  status: text("status").notNull(),
  totalAmount: real("total_amount").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Order items table
export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  productId: text("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
});

// Generate Zod schemas from Drizzle schemas
export const insertOrderSchema = createInsertSchema(orders);
export const selectOrderSchema = createSelectSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const selectOrderItemSchema = createSelectSchema(orderItems);

// Custom validation schemas for API
export const createOrderSchema = z.object({
  customerId: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
      })
    )
    .min(1),
});

export type Order = z.infer<typeof selectOrderSchema>;
export type NewOrder = z.infer<typeof insertOrderSchema>;
export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
```

### 3. Repository Layer (`src/orders/repository.ts`)

```typescript
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { orders, orderItems, type Order, type NewOrder } from "../db/schema";
import { v4 as uuidv4 } from "uuid";

export class OrderRepository {
  async findById(id: string): Promise<Order | null> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0] || null;
  }

  async findByCustomerId(
    customerId: string,
    limit = 10,
    offset = 0
  ): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .limit(limit)
      .offset(offset);
  }

  async create(orderData: {
    customerId: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
    }>;
  }): Promise<Order> {
    const orderId = uuidv4();
    const now = new Date().toISOString();

    const totalAmount = orderData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    return db.transaction(async (tx) => {
      // Insert order
      await tx.insert(orders).values({
        id: orderId,
        customerId: orderData.customerId,
        status: "pending",
        totalAmount,
        createdAt: now,
        updatedAt: now,
      });

      // Insert order items
      await tx.insert(orderItems).values(
        orderData.items.map((item) => ({
          id: uuidv4(),
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      );

      // Return the created order
      const result = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));
      return result[0];
    });
  }

  async updateStatus(id: string, status: string): Promise<Order | null> {
    const now = new Date().toISOString();

    await db
      .update(orders)
      .set({ status, updatedAt: now })
      .where(eq(orders.id, id));

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    return db.transaction(async (tx) => {
      // Delete order items first (foreign key constraint)
      await tx.delete(orderItems).where(eq(orderItems.orderId, id));

      // Delete order
      const result = await tx.delete(orders).where(eq(orders.id, id));

      return result.changes > 0;
    });
  }

  async count(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(orders);
    return Number(result[0].count);
  }
}
```

### 4. Migration Configuration (`drizzle.config.ts`)

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  driver: "libsql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:./data/app.db",
  },
} satisfies Config;
```

## Integration with Service Standard v1

### Router Integration Examples

#### Hono + Zod Integration

```typescript
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db } from "../db";
import { OrderRepository } from "../orders/repository";
import { createOrderSchema } from "../db/schema";

const app = new OpenAPIHono();
const orderRepo = new OrderRepository();

const createOrderRoute = createRoute({
  method: "post",
  path: "/orders",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createOrderSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: selectOrderSchema,
        },
      },
      description: "Order created successfully",
    },
  },
});

app.openapi(createOrderRoute, async (c) => {
  const body = c.req.valid("json");

  try {
    const order = await orderRepo.create(body);

    // Publish event
    await eventService.publish("order.created", {
      orderId: order.id,
      customerId: order.customerId,
      totalAmount: order.totalAmount,
    });

    return c.json(order, 201);
  } catch (error) {
    console.error("Failed to create order:", error);
    throw new HTTPException(500, {
      message: "Failed to create order",
    });
  }
});
```

#### NestJS Integration

```typescript
@Injectable()
export class OrdersService {
  constructor(private orderRepository: OrderRepository) {}

  async createOrder(createOrderDto: CreateOrderRequest): Promise<Order> {
    const order = await this.orderRepository.create(createOrderDto);

    // Publish event
    await this.eventService.publish("order.created", {
      orderId: order.id,
      customerId: order.customerId,
      totalAmount: order.totalAmount,
    });

    return order;
  }

  async findOrdersByCustomer(
    customerId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<Order[]> {
    return this.orderRepository.findByCustomerId(customerId, limit, offset);
  }
}

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: "Create a new order" })
  @ApiResponse({ status: 201, description: "Order created successfully" })
  async create(@Body() createOrderDto: CreateOrderRequest): Promise<Order> {
    return this.ordersService.createOrder(createOrderDto);
  }
}
```

### Database Lifecycle Management

```typescript
// src/main.ts
import { initializeDatabase, closeDatabase } from "./db";

async function bootstrap() {
  try {
    // Initialize database and run migrations
    await initializeDatabase();

    // Start the application
    const app = createApp();

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("Shutting down gracefully...");
      closeDatabase();
      process.exit(0);
    });

    const port = process.env.PORT || 3000;
    console.log(`Server running on port ${port}`);
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

bootstrap();
```

## Development Workflow

### Migration Management

```bash
# Generate migration from schema changes
npx drizzle-kit generate:sqlite

# Apply migrations
npm run db:migrate

# View current schema
npx drizzle-kit introspect:sqlite
```

### Development Scripts (`package.json`)

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:sqlite",
    "db:migrate": "node -e \"require('./src/db/index.js').initializeDatabase()\"",
    "db:studio": "drizzle-kit studio",
    "db:seed": "node scripts/seed.js"
  }
}
```

### Database Seeding (`scripts/seed.js`)

```javascript
const { db } = require("../src/db");
const { orders, orderItems } = require("../src/db/schema");
const { v4: uuidv4 } = require("uuid");

async function seed() {
  console.log("Seeding database...");

  const orderId = uuidv4();
  const now = new Date().toISOString();

  // Insert test order
  await db.insert(orders).values({
    id: orderId,
    customerId: "customer-123",
    status: "pending",
    totalAmount: 99.99,
    createdAt: now,
    updatedAt: now,
  });

  // Insert test order items
  await db.insert(orderItems).values([
    {
      id: uuidv4(),
      orderId,
      productId: "product-1",
      quantity: 2,
      unitPrice: 29.99,
    },
    {
      id: uuidv4(),
      orderId,
      productId: "product-2",
      quantity: 1,
      unitPrice: 39.99,
    },
  ]);

  console.log("Database seeded successfully");
  process.exit(0);
}

seed().catch(console.error);
```

## Testing

### Test Database Setup

```typescript
// tests/setup.ts
import { beforeAll, afterAll } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

let testClient;

beforeAll(async () => {
  // Use in-memory database for tests
  testClient = createClient({ url: "file::memory:" });
  const db = drizzle(testClient);
  // Run migrations (if needed)
  // await migrate(db, { migrationsFolder: "./src/db/migrations" });
});

afterAll(() => {
  // No explicit close needed for libsql client
});
```

### Repository Tests

```typescript
// tests/orders/repository.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { OrderRepository } from "../../src/orders/repository";

describe("OrderRepository", () => {
  let repository: OrderRepository;

  beforeEach(() => {
    repository = new OrderRepository();
  });

  it("should create an order with items", async () => {
    const orderData = {
      customerId: "customer-123",
      items: [
        { productId: "product-1", quantity: 2, unitPrice: 29.99 },
        { productId: "product-2", quantity: 1, unitPrice: 39.99 },
      ],
    };

    const order = await repository.create(orderData);

    expect(order).toBeDefined();
    expect(order.customerId).toBe("customer-123");
    expect(order.totalAmount).toBe(99.97);
    expect(order.status).toBe("pending");
  });

  it("should find orders by customer ID", async () => {
    // Create test order first
    await repository.create({
      customerId: "customer-456",
      items: [{ productId: "product-3", quantity: 1, unitPrice: 49.99 }],
    });

    const orders = await repository.findByCustomerId("customer-456");

    expect(orders).toHaveLength(1);
    expect(orders[0].customerId).toBe("customer-456");
  });
});
```

## Production Considerations

### Performance Optimization

// With @libsql/client, connection pooling and WAL are managed internally. For most use cases, no extra tuning is needed.

### Health Check Integration

```typescript
// src/health/database-health.ts
import { db } from "../db";

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Simple query to verify database connectivity
    await db.select({ test: sql`1` });
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}
```

### Backup Strategy

```typescript
// scripts/backup.js
const fs = require("fs");
const path = require("path");

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const sourcePath = "./data/app.db";
  const backupPath = `./backups/app-${timestamp}.db`;

  // Ensure backup directory exists
  fs.mkdirSync("./backups", { recursive: true });

  // Copy database file
  fs.copyFileSync(sourcePath, backupPath);

  console.log(`Database backup created: ${backupPath}`);
}
```

## Deployment

### Environment Configuration

```bash
# .env
DATABASE_URL=./data/app.db
DATABASE_BACKUP_INTERVAL=3600  # Backup every hour
DATABASE_MAX_SIZE=1GB          # Alert when database grows beyond this
```

### Docker Integration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Create data directory with proper permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Build application
RUN npm run build

# Run as non-root user
USER node

# Expose data directory as volume
VOLUME ["/app/data"]

EXPOSE 3000

CMD ["npm", "start"]
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders-service
spec:
  replicas: 1 # SQLite requires single instance
  selector:
    matchLabels:
      app: orders-service
  template:
    metadata:
      labels:
        app: orders-service
    spec:
      containers:
        - name: orders-service
          image: orders-service:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              value: "/app/data/app.db"
          volumeMounts:
            - name: database-storage
              mountPath: /app/data
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
      volumes:
        - name: database-storage
          persistentVolumeClaim:
            claimName: database-pvc
```

## Alternative Drivers

### Alternative Drivers

- **better-sqlite3**: Still supported by Drizzle ORM, but not recommended for new projects due to native build issues and lack of edge/serverless support. Use only if you have legacy requirements.
- **Bun SQLite**: For Bun runtime, use `bun:sqlite` and `drizzle-orm/bun-sqlite`.

## Key Benefits

✅ **Type Safety**: Full TypeScript integration with compile-time validation  
✅ **Zero Configuration**: SQLite requires no setup or external dependencies  
✅ **Developer Experience**: Excellent tooling with Drizzle Studio and migrations  
✅ **Performance**: Fast queries with minimal overhead  
✅ **Simple Deployment**: Single file database, easy to backup and replicate  
✅ **Production Ready**: ACID compliance with robust transaction support  
✅ **Cost Effective**: No database server costs for moderate traffic applications  
✅ **Edge Compatibility**: Works in serverless and edge environments

## When to Use Drizzle + SQLite

**✅ Perfect for:**

- Microservices with moderate data requirements
- Development and testing environments
- Applications with < 100GB of data
- Edge computing and serverless deployments
- Prototype and MVP development
- Single-tenant applications

**❌ Consider alternatives for:**

- High-concurrency write-heavy applications
- Multi-tenant systems requiring data isolation
- Applications requiring complex analytics queries
- Distributed systems needing data replication
- Applications with > 100GB data requirements

## Migration Path

If you outgrow SQLite, Drizzle supports easy migration to:

- **PostgreSQL**: Change driver, minimal code changes
- **MySQL**: Change driver and schema syntax
- **PlanetScale**: MySQL-compatible with serverless benefits
- **Turso**: Distributed SQLite with same API

The repository pattern and business logic remain unchanged, making migration straightforward when needed.

## Learnings from Real-World Integration (August 2025)

- **Node.js v23+ compatibility**: `@libsql/client` is the most reliable and future-proof SQLite driver for Node.js, avoiding native compilation issues and supporting both local and distributed (Turso) SQLite.
- **Repository pattern**: Clean separation between API (Zod) schemas and database (Drizzle) schemas is essential for maintainability and type safety.
- **TypeScript strictness**: Hono's strict type inference can require explicit type assertions when bridging API and DB layers.
- **Health checks**: Integrating database connectivity into readiness/liveness endpoints is critical for production reliability.
- **Zero-config deployment**: SQLite's file-based approach is ideal for containerized and stateless Service Standard v1 deployments.
- **Migration management**: drizzle-kit enables version-controlled schema evolution, but distributed SQLite (Turso) may require custom migration handling.
- **Performance**: Compile-time query building and connection pooling provide excellent efficiency for typical microservice workloads.
