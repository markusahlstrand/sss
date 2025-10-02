import { createRoute, z } from "@hono/zod-openapi";
import {
  ProductSchema,
  CreateProductSchema,
  ProductParamsSchema,
  ListProductsResponseSchema,
  PaginationSchema,
  ProblemDetailsSchema,
  VendorIdSchema,
} from "../schemas";

// Create product route
export const createProductRoute = createRoute({
  method: "post",
  path: "/vendors/{vendorId}/products",
  summary: "Create product",
  description: "Create a new product for a vendor",
  request: {
    params: VendorIdSchema,
    body: {
      content: {
        "application/json": {
          schema: CreateProductSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Product created successfully",
      content: {
        "application/json": {
          schema: ProductSchema,
        },
      },
    },
  },
  security: [{ Bearer: [] }],
});

// Get product by ID route
export const getProductRoute = createRoute({
  method: "get",
  path: "/vendors/{vendorId}/products/{productId}",
  summary: "Get product",
  description: "Get a product by vendor ID and product ID",
  request: {
    params: ProductParamsSchema,
  },
  responses: {
    200: {
      description: "Product found",
      content: {
        "application/json": {
          schema: ProductSchema,
        },
      },
    },
  },
  security: [{ Bearer: [] }],
});

// Update product route
export const updateProductRoute = createRoute({
  method: "put",
  path: "/vendors/{vendorId}/products/{productId}",
  summary: "Update product",
  description: "Update an existing product",
  request: {
    params: ProductParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: CreateProductSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Product updated successfully",
      content: {
        "application/json": {
          schema: ProductSchema,
        },
      },
    },
  },
  security: [{ Bearer: [] }],
});

// Delete product route
export const deleteProductRoute = createRoute({
  method: "delete",
  path: "/vendors/{vendorId}/products/{productId}",
  summary: "Delete product",
  description: "Delete a product",
  request: {
    params: ProductParamsSchema,
  },
  responses: {
    204: {
      description: "Product deleted successfully",
    },
  },
  security: [{ Bearer: [] }],
});

// List products route
export const listProductsRoute = createRoute({
  method: "get",
  path: "/vendors/{vendorId}/products",
  summary: "List products",
  description: "Get a paginated list of products for a vendor",
  request: {
    params: VendorIdSchema,
    query: PaginationSchema,
  },
  responses: {
    200: {
      description: "Products retrieved successfully",
      content: {
        "application/json": {
          schema: ListProductsResponseSchema,
        },
      },
    },
  },
  security: [{ Bearer: [] }],
});