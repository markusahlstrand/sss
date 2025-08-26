import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';

import { errorHandler } from './middleware/error-handler';
import { loggerMiddleware } from './middleware/logger';
import { authMiddleware, requireScopes } from './middleware/auth';
import { registerOrderRoutes } from './routes/orders';
import { registerHealthRoutes } from './routes/health';
import { ServiceInfoSchema } from './schemas';

// Initialize telemetry
import './telemetry';

const app = new OpenAPIHono();

// Global middleware
app.use('*', loggerMiddleware);
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['*'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Error handler
app.onError(errorHandler);

// Service info endpoint
app.get('/', (c) => {
  return c.json({ name: 'orders-service', version: '1.0.0' });
});

// Health check routes (no auth required)
registerHealthRoutes(app);

// Protected routes - require authentication
app.use('/orders/*', authMiddleware);
app.use('/orders/*', requireScopes(['orders.read']));

// Register protected routes
registerOrderRoutes(app);

// OpenAPI documentation
app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Orders Service API',
    description: 'A Service Standard v1 compliant Orders API built with Hono and Zod OpenAPI',
  },
  servers: [
    {
      url: process.env.BASE_URL || 'http://localhost:3000',
      description: 'Development server',
    },
  ],
});

// Swagger UI
app.get('/docs', swaggerUI({ url: '/openapi.json' }));

export default app;
