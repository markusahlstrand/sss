import { createRoute } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { HealthSchema } from '../schemas';

const livenessRoute = createRoute({
  method: 'get',
  path: '/healthz',
  tags: ['health'],
  summary: 'Liveness probe',
  description: 'Returns the health status of the service',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: HealthSchema,
        },
      },
      description: 'Service is alive',
    },
  },
});

const readinessRoute = createRoute({
  method: 'get',
  path: '/readyz',
  tags: ['health'],
  summary: 'Readiness probe',
  description: 'Returns the readiness status of the service',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: HealthSchema,
        },
      },
      description: 'Service is ready',
    },
  },
});

export function registerHealthRoutes(app: OpenAPIHono) {
  app.openapi(livenessRoute, (c) => {
    return c.json({ status: 'ok' });
  });

  app.openapi(readinessRoute, (c) => {
    return c.json({ status: 'ready' });
  });
}
