# Node.js Stack - Service Standard v1

Node.js provides excellent support for Service Standard v1 requirements with multiple router options, each offering different trade-offs in terms of performance, developer experience, and feature set.

## 📑 Quick Navigation

**Router Implementation Guides:**

- **[NestJS Guide](./routers/nestjs.md)** - Enterprise framework with decorators and DI
- **[Fastify Guide](./routers/fastify.md)** - High-performance JSON schema validation
- **[Hono + Zod Guide](./routers/hono-zod-openapi.md)** - Modern edge-first with type safety

**Database Integration:**

- **[Database Options](./databases/)** - Type-safe database layers with Drizzle, Prisma, and more
- **[Drizzle + SQLite](./databases/drizzle-sqlite.md)** - Zero-config file database with full type safety

**Example Implementations:**

- **[NestJS Orders Service](../../examples/order/node-nest/)** - Complete working example
- **[Hono + Zod Orders Service](../../examples/order/node-hono/)** - Edge-ready implementation

## Overview

**Node.js** is a mature, widely-adopted runtime with a rich ecosystem of frameworks and libraries. All router options below provide full compliance with Service Standard v1 requirements:

- ✅ **OpenAPI 3.0+** specification with automatic generation
- ✅ **OAuth2/OIDC** bearer token authentication
- ✅ **RFC 7807** Problem+JSON error handling
- ✅ **CloudEvents** JSON format event publishing
- ✅ **OpenTelemetry** integration for observability
- ✅ **Health checks** with `/healthz` and `/readyz` endpoints
- ✅ **JSON Schema** validation for all requests/responses

## Router Options

Choose from these proven Node.js routers, each with detailed implementation guides:

### [NestJS](./routers/nestjs.md) - Enterprise Framework

**Best for: Large teams, complex business logic, enterprise applications**

- **Strongly opinionated** framework with decorators and dependency injection
- **Auto-generated OpenAPI** via `@nestjs/swagger` decorators
- **Built-in validation** with `class-validator` and detailed error messages
- **Modular architecture** with comprehensive tooling
- **Extensive ecosystem** with official packages for most needs
- **Learning curve** - requires understanding of decorators and DI patterns

```bash
# Quick start
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/swagger
```

**📖 [Full NestJS Implementation Guide →](./routers/nestjs.md)**

### [Fastify](./routers/fastify.md) - High Performance

**Best for: High-traffic APIs, performance-critical services, microservices**

- **High performance** - up to 76% faster than Express
- **JSON Schema validation** built-in with excellent error messages
- **Plugin architecture** for modular development
- **Lightweight** with minimal overhead and HTTP/2 support
- **Smaller ecosystem** compared to Express/NestJS
- **Less opinionated** - requires more setup decisions

```bash
# Quick start
npm install fastify @fastify/swagger @fastify/swagger-ui @fastify/jwt
```

**📖 [Full Fastify Implementation Guide →](./routers/fastify.md)**

### [Hono + Zod OpenAPI](./routers/hono-zod-openapi.md) - Modern Edge-First

**Best for: Edge computing, serverless, modern type-safe APIs**

- **Ultra-fast** - optimized for edge computing (Cloudflare Workers, Vercel)
- **Type-safe** schema validation with Zod and full TypeScript inference
- **Automatic OpenAPI** generation from Zod schemas
- **Edge-ready** - works across Node.js, Bun, Deno, and edge runtimes
- **Minimal bundle** size for serverless/edge environments
- **Newer ecosystem** - fewer third-party packages available

```bash
# Quick start
npm install hono @hono/zod-openapi @hono/swagger-ui zod
```

**📖 [Full Hono + Zod Implementation Guide →](./routers/hono-zod-openapi.md)**

## Comparison Matrix

| Feature              | NestJS    | Fastify   | Hono + Zod |
| -------------------- | --------- | --------- | ---------- |
| **Performance**      | Good      | Excellent | Excellent  |
| **Type Safety**      | Good      | Good      | Excellent  |
| **Learning Curve**   | Steep     | Moderate  | Moderate   |
| **Ecosystem**        | Large     | Medium    | Small      |
| **Bundle Size**      | Large     | Medium    | Small      |
| **Edge Support**     | No        | Limited   | Excellent  |
| **Enterprise Ready** | Excellent | Good      | Good       |
| **Auto OpenAPI**     | Excellent | Good      | Excellent  |

## Common Dependencies

All router options share some common Node.js dependencies for Service Standard v1 compliance:

### Authentication

```json
{
  "jsonwebtoken": "^9.0.2"
}
```

### Observability

```json
{
  "@opentelemetry/api": "^1.6.0",
  "@opentelemetry/auto-instrumentations-node": "^0.39.4",
  "@opentelemetry/sdk-node": "^0.43.0"
}
```

### Events

