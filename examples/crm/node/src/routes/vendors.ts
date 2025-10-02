import { createRoute, z } from "@hono/zod-openapi";
import {
  VendorSchema,
  CreateVendorSchema,
  ListVendorsResponseSchema,
  PaginationSchema,
  ProblemDetailsSchema,
  VendorIdSchema,
} from "../schemas";

// Create vendor route
export const createVendorRoute = createRoute({
  method: "post",
  path: "/vendors",
  summary: "Create vendor",
  description: "Create a new vendor in the CRM system",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateVendorSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Vendor created successfully",
      content: {
        "application/json": {
          schema: VendorSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/problem+json": {
          schema: ProblemDetailsSchema,
        },
      },
    },
    409: {
      description: "Vendor already exists",
      content: {
        "application/problem+json": {
          schema: ProblemDetailsSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

// Get vendor route
export const getVendorRoute = createRoute({
  method: "get",
  path: "/vendors/{vendorId}",
  summary: "Get vendor",
  description: "Retrieve a specific vendor by ID",
  request: {
    params: VendorIdSchema,
  },
  responses: {
    200: {
      description: "Vendor details",
      content: {
        "application/json": {
          schema: VendorSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

// List vendors route
export const listVendorsRoute = createRoute({
  method: "get",
  path: "/vendors",
  summary: "List vendors",
  description: "List all vendors with pagination",
  request: {
    query: PaginationSchema,
  },
  responses: {
    200: {
      description: "List of vendors",
      content: {
        "application/json": {
          schema: ListVendorsResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});
