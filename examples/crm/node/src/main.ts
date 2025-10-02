import { serve } from "@hono/node-server";
import { createApp } from "./app";

// For local development without D1 database
const app = createApp();

const port = parseInt(process.env.PORT || "3000", 10);

console.log(`Starting CRM Service on port ${port}`);
console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Server is running on http://localhost:${port}`);
console.log(`API Documentation: http://localhost:${port}/docs`);
console.log(`Health Check: http://localhost:${port}/healthz`);
console.log(`OpenAPI Spec: http://localhost:${port}/openapi.json`);
