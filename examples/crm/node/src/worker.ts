/// <reference types="@cloudflare/workers-types" />

import { createApp } from "./app";

// Cloudflare Workers environment interface
export interface CloudflareEnv {
  DB: D1Database;
  JWT_SECRET?: string;
  JWKS_URL?: string;
  NODE_ENV?: string;
}

// Worker export for Cloudflare Workers runtime
export default {
  async fetch(
    request: Request,
    env: CloudflareEnv,
    ctx: ExecutionContext
  ): Promise<Response> {
    const app = createApp(env.DB);
    return app.fetch(request, env, ctx);
  },
};
