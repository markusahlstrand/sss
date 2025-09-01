/**
 * Cloudflare Workers entry point for Podcast Service
 * Optimized for edge runtime with minimal cold start overhead
 */

/// <reference types="@cloudflare/workers-types" />

import { createApp } from "./app";

// Interface for Cloudflare Worker environment
interface CloudflareEnv {
  DB: D1Database;
  BUCKET: R2Bucket;
  JWT_SECRET?: string;
  NODE_ENV?: string;
}

export default {
  async fetch(
    request: Request,
    env: CloudflareEnv,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Create app with D1 database and R2 bucket bindings
    const app = createApp(env.DB, env.BUCKET);

    // Set environment variables for JWT
    if (env.JWT_SECRET && !process.env.JWT_SECRET) {
      process.env.JWT_SECRET = env.JWT_SECRET;
    }
    // Don't modify NODE_ENV as it's a compile-time constant in Workers

    return app.fetch(request, env, ctx);
  },
};
