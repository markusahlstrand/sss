import { createRoute } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { HealthSchema } from "../schemas";
import { checkDatabaseHealth } from "../db";

const livenessRoute = createRoute({
  method: "get",
  path: "/healthz",
  tags: ["health"],
  summary: "Liveness probe",
  description: "Returns the health status of the service",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: HealthSchema,
        },
      },
      description: "Service is alive",
    },
  },
});

const readinessRoute = createRoute({
  method: "get",
  path: "/readyz",
  tags: ["health"],
  summary: "Readiness probe",
  description:
    "Returns the readiness status of the service and its dependencies",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: HealthSchema,
        },
      },
      description: "Service is ready",
    },
    503: {
      content: {
        "application/json": {
          schema: HealthSchema,
        },
      },
      description: "Service is not ready",
    },
  },
});

export function registerHealthRoutes(app: OpenAPIHono) {
  app.openapi(livenessRoute, (c) => {
    return c.json({ status: "ok" });
  });

  app.openapi(readinessRoute, async (c) => {
    const isDatabaseHealthy = await checkDatabaseHealth();

    if (isDatabaseHealthy) {
      return c.json({ status: "ready" });
    } else {
      return c.json({ status: "not ready - database unavailable" }, 503);
    }
  });
}
