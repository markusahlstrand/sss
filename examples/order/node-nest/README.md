# Orders Service

A NestJS implementation of the Orders Service that complies with **Service Standard v1**.

## Features

- ✅ **REST API** with OpenAPI 3.0+ specification
- ✅ **OAuth2/OIDC Bearer Token Authentication** with scope-based authorization
- ✅ **RFC 7807 Problem+JSON Error Handling**
- ✅ **CloudEvents Format** for event publishing
- ✅ **Structured JSON Logging** with Winston
- ✅ **OpenTelemetry Integration** for observability
- ✅ **Health Check Endpoints** (`/healthz`, `/readyz`)
- ✅ **Service Manifest** (`service.yaml`)

## API Endpoints

### Service Info

- `GET /` - Get service information (no authentication required)
- `GET /openapi.json` - Get OpenAPI specification as JSON (no authentication required)

### Orders

- `POST /orders` - Create a new order (requires `orders.write` scope)
- `GET /orders` - List orders with pagination (requires `orders.read` scope)
- `GET /orders/{id}` - Get order by ID (requires `orders.read` scope)
- `PATCH /orders/{id}` - Update order status (requires `orders.write` scope)

### Health

- `GET /healthz` - Liveness probe
- `GET /readyz` - Readiness probe

### Documentation

- `GET /api-docs` - Swagger/OpenAPI documentation

## Events

The service publishes the following CloudEvents:

- `order.created` - When a new order is created
- `order.updated` - When an order status is updated

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment configuration:

   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your configuration

4. Run the application:

   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

5. Generate a test JWT token (for development/testing):

   ```bash
   npm run generate-token
   ```

6. Test the API:
   ```bash
   ./examples.sh
   ```

## Development

```bash
# Watch mode
npm run start:dev

# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Lint
npm run lint
```

## Authentication

The service expects OAuth2/OIDC bearer tokens with the following scopes:

- `orders.read` - Read access to orders
- `orders.write` - Write access to orders

Example request:

```bash
curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerId": "customer-123", "items": ["item-1", "item-2"]}'
```

## Error Handling

All errors follow RFC 7807 Problem+JSON format:

```json
{
  "type": "validation_error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Invalid input provided",
  "instance": "/orders"
}
```

## Logging

Logs are structured JSON with required fields:

```json
{
  "timestamp": "2025-08-25T12:34:56Z",
  "level": "INFO",
  "service": "orders",
  "trace_id": "abc123",
  "span_id": "def456",
  "message": "Order created"
}
```

## Observability

The service includes OpenTelemetry instrumentation for:

- Distributed tracing
- Metrics collection
- Automatic instrumentation of HTTP requests, database calls, etc.

## Service Manifest

See `service.yaml` for the complete service specification including API contracts and event schemas.
