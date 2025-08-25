# Orders Service - Python FastAPI Implementation

This is a Python FastAPI implementation of the Orders Service following the **Service Standard v1** specification.

## 🚀 Features

- **FastAPI** with automatic OpenAPI generation
- **OAuth2/JWT** authentication with scope-based authorization
- **RFC 7807 Problem Details** for consistent error handling
- **CloudEvents** for event publishing
- **OpenTelemetry** integration for observability
- **Structured JSON logging** with trace correlation
- **Health checks** (`/healthz`, `/readyz`)
- **Full test coverage** with pytest

## 📋 API Endpoints

### Core Endpoints

- `GET /` - Service information
- `GET /openapi.json` - OpenAPI specification
- `GET /healthz` - Liveness probe
- `GET /readyz` - Readiness probe

### Orders API

- `POST /orders` - Create a new order (requires `orders.write` scope)
- `GET /orders/{id}` - Get order by ID (requires `orders.read` scope)
- `PATCH /orders/{id}` - Update order status (requires `orders.write` scope)
- `GET /orders` - List orders with pagination (requires `orders.read` scope)

## 🔧 Setup

### Prerequisites

- Python 3.11+
- pip

### Local Development

1. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run the service:**

   ```bash
   python src/main.py
   # or
   uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Generate a test token:**
   ```bash
   python generate_test_token.py
   ```

### Docker

1. **Build and run with Docker Compose:**

   ```bash
   docker-compose up --build
   ```

   This starts:

   - Orders service on `http://localhost:8000`
   - Jaeger UI on `http://localhost:16686`

2. **Or build and run manually:**
   ```bash
   docker build -t orders-service .
   docker run -p 8000:8000 orders-service
   ```

## 🧪 Testing

Run tests with pytest:

```bash
pytest tests/ -v
```

## 🔐 Authentication

The service uses JWT tokens with OAuth2 scopes:

- `orders.read` - Read access to orders
- `orders.write` - Write access to orders

### Generate Test Token

```bash
# Full access token
python generate_test_token.py

# Read-only token
python generate_test_token.py --scopes orders.read

# Custom token
python generate_test_token.py --scopes orders.read orders.write --sub user-123 --exp-hours 1
```

## 📝 Example Usage

### Create an Order

```bash
# Generate token
TOKEN=$(python generate_test_token.py | grep "Generated JWT token:" -A1 | tail -1)

# Create order
curl -X POST http://localhost:8000/orders/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-123",
    "items": ["item-1", "item-2", "item-3"]
  }'
```

### Get Order

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/orders/{order-id}
```

### Update Order Status

```bash
curl -X PATCH http://localhost:8000/orders/{order-id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "paid"}'
```

### List Orders

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/orders/?limit=10&offset=0"
```

## 📊 Observability

### Logs

All logs are structured JSON with OpenTelemetry correlation:

```json
{
  "timestamp": "2025-08-25T12:34:56Z",
  "level": "INFO",
  "service": "orders",
  "trace_id": "abc123",
  "span_id": "def456",
  "message": "Order created",
  "order_id": "order-123",
  "customer_id": "customer-456"
}
```

### Traces

OpenTelemetry traces are exported to Jaeger (when configured):

- Set `JAEGER_ENDPOINT` environment variable
- View traces at `http://localhost:16686`

### Events

CloudEvents are published for:

- `order.created` - When a new order is created
- `order.updated` - When order status changes

## 🔄 Order Status Flow

Orders follow a strict status transition flow:

```
pending → paid → shipped → delivered
```

Invalid transitions (e.g., `pending → delivered`) return a `409 Conflict` error.

## ⚙️ Configuration

Environment variables:

| Variable          | Default           | Description               |
| ----------------- | ----------------- | ------------------------- |
| `HOST`            | `0.0.0.0`         | Server host               |
| `PORT`            | `8000`            | Server port               |
| `JWT_SECRET_KEY`  | `your-secret-key` | JWT signing key           |
| `JAEGER_ENDPOINT` | -                 | Jaeger collector endpoint |

## 🏗️ Architecture

```
src/
├── main.py              # FastAPI application
├── telemetry.py         # OpenTelemetry setup
├── auth/
│   └── auth.py          # JWT authentication & authorization
├── common/
│   └── errors.py        # RFC 7807 error handling
├── events/
│   └── event_service.py # CloudEvents publishing
├── health/
│   └── health.py        # Health check endpoints
└── orders/
    ├── router.py        # Orders API routes
    ├── service.py       # Business logic
    └── schemas.py       # Pydantic models
```

## 🧩 Service Standard v1 Compliance

✅ **API (REST via OAS)** - Full OpenAPI 3.0 specification  
✅ **Authentication** - OAuth2/JWT with scopes  
✅ **Events** - CloudEvents format with AsyncAPI spec  
✅ **Logging** - Structured JSON with OpenTelemetry  
✅ **Health checks** - `/healthz` and `/readyz` endpoints  
✅ **Error handling** - RFC 7807 Problem Details  
✅ **Service manifest** - Complete `service.yaml`

## 🐛 Error Handling

All errors follow RFC 7807 Problem Details format:

```json
{
  "type": "validation_error",
  "title": "Validation Error",
  "status": 400,
  "detail": "customerId should not be empty, items must contain at least 1 elements",
  "instance": "/orders"
}
```

Standard error types:

- `validation_error` (400)
- `unauthorized` (401)
- `forbidden` (403)
- `not_found` (404)
- `conflict` (409)
- `internal_error` (500)

## 📈 Performance

This implementation provides:

- Fast startup time with FastAPI
- Async/await support for concurrent requests
- Efficient JSON serialization with Pydantic
- Low memory footprint

## 🔜 Production Considerations

For production deployment:

1. **Use a proper database** instead of in-memory storage
2. **Configure real event publishing** (Kafka, RabbitMQ, etc.)
3. **Set up proper secret management** for JWT keys
4. **Configure distributed tracing** with Jaeger/OTLP
5. **Add monitoring** with Prometheus metrics
6. **Set up log aggregation** (ELK stack, etc.)

## 📄 License

This implementation follows the Service Standard v1 specification.
