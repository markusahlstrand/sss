# Orders Service - Hono + Zod OpenAPI

A **Service Standard v1** compliant Orders service built with **Hono**, **Zod OpenAPI**, and TypeScript. This service demonstrates modern, edge-ready API development with automatic OpenAPI generation, strong type safety, and comprehensive observability.

## 🚀 Features

- **Service Standard v1 Compliant**: Implements all required service standards
- **Ultra-fast**: Built with Hono for edge-ready performance
- **Type-safe**: Full TypeScript with Zod schema validation
- **Auto-generated OpenAPI**: Automatic API documentation from schemas
- **JWT Authentication**: OAuth2/OIDC bearer token support with scope-based authorization
- **RFC 7807 Error Handling**: Standardized problem+json error responses
- **CloudEvents**: Structured event publishing for order lifecycle
- **OpenTelemetry**: Distributed tracing and observability
- **Edge Ready**: Works on Node.js, Bun, Deno, and edge runtimes

## 📁 Project Structure

```
src/
├── middleware/
│   ├── auth.ts           # JWT authentication & scope validation
│   ├── error-handler.ts  # RFC 7807 error handling
│   └── logger.ts         # Structured logging with trace context
├── routes/
│   ├── health.ts         # Health check endpoints
│   └── orders.ts         # Orders CRUD operations
├── schemas/
│   └── index.ts          # Zod schemas for validation & OpenAPI
├── services/
│   ├── events.ts         # CloudEvents publishing
│   └── orders.ts         # Business logic
├── app.ts                # Hono app configuration
├── index.ts              # Server entry point
├── telemetry.ts          # OpenTelemetry setup
└── generate-test-token.ts # JWT token generator for testing
```

## 🛠 Installation & Setup

### Prerequisites

- **Node.js 18+** (or Bun/Deno for edge deployment)
- **npm/yarn/pnpm**

### Install Dependencies

```bash
npm install
```

### Development

Start the development server with hot reload:

```bash
npm run dev
```

The service will be available at:

- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/docs
- **OpenAPI Spec**: http://localhost:3000/openapi.json

### Build & Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔐 Authentication

The service uses JWT bearer tokens with scope-based authorization. Generate test tokens:

```bash
npm run generate-token
```

This creates tokens with different scopes:
- `orders.read` - Read access to orders
- `orders.write` - Create and update orders

### Example Usage

```bash
# Generate tokens
npm run generate-token

# Use the read/write token from output
export TOKEN="your-jwt-token-here"

# Create an order
curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "550e8400-e29b-41d4-a716-446655440001",
    "items": [
      {
        "productId": "550e8400-e29b-41d4-a716-446655440003",
        "quantity": 2,
        "price": 29.99
      }
    ],
    "totalAmount": 59.98
  }'

# Get orders
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/orders

# Get specific order
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/orders/{order-id}

# Update order status
curl -X PATCH http://localhost:3000/orders/{order-id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

## 📋 API Endpoints

### Public Endpoints

- `GET /` - Service information
- `GET /healthz` - Liveness probe
- `GET /readyz` - Readiness probe
- `GET /openapi.json` - OpenAPI specification
- `GET /docs` - Swagger UI documentation

### Protected Endpoints (Require JWT)

- `GET /orders` - List orders (requires `orders.read`)
- `POST /orders` - Create order (requires `orders.write`)
- `GET /orders/{id}` - Get order by ID (requires `orders.read`)
- `PATCH /orders/{id}` - Update order status (requires `orders.write`)

## 📊 Observability

### Logging

The service provides structured JSON logs with:

```json
{
  "timestamp": "2023-12-01T12:00:00.000Z",
  "level": "info",
  "service": "orders-service",
  "trace_id": "abc123...",
  "span_id": "def456...",
  "message": "Order created",
  "orderId": "550e8400-...",
  "customerId": "550e8400-...",
  "totalAmount": 59.98
}
```

### Distributed Tracing

OpenTelemetry integration provides:
- Request tracing across service boundaries
- Automatic HTTP instrumentation
- W3C Trace Context propagation
- Integration with Jaeger, Zipkin, etc.

### Health Checks

- `/healthz` - Liveness (always returns 200)
- `/readyz` - Readiness (checks service dependencies)

## 📡 Events

The service publishes CloudEvents for order lifecycle:

### order.created

Published when a new order is created:

```json
{
  "specversion": "1.0",
  "type": "order.created",
  "source": "orders-service",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "time": "2023-12-01T12:00:00Z",
  "datacontenttype": "application/json",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "customerId": "550e8400-e29b-41d4-a716-446655440001",
    "items": [...],
    "totalAmount": 59.98,
    "status": "pending"
  }
}
```

### order.updated

Published when order status changes:

```json
{
  "specversion": "1.0",
  "type": "order.updated",
  "source": "orders-service",
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "time": "2023-12-01T12:30:00Z",
  "datacontenttype": "application/json",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "status": "confirmed",
    "previousStatus": "pending",
    "updatedAt": "2023-12-01T12:30:00Z"
  }
}
```

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t orders-service-hono .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret-key \
  orders-service-hono
```

### Docker Compose

For local development with observability stack:

```bash
docker-compose up -d
```

This starts:
- Orders service on port 3000
- Jaeger UI on port 16686
- Prometheus on port 9090

## ⚡ Performance

Hono is optimized for modern JavaScript runtimes:

- **Edge Ready**: Runs on Cloudflare Workers, Vercel Edge
- **Fast**: Up to 3x faster than Express
- **Small Bundle**: Minimal size for serverless/edge
- **TypeScript**: Full type safety with zero runtime overhead

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `OTEL_SERVICE_NAME` | Service name for tracing | `orders-service` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP collector endpoint | - |

## 🔧 Service Configuration

The service is configured via `service.yaml`:

```yaml
name: orders
version: 1.0.0
owner: team-orders
api: ./openapi.yaml
events: ./asyncapi.yaml
auth:
  required_scopes:
    - orders.read
    - orders.write
```

## 📚 Documentation

- **OpenAPI Spec**: Available at `/openapi.json` and in `openapi.yaml`
- **AsyncAPI Spec**: Event schemas in `asyncapi.yaml`  
- **Swagger UI**: Interactive docs at `/docs`
- **Service Manifest**: Configuration in `service.yaml`

## 🚀 Deployment Options

### Traditional Node.js

```bash
npm run build
npm start
```

### Edge Runtimes

The service works on:
- **Cloudflare Workers**
- **Vercel Edge Functions**  
- **Deno Deploy**
- **Bun**

### Container Platforms

- **Docker**
- **Kubernetes**
- **AWS ECS/Fargate**
- **Google Cloud Run**

## 🤝 Service Standard v1 Compliance

✅ **OpenAPI 3.0+** specification with automatic generation  
✅ **OAuth2/OIDC** bearer token authentication  
✅ **RFC 7807** Problem+JSON error handling  
✅ **CloudEvents** JSON format event publishing  
✅ **OpenTelemetry** integration for observability  
✅ **Health checks** with `/healthz` and `/readyz`  
✅ **JSON Schema** validation for all requests/responses  
✅ **Service manifest** with `service.yaml`  
✅ **Structured logging** with trace correlation  

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

---

**Built with ❤️ using Hono + Zod OpenAPI for Service Standard v1**
