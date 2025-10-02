import { createRoute, z } from "@hono/zod-openapi";
import {
  UserSchema,
  CreateUserSchema,
  UserParamsSchema,
  PaginationSchema,
  ProblemDetailsSchema,
  VendorIdSchema,
} from "../schemas";

// Create user route
export const createUserRoute = createRoute({
  method: "post",
  path: "/vendors/{vendorId}/users",
  summary: "Create user",
  description: "Create a new user for a vendor",
  request: {
    params: VendorIdSchema,
    body: {
      content: {
        "application/json": {
          schema: CreateUserSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "User created successfully",
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
    },
  },
  security: [{ Bearer: [] }],
});

// Get user by ID route
export const getUserRoute = createRoute({
  method: "get",
  path: "/vendors/{vendorId}/users/{userId}",
  summary: "Get user",
  description: "Get a user by vendor ID and user ID",
  request: {
    params: UserParamsSchema,
  },
  responses: {
    200: {
      description: "User found",
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
    },
  },
  security: [{ Bearer: [] }],
});

// Update user route
export const updateUserRoute = createRoute({
  method: "put",
  path: "/vendors/{vendorId}/users/{userId}",
  summary: "Update user",
  description: "Update an existing user",
  request: {
    params: UserParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: CreateUserSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      description: "User updated successfully",
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
    },
  },
  security: [{ Bearer: [] }],
});

// Delete user route
export const deleteUserRoute = createRoute({
  method: "delete",
  path: "/vendors/{vendorId}/users/{userId}",
  summary: "Delete user",
  description: "Delete a user",
  request: {
    params: UserParamsSchema,
  },
  responses: {
    204: {
      description: "User deleted successfully",
    },
  },
  security: [{ Bearer: [] }],
});

// List users route
export const listUsersRoute = createRoute({
  method: "get",
  path: "/vendors/{vendorId}/users",
  summary: "List users",
  description: "Get a paginated list of users for a vendor",
  request: {
    params: VendorIdSchema,
    query: PaginationSchema.extend({
      email: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "Users retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(UserSchema),
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