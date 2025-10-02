# CRM Service - Node.js Implementation

A **Service Standard v1** compliant CRM API built with **Hono + Zod OpenAPI** and **Drizzle ORM**, designed for **Cloudflare Workers** deployment with **D1 database**.

## 🚀 Features

- **Multi-vendor CRM system** with vendors, products, contracts, purchase options, users, and entitlements
- **Service Standard v1 compliant** with OAuth2/JWT authentication, RFC 7807 error handling, CloudEvents
- **Edge-ready** deployment on Cloudflare Workers with global D1 database
- **Type-safe** with full TypeScript inference from Zod schemas to API handlers
- **Automatic OpenAPI generation** with interactive Swagger UI documentation
- **Schema-first development** with Drizzle ORM and Zod validation

## 📋 Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) for Cloudflare Workers deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Cloudflare D1 Database

```bash
# Create D1 database
wrangler d1 create crm-service-db

# Update wrangler.toml with the database ID returned from the command above

# Generate and apply database migrations
npm run db:generate
wrangler d1 migrations apply crm-service-db --local
```

### 3. Development

**Local Development with Cloudflare Workers:**

```bash
# Start development server with D1 database
npm run dev
```

**Local Development without Cloudflare (Node.js only):**

```bash
# Start local Node.js server (without D1 database)
npm run dev:local
```

### 4. Generate Test JWT Token

```bash
# Generate token with all scopes
npm run generate-token

# Generate token with specific scopes
npm run generate-token -- --scopes "vendors.read,vendors.write"

# Generate token with permissions array
npm run generate-token -- --permissions "vendors:read,vendors:write"
```

## 🔗 API Endpoints

Once running, the service exposes:

- **API Documentation**: http://localhost:8787/docs (Swagger UI)
- **OpenAPI Spec**: http://localhost:8787/openapi.json
- **Health Check**: http://localhost:8787/healthz
- **Readiness Check**: http://localhost:8787/readyz
- **Service Info**: http://localhost:8787/

### Core API Endpoints

| Method | Endpoint                           | Description          | Scope Required       |
| ------ | ---------------------------------- | -------------------- | -------------------- |
| GET    | `/vendors`                         | List all vendors     | `vendors.read`       |
| POST   | `/vendors`                         | Create vendor        | `vendors.write`      |
| GET    | `/vendors/{vendorId}`              | Get specific vendor  | `vendors.read`       |
| GET    | `/vendors/{vendorId}/products`     | List vendor products | `catalog.read`       |
| POST   | `/vendors/{vendorId}/products`     | Create product       | `catalog.write`      |
| GET    | `/vendors/{vendorId}/users`        | List vendor users    | `users.read`         |
| POST   | `/vendors/{vendorId}/users`        | Create user          | `users.write`        |
| POST   | `/vendors/{vendorId}/entitlements` | Grant entitlement    | `entitlements.write` |

## 🏗 Architecture

### Project Structure

```
src/
├── lib/
│   └── database/
│       ├── schema.ts       # Drizzle database schema
│       └── index.ts        # Database utilities
├── middleware/
│   ├── auth.ts             # JWT authentication with JWKS support
│   └── error-handler.ts    # RFC 7807 Problem+JSON error handling
├── repositories/
│   ├── vendor.ts           # Vendor data access layer
│   └── product.ts          # Product data access layer
├── routes/
│   ├── health.ts           # Health check route definitions
│   └── vendors.ts          # Vendor API route definitions
├── schemas/
│   └── index.ts            # Zod validation schemas
├── services/
│   └── events.ts           # CloudEvents publishing
├── scripts/
│   └── generate-token.ts   # JWT token generation utility
├── app.ts                  # Main Hono application setup
├── worker.ts               # Cloudflare Workers entry point
└── main.ts                 # Node.js server entry point
```

### Database Schema

The service manages these core entities:

- **Vendors** - Multi-tenant organizations
- **Products** - Items that can be sold (pass, article, podcast, bundle)
- **Product Bundle Items** - Child products within bundles
- **Contracts** - Terms of service for products
- **Purchase Options** - Pricing and billing for products
- **Users** - End users within vendor organizations
- **Entitlements** - User access rights to products

### Authentication

The service supports dual authentication modes:

1. **JWKS Validation** (Production) - Validates tokens against external JWKS endpoints
2. **Static JWT Secrets** (Development) - Uses hardcoded secrets for local testing

