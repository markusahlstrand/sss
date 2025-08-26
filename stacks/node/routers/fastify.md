# Fastify Router - Service Standard v1

**Fastify** is a high-performance, low-overhead web framework for Node.js that provides excellent support for Service Standard v1 requirements with built-in schema validation and plugin architecture.

## Key Features

- **High performance** - up to 76% faster than Express
- **JSON Schema validation** built-in for requests and responses
- **OpenAPI plugin** support via `@fastify/swagger` and `@fastify/swagger-ui`
- **Plugin architecture** for modular development
- **TypeScript support** with strong typing
- **Built-in logging** with structured output
- **Lightweight** with minimal overhead
- **HTTP/2 support** out of the box

## Required Dependencies

**Core Fastify:**

```json
{
  "fastify": "^4.24.0",
  "@fastify/swagger": "^8.12.0",
  "@fastify/swagger-ui": "^2.1.0",
  "@fastify/cors": "^8.4.0",
  "@fastify/helmet": "^11.1.1"
}
```

**Authentication:**

```json
{
  "@fastify/jwt": "^7.2.4",
  "@fastify/bearer-auth": "^9.2.0"
}
```

**Validation:**

```json
{
  "ajv": "^8.12.0",
  "ajv-formats": "^2.1.1"
}
```

**Observability:**

```json
{
  "pino": "^8.16.0",
  "pino-pretty": "^10.2.0",
  "@opentelemetry/api": "^1.6.0",
  "@opentelemetry/auto-instrumentations-node": "^0.39.4",
  "@opentelemetry/sdk-node": "^0.43.0"
}
```

## Project Structure

```
src/
├── plugins/
│   ├── auth.js            # JWT authentication plugin
│   ├── swagger.js         # OpenAPI documentation
│   ├── telemetry.js       # OpenTelemetry setup
│   └── error-handler.js   # RFC 7807 error handling
├── routes/
│   ├── health.js          # Health check endpoints
│   └── [domain]/          # Business logic routes
├── schemas/
│   └── [domain]/          # JSON Schema definitions
├── services/
│   ├── events.js          # CloudEvents service
│   └── [domain]/          # Business services
└── app.js                 # Fastify app setup
```

## Implementation Patterns

### Route Definitions with Schema

```javascript
// routes/orders/index.js
const orderSchemas = require("../../schemas/orders");

async function orderRoutes(fastify, options) {
  // Get orders with pagination
  fastify.get(
    "/",
    {
      schema: {
        querystring: orderSchemas.paginationSchema,
        response: {
          200: orderSchemas.ordersListSchema,
        },
        tags: ["orders"],
        summary: "Get all orders",
      },
      preHandler: [
        fastify.authenticate,
        fastify.requireScopes(["orders.read"]),
      ],
    },
    async (request, reply) => {
      const { limit = 10, offset = 0 } = request.query;
      const orders = await fastify.ordersService.findAll({ limit, offset });
      return orders;
    }
  );

  // Create order
  fastify.post(
    "/",
    {
      schema: {
        body: orderSchemas.createOrderSchema,
        response: {
          201: orderSchemas.orderSchema,
        },
        tags: ["orders"],
        summary: "Create a new order",
      },
      preHandler: [
        fastify.authenticate,
        fastify.requireScopes(["orders.write"]),
      ],
    },
    async (request, reply) => {
      const order = await fastify.ordersService.create(request.body);
      reply.code(201);
      return order;
    }
  );
}

module.exports = orderRoutes;
```

### JSON Schemas

```javascript
// schemas/orders/index.js
const orderItemSchema = {
  type: "object",
  required: ["productId", "quantity", "price"],
  properties: {
    productId: { type: "string", format: "uuid" },
    quantity: { type: "integer", minimum: 1 },
    price: { type: "number", minimum: 0.01 },
  },
};

const createOrderSchema = {
  type: "object",
  required: ["customerId", "items", "totalAmount"],
  properties: {
    customerId: { type: "string", format: "uuid" },
    items: {
      type: "array",
      minItems: 1,
      items: orderItemSchema,
    },
    totalAmount: { type: "number", minimum: 0.01 },
  },
};

const orderSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    customerId: { type: "string", format: "uuid" },
    items: { type: "array", items: orderItemSchema },
    totalAmount: { type: "number" },
    status: {
      type: "string",
      enum: ["pending", "confirmed", "shipped", "delivered"],
    },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const paginationSchema = {
  type: "object",
  properties: {
    limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
    offset: { type: "integer", minimum: 0, default: 0 },
  },
};

module.exports = {
  createOrderSchema,
  orderSchema,
  ordersListSchema: {
    type: "array",
    items: orderSchema,
  },
  paginationSchema,
};
```

### Authentication Plugin