```json
{
  "cloudevents": "^6.0.4"
}
```

## Implementation Requirements

Regardless of router choice, all implementations must include:

### 1. Required Endpoints

- `GET /` - Service info (`{"name": "service-name", "version": "1.0.0"}`)
- `GET /openapi.json` - OpenAPI specification
- `GET /healthz` - Liveness probe
- `GET /readyz` - Readiness probe

### 2. Authentication & Authorization

- Bearer token validation with JWT
- Scope-based authorization
- Proper error responses (401/403)

### 3. Error Handling

- RFC 7807 Problem+JSON format
- Required error types: `validation_error`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `internal_error`
- Detailed validation error messages

### 4. Request/Response Format

- Content-Type: `application/json` only
- JSON Schema validation for all endpoints
- Pagination with `limit` + `offset` parameters

### 5. Events

- CloudEvents v1.0 JSON format
- AsyncAPI 2.0+ specification
- Structured event publishing

### 6. Observability

- Structured JSON logs with: `timestamp`, `level`, `service`, `trace_id`, `span_id`, `message`
- OpenTelemetry integration with W3C Trace Context
- Correlation between requests and logs

## Choosing the Right Router

### Choose **NestJS** if:

- Building enterprise applications with complex business logic
- Working with large teams that need consistent patterns
- Need comprehensive tooling and ecosystem support
- Familiar with Angular or similar decorator-based frameworks
- Prefer strongly opinionated architecture

### Choose **Fastify** if:

- Performance is a critical requirement (high traffic, low latency)
- Building microservices with resource constraints
- Need JSON Schema validation with minimal overhead
- Want plugin-based architecture for modularity
- Comfortable with less opinionated frameworks

### Choose **Hono + Zod** if:

- Deploying to edge computing platforms (Cloudflare Workers, Vercel Edge)
- Building serverless functions with strict cold start requirements
- Want maximum type safety with compile-time schema validation
- Prefer modern Web Standards APIs over Node.js-specific patterns
- Need minimal bundle size for edge/serverless environments

## Recent Implementation Experience

### Hono + Zod OpenAPI Success (August 2025) ✅

The Hono + Zod OpenAPI implementation was successfully generated and is fully operational:

**Key Strengths:**

- **Excellent type safety**: Full TypeScript inference from Zod schemas to API handlers
- **Automatic OpenAPI generation**: Schemas directly generate accurate API documentation
- **Edge-ready performance**: Ultra-fast with minimal bundle size for serverless deployment
- **Modern development experience**: Schema-first development with excellent tooling
- **Service Standard v1 compliance**: All requirements met with clean, maintainable code

**Technical Highlights:**

- **Version compatibility**: Hono v4 required for latest `@hono/node-server` compatibility
- **JWT integration**: Built-in `jwt()` middleware from Hono core (no separate `@hono/jwt` package needed)
- **Schema-driven**: Zod schemas provide both validation and automatic OpenAPI generation
- **Error handling**: Clean RFC 7807 implementation with centralized error middleware
- **CloudEvents**: Simple integration with structured event publishing

**Development Experience:**

- **Fast build times**: TypeScript compilation and hot reload are very fast
- **Excellent IDE support**: Full IntelliSense and type checking throughout
- **Easy testing**: Built-in test client and comprehensive examples script
- **Clear documentation**: Auto-generated OpenAPI docs are accurate and complete

**Performance Characteristics:**

- **Cold start optimized**: Minimal dependencies and fast initialization
- **Memory efficient**: Low memory footprint ideal for serverless functions
- **Edge deployment ready**: Works seamlessly on Cloudflare Workers, Vercel Edge
- **Scalable**: Stateless design enables easy horizontal scaling

## Next Steps

## Learnings from Drizzle SQLite Integration (August 2025)

- **Modern driver selection**: @libsql/client is recommended for Node.js v23+ due to better compatibility and no native build issues.
- **Repository pattern**: Clean separation between API (Zod) and DB (Drizzle) schemas improves maintainability and type safety.
- **TypeScript strictness**: Hono's strict type inference may require explicit type assertions when bridging API and DB layers.
- **Health checks**: Integrate database connectivity into readiness/liveness endpoints for robust production deployments.
- **Zero-config deployment**: SQLite's file-based approach is ideal for containerized and stateless services.
- **Migration management**: drizzle-kit enables version-controlled schema evolution; distributed SQLite (Turso) may need custom migration handling.
- **Performance**: Compile-time query building and connection pooling provide excellent efficiency for microservices.

1. **Review the specific router documentation** for implementation details
2. **Check the `/examples/` folder** for complete working implementations
3. **Consider your deployment target** (traditional servers vs. edge/serverless)
4. **Evaluate team expertise** and learning curve preferences
5. **Test performance characteristics** with your expected load patterns
