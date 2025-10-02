import { createRoute, z } from "@hono/zod-openapi";
import { ServiceInfoSchema } from "../schemas";

// Health check routes
export const healthzRoute = createRoute({
  method: "get",
  path: "/healthz",
  summary: "Liveness check",
  description: "Check if the service is alive",
  responses: {
    200: {
      description: "Service is alive",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
            timestamp: z.string(),
          }),
        },
      },
    },
  },
});

export const readyzRoute = createRoute({
  method: "get",
  path: "/readyz",
  summary: "Readiness check",
  description: "Check if the service is ready to accept traffic",
  responses: {
    200: {
      description: "Service is ready",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
            timestamp: z.string(),
            database: z.string(),
          }),
        },
      },
    },
    503: {
      description: "Service is not ready",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
            timestamp: z.string(),
            database: z.string(),
          }),
        },
      },
    },
  },
});

// Service info route
export const serviceInfoRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Service information",
  description: "Get service name and version",
  responses: {
    200: {
      description: "Service information",
      content: {
        "application/json": {
          schema: ServiceInfoSchema,
        },
      },
    },
  },
});

// OpenAPI JSON route
export const openApiRoute = createRoute({
  method: "get",
  path: "/openapi.json",
  summary: "OpenAPI specification",
  description: "Get the OpenAPI JSON specification for this service",
  responses: {
    200: {
      description: "OpenAPI JSON specification",
      content: {
        "application/json": {
          schema: z.object({}), // OpenAPI schema is complex, use generic object
        },
      },
    },
  },
});
