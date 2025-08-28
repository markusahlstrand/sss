import { createRoute } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import {
  OrderSchema,
  CreateOrderSchema,
  UpdateOrderSchema,
  PaginationSchema,
  ProblemSchema,
} from "../schemas";
import { OrdersService } from "../services/orders";

// Get orders route
const getOrdersRoute = createRoute({
  method: "get",
  path: "/orders",
  tags: ["orders"],
  summary: "Get all orders",
  description: "Retrieve a paginated list of orders",
  request: {
    query: PaginationSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(OrderSchema),
        },
      },
      description: "List of orders",
    },
    401: {
      content: {
        "application/problem+json": {
          schema: ProblemSchema,
        },
      },
      description: "Unauthorized",
    },
    403: {
      content: {
        "application/problem+json": {
          schema: ProblemSchema,
        },
      },
      description: "Forbidden",
    },
  },
  security: [{ Bearer: [] }],
});

// Get single order route
const getOrderRoute = createRoute({
  method: "get",
  path: "/orders/{id}",
  tags: ["orders"],
  summary: "Get order by ID",
  description: "Retrieve a single order by its ID",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OrderSchema,
        },
      },
      description: "Order details",
    },
    404: {
      content: {
        "application/problem+json": {
          schema: ProblemSchema,
        },
      },
      description: "Order not found",
    },
    401: {
      content: {
        "application/problem+json": {
          schema: ProblemSchema,
        },
      },
      description: "Unauthorized",
    },
    403: {
      content: {
        "application/problem+json": {
          schema: ProblemSchema,
        },
      },
      description: "Forbidden",
    },
  },
  security: [{ Bearer: [] }],
});

// Create order route
const createOrderRoute = createRoute({
  method: "post",
  path: "/orders",
  tags: ["orders"],
  summary: "Create a new order",
  description: "Create a new order with the provided details",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateOrderSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: OrderSchema,
        },
      },
      description: "Created order",
    },
    400: {
      content: {
        "application/problem+json": {
          schema: ProblemSchema,
        },
      },
      description: "Validation error",
    },
    401: {
      content: {
        "application/problem+json": {
          schema: ProblemSchema,
        },
      },
      description: "Unauthorized",
    },
    403: {
      content: {
        "application/problem+json": {
          schema: ProblemSchema,
        },
      },
      description: "Forbidden",
    },
  },
  security: [{ Bearer: [] }],
});

// Update order route
const updateOrderRoute = createRoute({
  method: "patch",
  path: "/orders/{id}",
  tags: ["orders"],
  summary: "Update order status",
  description: "Update the status of an existing order",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateOrderSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OrderSchema,
        },
      },
      description: "Updated order",
    },
    400: {
      content: {
        "application/problem+json": {
          schema: ProblemSchema,
        },
      },
      description: "Validation error",
    },
    404: {
      content: {
        "application/problem+json": {
          schema: ProblemSchema,
        },
      },
      description: "Order not found",
    },
    401: {
      content: {
        "application/problem+json": {
          schema: ProblemSchema,
        },
      },
      description: "Unauthorized",
    },
    403: {
      content: {
        "application/problem+json": {
          schema: ProblemSchema,
        },
      },
      description: "Forbidden",
    },
  },
  security: [{ Bearer: [] }],
});

// Register routes with handlers
export function registerOrderRoutes(app: OpenAPIHono) {
  const ordersService = new OrdersService();

  app.openapi(getOrdersRoute, async (c) => {
    const query = c.req.valid("query");
    const orders = await ordersService.findAll(query);
    return c.json(orders) as any;
  });

  app.openapi(getOrderRoute, async (c) => {
    const { id } = c.req.valid("param");
    const order = await ordersService.findById(id);
    return c.json(order) as any;
  });

  app.openapi(createOrderRoute, async (c) => {
    const orderData = c.req.valid("json");
    const order = await ordersService.create(orderData);
    return c.json(order, 201) as any;
  });

  app.openapi(updateOrderRoute, async (c) => {
    const { id } = c.req.valid("param");
    const updateData = c.req.valid("json");
    const order = await ordersService.update(id, updateData);
    return c.json(order) as any;
  });
}
