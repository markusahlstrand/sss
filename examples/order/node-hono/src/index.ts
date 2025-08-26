import { serve } from '@hono/node-server';
import app from './app';

const port = parseInt(process.env.PORT || '3000', 10);

console.log(`🚀 Starting Orders Service on port ${port}`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✅ Orders Service is running at http://localhost:${info.port}`);
  console.log(`📖 API docs available at http://localhost:${info.port}/docs`);
  console.log(`📋 OpenAPI spec at http://localhost:${info.port}/openapi.json`);
});