```javascript
// plugins/auth.js
const fp = require("fastify-plugin");

async function authPlugin(fastify, options) {
  // Register JWT plugin
  await fastify.register(require("@fastify/jwt"), {
    secret: process.env.JWT_SECRET,
  });

  // Authentication decorator
  fastify.decorate("authenticate", async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      const problem = {
        type: "unauthorized",
        title: "Unauthorized",
        status: 401,
        detail: "Invalid or missing authentication token",
        instance: request.url,
      };
      reply.code(401).type("application/problem+json").send(problem);
    }
  });

  // Scope checking decorator
  fastify.decorate("requireScopes", (requiredScopes) => {
    return async function (request, reply) {
      const userScopes = request.user?.scopes || [];
      const hasRequiredScope = requiredScopes.some((scope) =>
        userScopes.includes(scope)
      );

      if (!hasRequiredScope) {
        const problem = {
          type: "forbidden",
          title: "Forbidden",
          status: 403,
          detail: `Required scopes: ${requiredScopes.join(", ")}`,
          instance: request.url,
        };
        reply.code(403).type("application/problem+json").send(problem);
      }
    };
  });
}

module.exports = fp(authPlugin);
```

### Error Handler Plugin

```javascript
// plugins/error-handler.js
const fp = require("fastify-plugin");

async function errorHandlerPlugin(fastify, options) {
  fastify.setErrorHandler((error, request, reply) => {
    let problemDetails = {
      type: "internal_error",
      title: "Internal Server Error",
      status: 500,
      detail: "An unexpected error occurred",
      instance: request.url,
    };

    // Handle validation errors
    if (error.validation) {
      const validationErrors = error.validation
        .map((err) => `${err.instancePath || "root"} ${err.message}`)
        .join(", ");

      problemDetails = {
        type: "validation_error",
        title: "Validation Error",
        status: 400,
        detail: validationErrors,
        instance: request.url,
      };
      reply.code(400);
    }
    // Handle JWT errors
    else if (error.code === "FST_JWT_BAD_REQUEST") {
      problemDetails = {
        type: "unauthorized",
        title: "Unauthorized",
        status: 401,
        detail: "Invalid authentication token",
        instance: request.url,
      };
      reply.code(401);
    }
    // Handle other HTTP errors
    else if (error.statusCode) {
      problemDetails.status = error.statusCode;
      problemDetails.detail = error.message;
      reply.code(error.statusCode);
    } else {
      fastify.log.error(error);
      reply.code(500);
    }

    reply.type("application/problem+json").send(problemDetails);
  });
}

module.exports = fp(errorHandlerPlugin);
```

### Application Setup

```javascript
// app.js
const fastify = require("fastify")({
  logger: {
    level: "info",
    transport:
      process.env.NODE_ENV === "development"
        ? {
            target: "pino-pretty",
          }
        : undefined,
  },
});

async function buildApp(opts = {}) {
  // Initialize telemetry
  require("./telemetry");

  // Register plugins
  await fastify.register(require("./plugins/error-handler"));
  await fastify.register(require("./plugins/auth"));
  await fastify.register(require("./plugins/swagger"));

  await fastify.register(require("@fastify/helmet"), {
    contentSecurityPolicy: false,
  });

  await fastify.register(require("@fastify/cors"), {
    origin: true,
  });

  // Register services
  await fastify.register(require("./services/events"));
  await fastify.register(require("./services/orders"));

  // Register routes
  await fastify.register(require("./routes/health"));
  await fastify.register(require("./routes/orders"), { prefix: "/orders" });

  // Service info endpoint
  fastify.get("/", async (request, reply) => {
    return { name: "orders-service", version: "1.0.0" };
  });

  // OpenAPI JSON endpoint
  fastify.get("/openapi.json", async (request, reply) => {
    return fastify.swagger();
  });

  return fastify;
}

module.exports = buildApp;
```

### Swagger Plugin

```javascript
// plugins/swagger.js
const fp = require("fastify-plugin");

async function swaggerPlugin(fastify, options) {
  await fastify.register(require("@fastify/swagger"), {
    swagger: {
      info: {
        title: "Orders Service API",
        version: "1.0.0",
      },
      host: `localhost:${process.env.PORT || 3000}`,
      schemes: ["http", "https"],
      consumes: ["application/json"],
      produces: ["application/json"],
      securityDefinitions: {
        Bearer: {
          type: "apiKey",
          name: "Authorization",
          in: "header",
        },
      },
    },
  });

  await fastify.register(require("@fastify/swagger-ui"), {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
  });
}

module.exports = fp(swaggerPlugin);
```

## Strengths

- ✅ **High performance** - excellent throughput and low latency
- ✅ **Built-in validation** with JSON Schema
- ✅ **Plugin architecture** for modular development
- ✅ **TypeScript support** with good type inference
- ✅ **Minimal overhead** - lightweight and fast
- ✅ **HTTP/2 support** built-in
- ✅ **Structured logging** with Pino

## Considerations

- ⚠️ **Smaller ecosystem** compared to Express/NestJS
- ⚠️ **JSON Schema** learning curve for complex validation
- ⚠️ **Plugin compatibility** - need to verify Fastify v4 support
- ⚠️ **Less opinionated** - requires more setup decisions

## Best Use Cases

- **High-performance APIs** with strict latency requirements
- **Microservices** requiring minimal resource usage
- **Teams comfortable with JSON Schema** validation
- **Services with heavy traffic** and performance constraints
- **Container environments** with resource limits