Supports both OAuth2 `scope` (space-separated) and `permissions` (array) formats.

## 🚀 Deployment

### Cloudflare Workers

```bash
# Set up secrets
wrangler secret put JWT_SECRET
wrangler secret put DATABASE_URL  # For production Turso database

# Deploy to Cloudflare Workers
npm run deploy
```

### Docker

```bash
# Build and run with Docker
docker-compose up --build

# Production deployment
docker build -t crm-service .
docker run -p 3000:3000 -e NODE_ENV=production crm-service
```

## 🧪 Testing

### Manual Testing

```bash
# Generate a test token
TOKEN=$(npm run generate-token | grep -o 'eyJ[^"]*')

# Test vendor creation
curl -X POST http://localhost:8787/vendors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vendorId": "acme", "name": "Acme Corp"}'

# Test vendor retrieval
curl http://localhost:8787/vendors/acme \
  -H "Authorization: Bearer $TOKEN"

# List all vendors
curl "http://localhost:8787/vendors?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

### Running Tests

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check
```

## 📊 Observability

### Structured Logging

The service emits structured JSON logs with:

- `timestamp` - ISO 8601 timestamp
- `level` - Log level (INFO, WARN, ERROR)
- `service` - Service name (crm-service)
- `trace_id` - Request correlation ID
- `message` - Human-readable message

### CloudEvents

Published events follow CloudEvents v1.0 format:

- `vendor.created` - New vendor created
- `product.created` - New product created
- `user.created` - New user created
- `entitlement.granted` - User granted access
- `entitlement.revoked` - User access revoked

### Health Checks

- **Liveness** (`/healthz`) - Service process health
- **Readiness** (`/readyz`) - Database connectivity and service readiness

## 🔧 Configuration

### Environment Variables

| Variable       | Description                        | Default           |
| -------------- | ---------------------------------- | ----------------- |
| `NODE_ENV`     | Environment mode                   | `development`     |
| `PORT`         | Server port (local only)           | `3000`            |
| `JWT_SECRET`   | JWT signing secret                 | `your-secret-key` |
| `JWKS_URL`     | JWKS endpoint for token validation | -                 |
| `DATABASE_URL` | Database connection (production)   | -                 |

### Cloudflare Workers Secrets

Set these using `wrangler secret put <name>`:

- `JWT_SECRET` - JWT signing secret
- `DATABASE_URL` - Production Turso database URL (optional)

## 📚 Service Standard v1 Compliance

This implementation is fully compliant with Service Standard v1:

✅ **OpenAPI 3.0+** specification with automatic generation  
✅ **OAuth2/OIDC** bearer token authentication  
✅ **RFC 7807** Problem+JSON error handling  
✅ **CloudEvents** JSON format event publishing  
✅ **JSON Schema** validation for all requests/responses  
✅ **Health checks** with `/healthz` and `/readyz` endpoints  
✅ **Service manifest** in `service.yaml`  
✅ **Structured logging** with required fields  
✅ **Content-Type**: `application/json` only  
✅ **Resource-oriented** API paths  
✅ **Pagination** with `limit` + `offset`

## 🛠 Development

### Adding New Entities

1. **Update database schema** in `src/lib/database/schema.ts`
2. **Generate migration** with `npm run db:generate`
3. **Apply migration** with `wrangler d1 migrations apply crm-service-db --local`
4. **Create Zod schemas** in `src/schemas/index.ts`
5. **Add repository** in `src/repositories/`
6. **Define routes** in `src/routes/`
7. **Register in app** in `src/app.ts`
8. **Add events** in `src/services/events.ts`
9. **Update OpenAPI** and **AsyncAPI** specifications

### Database Migrations

```bash
# Generate new migration after schema changes
npm run db:migrate

# Apply migrations to local database
wrangler d1 migrations apply crm-service-db --local

# Apply migrations to production database
wrangler d1 migrations apply crm-service-db --remote

# Open database studio for inspection
npm run db:studio
```

## 🤝 Contributing

This service follows Service Standard v1 patterns. When contributing:

1. **Maintain schema-first development** - Update Zod schemas before implementation
2. **Follow RFC 7807** for error responses
3. **Emit CloudEvents** for all state changes
4. **Add comprehensive validation** for all inputs
5. **Update OpenAPI** and **AsyncAPI** specifications
6. **Add tests** for new functionality
7. **Follow TypeScript strict mode** conventions

## 📄 License

MIT License - see LICENSE file for details.
