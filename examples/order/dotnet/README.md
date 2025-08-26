# 🚀 Orders Service (.NET)

A **Service Standard v1** compliant order management service built with **ASP.NET Core 9.0**.

## Features

✅ **REST API** with OpenAPI 3.0 specification  
✅ **JWT Authentication** with scope-based authorization  
✅ **CloudEvents** for event publishing  
✅ **Structured Logging** with Serilog  
✅ **OpenTelemetry** tracing and metrics  
✅ **Health Checks** (/healthz, /readyz)  
✅ **RFC 7807 Problem Details** error handling  
✅ **Swagger UI** for API documentation

## Quick Start

### Prerequisites

- .NET 9.0 SDK
- Docker (optional)

### Running Locally

```bash
# Run the service
dotnet run

# Or with Docker
docker-compose up
```

The service will start at `http://localhost:5000` with Swagger UI at `/swagger`.

### API Testing

Generate test JWT tokens:

```bash
# Generate tokens for testing
dotnet run -- --generate-tokens
```

Use the examples script to test all endpoints:

```bash
./examples.sh
```

## API Endpoints

### Core Endpoints

- `GET /` - Service information
- `GET /openapi.json` - OpenAPI specification
- `GET /healthz` - Liveness check
- `GET /readyz` - Readiness check

### Orders API

- `GET /orders` - List orders (requires `orders.read`)
- `POST /orders` - Create order (requires `orders.write`)
- `GET /orders/{id}` - Get order (requires `orders.read`)
- `PATCH /orders/{id}` - Update order status (requires `orders.write`)

## Authentication

The service uses **JWT Bearer tokens** with scope-based authorization:

- `orders.read` - Read access to orders
- `orders.write` - Write access to orders

Example request:

```bash
curl -H "Authorization: Bearer <jwt-token>" \
     -H "Content-Type: application/json" \
     -d '{"customerId": "customer-123", "items": ["item-1"]}' \
     http://localhost:5000/orders
```

## Events

The service publishes **CloudEvents** for order lifecycle:

- `order.created` - When a new order is created
- `order.updated` - When order status changes

Events are logged in development. In production, configure event publishing to your message broker.

## Configuration

Environment variables:

- `JWT_SECRET` - JWT signing secret (default: test key)
- `ASPNETCORE_ENVIRONMENT` - Environment (Development/Production)
- `JAEGER_ENDPOINT` - Jaeger tracing endpoint

## Health & Observability

### Health Checks

- `GET /healthz` - Liveness probe
- `GET /readyz` - Readiness probe

### Logging

Structured JSON logging with required fields:

- `timestamp` - ISO 8601 timestamp
- `level` - Log level (INFO, WARN, ERROR)
- `service` - Always "orders"
- `trace_id` - Distributed trace ID
- `span_id` - Span ID
- `message` - Log message

### Tracing

OpenTelemetry tracing with Jaeger export:

- View traces at `http://localhost:16686` (when using docker-compose)

## Error Handling

All errors follow **RFC 7807 Problem Details** format:

```json
{
  "type": "validation_error",
  "title": "Validation Error",
  "status": 400,
  "detail": "customerId should not be empty",
  "instance": "/orders"
}
```

Supported error types:

- `validation_error` (400)
- `unauthorized` (401)
- `forbidden` (403)
- `not_found` (404)
- `conflict` (409)
- `internal_error` (500)

## Development

### Project Structure

```
Orders/              # Order domain logic
├── Models.cs        # Order data models
├── OrdersService.cs # Business logic
└── OrdersController.cs # API controllers

Auth/               # Authentication
└── JwtTokenGenerator.cs # JWT utilities

Common/             # Shared utilities
├── Exceptions.cs   # Custom exceptions
└── GlobalExceptionMiddleware.cs # Error handling

Events/             # Event publishing
└── EventService.cs # CloudEvents service

Health/             # Health checks
└── HealthController.cs # Health endpoints
```

### Testing

The service includes:

- Model validation
- JWT authentication
- Scope-based authorization
- Error handling
- Health checks
- Event publishing

Test using the provided examples or Swagger UI.

## Deployment

### Docker

Build and run with Docker:

```bash
docker build -t orders-service .
docker run -p 5000:5000 orders-service
```

### Docker Compose

Run with observability stack:

```bash
docker-compose up
```

Includes:

- Orders Service (port 5000)
- Jaeger (port 16686)

## Service Standard v1 Compliance

This implementation fully complies with Service Standard v1:

- ✅ REST API with OpenAPI 3.0
- ✅ OAuth2/JWT authentication with scopes
- ✅ CloudEvents for event publishing
- ✅ Structured JSON logging with OpenTelemetry
- ✅ Health checks (/healthz, /readyz)
- ✅ RFC 7807 error handling
- ✅ Service manifest (service.yaml)
- ✅ Stateless design
- ✅ Environment variable configuration
