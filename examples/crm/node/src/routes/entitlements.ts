import { createRoute, z } from "@hono/zod-openapi";
import {
  EntitlementSchema,
  CreateEntitlementSchema,
  EntitlementParamsSchema,
  ListEntitlementsResponseSchema,
  PaginationSchema,
  ProblemDetailsSchema,
  VendorIdSchema,
  EntitlementStatusSchema,
} from "../schemas";

// Create entitlement route
export const createEntitlementRoute = createRoute({
  method: "post",
  path: "/vendors/{vendorId}/entitlements",
  summary: "Create entitlement",
  description: "Create a new entitlement for a vendor",
  request: {
    params: VendorIdSchema,
    body: {
      content: {
        "application/json": {
          schema: CreateEntitlementSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Entitlement created successfully",
      content: {
        "application/json": {
          schema: EntitlementSchema,
        },
      },
    },
  },
  security: [{ Bearer: [] }],
});

// Get entitlement by ID route
export const getEntitlementRoute = createRoute({
  method: "get",
  path: "/vendors/{vendorId}/entitlements/{entitlementId}",
  summary: "Get entitlement",
  description: "Get an entitlement by vendor ID and entitlement ID",
  request: {
    params: EntitlementParamsSchema,
  },
  responses: {
    200: {
      description: "Entitlement found",
      content: {
        "application/json": {
          schema: EntitlementSchema,
        },
      },
    },
  },
  security: [{ Bearer: [] }],
});

// Update entitlement route
export const updateEntitlementRoute = createRoute({
  method: "put",
  path: "/vendors/{vendorId}/entitlements/{entitlementId}",
  summary: "Update entitlement",
  description: "Update an existing entitlement",
  request: {
    params: EntitlementParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: CreateEntitlementSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Entitlement updated successfully",
      content: {
        "application/json": {
          schema: EntitlementSchema,
        },
      },
    },
  },
  security: [{ Bearer: [] }],
});

// Delete entitlement route
export const deleteEntitlementRoute = createRoute({
  method: "delete",
  path: "/vendors/{vendorId}/entitlements/{entitlementId}",
  summary: "Delete entitlement",
  description: "Delete an entitlement",
  request: {
    params: EntitlementParamsSchema,
  },
  responses: {
    204: {
      description: "Entitlement deleted successfully",
    },
  },
  security: [{ Bearer: [] }],
});

// List entitlements route
export const listEntitlementsRoute = createRoute({
  method: "get",
  path: "/vendors/{vendorId}/entitlements",
  summary: "List entitlements",
  description: "Get a paginated list of entitlements for a vendor",
  request: {
    params: VendorIdSchema,
    query: PaginationSchema.extend({
      status: EntitlementStatusSchema.optional(),
      userId: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "Entitlements retrieved successfully",
      content: {
        "application/json": {
          schema: ListEntitlementsResponseSchema,
        },
      },
    },
  },
  security: [{ Bearer: [] }],
});