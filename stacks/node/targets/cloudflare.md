# Cloudflare Workers Target Stack

Deployment configuration for running Node.js services on Cloudflare Workers edge runtime with full Service Standard v1 compliance.

## 🚀 Deployment Architecture

### Edge Runtime Benefits

- **Global Distribution**: Deploy to 200+ edge locations worldwide
- **Zero Cold Start**: Sub-millisecond startup times
- **Automatic Scaling**: Handle traffic spikes without configuration
- **Cost Efficient**: Pay-per-request pricing model

### Cloudflare Services Integration

- **D1 Database**: SQLite-compatible serverless database
- **R2 Storage**: S3-compatible object storage with zero egress fees
- **KV Storage**: Global key-value store for caching
- **Durable Objects**: Stateful edge computing for real-time features

## 📦 Package Dependencies

### Core Workers Dependencies

```json
{
  "dependencies": {
    "hono": "^4.6.3",
    "@hono/zod-openapi": "0.16.4",
    "@hono/swagger-ui": "^0.4.1",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.0.0",
    "wrangler": "^3.0.0",
    "typescript": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.0"
  }
}
```

### 🔧 Critical Version Compatibility

- **Hono v4.6.3+**: Required for latest ecosystem compatibility
- **@hono/zod-openapi 0.16.4**: Pin this version - v0.17+ has breaking changes
- **Node.js Compatibility**: Use `nodejs_compat` flag in wrangler.toml
- **TypeScript**: Workers runtime requires ES2022+ target

## ⚙️ Configuration Files

### wrangler.toml Template

```toml
name = "service-name"
main = "dist/worker.js"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

# Environment variables
[vars]
NODE_ENV = "development"

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "service-db"
database_id = "your-database-id"
migrations_dir = "./drizzle"

# R2 Storage binding
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "service-assets"

[build]
command = "npx tsc -p tsconfig.worker.json"

# Environment-specific configs
[env.production]
vars = { NODE_ENV = "production" }
```

### tsconfig.worker.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["@cloudflare/workers-types"],
    "lib": ["ES2022", "WebWorker"],
    "target": "ES2022",
    "module": "ES2022"
  },
  "include": ["src/**/*"],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "src/telemetry.ts", // Node.js specific
    "src/main.ts", // Node.js specific
    "src/scripts/**/*" // Development scripts
  ]
}
```

## 🗄️ Database Integration (D1)

### D1 Setup Commands

```bash
# Create D1 database
npx wrangler d1 create service-db

# Run migrations
npx wrangler d1 migrations apply service-db --local   # Development
npx wrangler d1 migrations apply service-db --remote  # Production
```

### Drizzle ORM Configuration

```typescript
// src/database/client.ts
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDatabase(database?: D1Database) {
  if (database) {
    return drizzle(database, { schema });
  }

  // Fallback for development
  throw new Error("D1 database binding not available");
}
```

### Repository Pattern with D1 Injection

```typescript
export class Repository {
  private db: ReturnType<typeof getDatabase>;

  constructor(database?: D1Database) {
    this.db = getDatabase(database);
  }

  async findAll() {
    return await this.db.select().from(table);
  }
}
```

## 💾 R2 Storage Integration

### R2 Setup Commands

```bash
# Create R2 bucket
npx wrangler r2 bucket create service-assets

# Configure public access (optional)
npx wrangler r2 bucket cors set service-assets --file cors.json
```

### File Upload Implementation

```typescript
export class FileService {
  constructor(private bucket?: R2Bucket) {}

  async uploadFile(key: string, data: Buffer, contentType: string) {
    if (!this.bucket) {
      throw new Error("R2 bucket not available");
    }

    await this.bucket.put(key, data, {
      httpMetadata: { contentType },
    });

    return `https://service-assets.r2.dev/${key}`;
  }
}
```

### Structured File Organization

```
audio/{show_id}/{episode_id}/{file_id}/{filename}
images/{show_id}/{image_id}/{filename}
uploads/{user_id}/{upload_id}/{filename}
```

## 🔐 Authentication & Security

### JWT Integration

```typescript
import { jwt } from "hono/jwt";

app.use(
  "/api/*",
  jwt({
    secret: env.JWT_SECRET || "fallback-secret",
  })
);
```

### Environment Secrets

```bash
# Set production secrets
wrangler secret put JWT_SECRET
wrangler secret put DATABASE_AUTH_TOKEN
```

## 📋 Worker Entry Point Pattern

### src/worker.ts

```typescript
/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;
  BUCKET: R2Bucket;
  JWT_SECRET?: string;
}

export default {
  async fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext) {
    const app = createApp(env.DB, env.BUCKET);

    // Set environment variables
    if (env.JWT_SECRET) {
      process.env.JWT_SECRET = env.JWT_SECRET;
    }

    return app.fetch(request, env, ctx);
  },
};
```

## 🧪 Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev  # wrangler dev

# Build for production
npm run build  # tsc -p tsconfig.worker.json
```

### Deployment Commands

```bash
# Deploy to staging
wrangler deploy --env development

# Deploy to production
wrangler deploy --env production

# Deploy with specific version
wrangler deploy --compatibility-date 2024-09-23
```

## 📊 Monitoring & Observability

### Edge-Compatible Telemetry

```typescript
// src/telemetry-edge.ts
export function createLogger() {
  return {
    info: (message: string, meta?: any) => {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "INFO",
          service: "service-name",
          message,
          ...meta,
        })
      );
    },
  };
}
```

### Health Checks

```typescript
app.get("/healthz", (c) => ({
  status: "healthy",
  timestamp: new Date().toISOString(),
  service: "service-name",
  version: "1.0.0",
}));

app.get("/readyz", async (c) => {
  // Test D1 connection
  await env.DB.prepare("SELECT 1").run();
  return { status: "ready" };
});
```

## ⚠️ Common Pitfalls & Solutions

### Build Errors

- **Issue**: `tsc: command not found` during deployment
- **Solution**: Use `npx tsc` in build commands

### Package Compatibility

- **Issue**: Node.js packages not working in Workers runtime
- **Solution**: Use `nodejs_compat` flag and exclude Node-specific files

### D1 Connection Issues

- **Issue**: Database not found in development
- **Solution**: Apply migrations with `--local` flag first

### R2 Access Issues

- **Issue**: Files not publicly accessible
- **Solution**: Configure R2 public access or use custom domains

### TypeScript Errors

- **Issue**: Worker types not recognized
- **Solution**: Add `/// <reference types="@cloudflare/workers-types" />` to entry files

## 🚀 Performance Optimizations

### Bundle Size

- Exclude Node.js specific modules from worker build
- Use tree-shaking compatible imports
- Minimize dependencies in production bundle

### Cold Start Optimization

- Keep worker entry point minimal
- Lazy load heavy modules
- Use Hono's lightweight routing

### Caching Strategy

- Leverage Cloudflare's edge cache
- Use KV for frequently accessed data
- Implement proper cache headers

## 🔄 Migration Guide

### From Node.js to Workers

1. Replace Node-specific packages (fs, path, etc.)
2. Update entry point to Worker export pattern
3. Configure D1/R2 bindings
4. Update deployment scripts to use wrangler
5. Test edge compatibility

### Database Migration

- Convert from libsql/better-sqlite3 to D1
- Update connection patterns for binding injection
- Migrate schema using wrangler d1 commands

This target provides enterprise-grade edge deployment with global distribution, automatic scaling, and seamless integration with Cloudflare's developer platform.
