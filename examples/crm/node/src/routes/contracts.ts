import { createRoute, z } from "@hono/zod-openapi";
import {
  ContractSchema,
  CreateContractSchema,
  ContractParamsSchema,
  PaginationSchema,
  ProblemDetailsSchema,
  VendorIdSchema,
} from "../schemas";

// Create contract route
export const createContractRoute = createRoute({
  method: "post",
  path: "/vendors/{vendorId}/contracts",
  summary: "Create contract",
  description: "Create a new contract for a vendor",
  request: {
    params: VendorIdSchema,
    body: {
      content: {
        "application/json": {
          schema: CreateContractSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Contract created successfully",
      content: {
        "application/json": {
          schema: ContractSchema,
        },
      },
    },
  },
  security: [{ Bearer: [] }],
});

// Get contract by ID route
export const getContractRoute = createRoute({
  method: "get",
  path: "/vendors/{vendorId}/contracts/{contractId}",
  summary: "Get contract",
  description: "Get a contract by vendor ID and contract ID",
  request: {
    params: ContractParamsSchema,
  },
  responses: {
    200: {
      description: "Contract found",
      content: {
        "application/json": {
          schema: ContractSchema,
        },
      },
    },
  },
  security: [{ Bearer: [] }],
});

// Update contract route
export const updateContractRoute = createRoute({
  method: "put",
  path: "/vendors/{vendorId}/contracts/{contractId}",
  summary: "Update contract",
  description: "Update an existing contract",
  request: {
    params: ContractParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: CreateContractSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Contract updated successfully",
      content: {
        "application/json": {
          schema: ContractSchema,
        },
      },
    },
  },
  security: [{ Bearer: [] }],
});

// Delete contract route
export const deleteContractRoute = createRoute({
  method: "delete",
  path: "/vendors/{vendorId}/contracts/{contractId}",
  summary: "Delete contract",
  description: "Delete a contract",
  request: {
    params: ContractParamsSchema,
  },
  responses: {
    204: {
      description: "Contract deleted successfully",
    },
  },
  security: [{ Bearer: [] }],
});

// List contracts route
export const listContractsRoute = createRoute({
  method: "get",
  path: "/vendors/{vendorId}/contracts",
  summary: "List contracts",
  description: "Get a paginated list of contracts for a vendor",
  request: {
    params: VendorIdSchema,
    query: PaginationSchema,
  },
  responses: {
    200: {
      description: "Contracts retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(ContractSchema),
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