import { createRoute, z } from "@hono/zod-openapi";
import {
  PurchaseOptionSchema,
  CreatePurchaseOptionSchema,
  PurchaseOptionParamsSchema,
  PaginationSchema,
  ProblemDetailsSchema,
  VendorIdSchema,
} from "../schemas";

// Create purchase option route
export const createPurchaseOptionRoute = createRoute({
  method: "post",
  path: "/vendors/{vendorId}/purchase-options",
  summary: "Create purchase option",
  description: "Create a new purchase option for a vendor",
  request: {
    params: VendorIdSchema,
    body: {
      content: {
        "application/json": {
          schema: CreatePurchaseOptionSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Purchase option created successfully",
      content: {
        "application/json": {
          schema: PurchaseOptionSchema,
        },
      },
    },
  },
  security: [{ Bearer: [] }],
});

// Get purchase option by ID route
export const getPurchaseOptionRoute = createRoute({
  method: "get",
  path: "/vendors/{vendorId}/purchase-options/{purchaseOptionId}",
  summary: "Get purchase option",
  description: "Get a purchase option by vendor ID and purchase option ID",
  request: {
    params: PurchaseOptionParamsSchema,
  },
  responses: {
    200: {
      description: "Purchase option found",
      content: {
        "application/json": {
          schema: PurchaseOptionSchema,
        },
      },
    },
  },
  security: [{ Bearer: [] }],
});

// Update purchase option route
export const updatePurchaseOptionRoute = createRoute({
  method: "put",
  path: "/vendors/{vendorId}/purchase-options/{purchaseOptionId}",
  summary: "Update purchase option",
  description: "Update an existing purchase option",
  request: {
    params: PurchaseOptionParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: CreatePurchaseOptionSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Purchase option updated successfully",
      content: {
        "application/json": {
          schema: PurchaseOptionSchema,
        },
      },
    },
  },
  security: [{ Bearer: [] }],
});

// Delete purchase option route
export const deletePurchaseOptionRoute = createRoute({
  method: "delete",
  path: "/vendors/{vendorId}/purchase-options/{purchaseOptionId}",
  summary: "Delete purchase option",
  description: "Delete a purchase option",
  request: {
    params: PurchaseOptionParamsSchema,
  },
  responses: {
    204: {
      description: "Purchase option deleted successfully",
    },
  },
  security: [{ Bearer: [] }],
});

// List purchase options route
export const listPurchaseOptionsRoute = createRoute({
  method: "get",
  path: "/vendors/{vendorId}/purchase-options",
  summary: "List purchase options",
  description: "Get a paginated list of purchase options for a vendor",
  request: {
    params: VendorIdSchema,
    query: PaginationSchema,
  },
  responses: {
    200: {
      description: "Purchase options retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(PurchaseOptionSchema),
            total: z.number(),
            limit: z.number(),
            offset: z.number(),
          }),
        },
      },
    },
  },
  security: [{ Bearer: [] }],
});