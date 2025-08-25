# Orders Service - Rust Implementation

A Service Standard v1 compliant REST API service built with Rust and Axum for managing customer orders.

## 🚀 Quick Start

### Prerequisites

- Rust 1.75+
- Docker (optional)

### Running Locally

```bash
# Clone and navigate to the directory
cd examples/order/rust

# Install dependencies and run
cargo run
```

The service will start on `http://localhost:3000`

### Running with Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build and run manually
docker build -t orders-service .
docker run -p 3000:3000 orders-service
```

## 📖 API Documentation

### Endpoints

- `GET /` - Service information
- `GET /openapi.json` - OpenAPI specification
- `GET /swagger-ui` - Interactive API documentation
- `GET /healthz` - Liveness probe
- `GET /readyz` - Readiness probe

#### Orders API

- `POST /orders` - Create a new order
- `GET /orders` - List orders (with pagination)
- `GET /orders/{id}` - Get a specific order
- `PATCH /orders/{id}` - Update an order's status

### Authentication

All endpoints (except health and service info) require a valid JWT Bearer token with appropriate scopes:

- `orders.read` - Required for GET operations
- `orders.write` - Required for POST and PATCH operations

### Example Requests

#### Create an Order

```bash
curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "customer-123",
    "items": ["item-1", "item-2"]
  }'
```

#### Get an Order

```bash
curl http://localhost:3000/orders/{order-id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update Order Status

```bash
curl -X PATCH http://localhost:3000/orders/{order-id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid"
  }'
```

#### List Orders

```bash
curl "http://localhost:3000/orders?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔐 JWT Token Generation

For development and testing, you can generate a test JWT token:

```bash
# Create a simple test token generator
cat > generate-test-token.rs << 'EOF'
use jsonwebtoken::{encode, Header, EncodingKey};
use serde::{Serialize};

#[derive(Serialize)]
struct Claims {
    sub: String,
    exp: usize,
    scopes: Vec<String>,
}

fn main() {
    let claims = Claims {
        sub: "test-user".to_string(),
        exp: (chrono::Utc::now() + chrono::Duration::hours(24)).timestamp() as usize,
        scopes: vec!["orders.read".to_string(), "orders.write".to_string()],
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret("your-secret-key".as_ref())
    ).unwrap();

    println!("{}", token);
}
EOF

# Add dependencies to Cargo.toml temporarily and run
cargo add jsonwebtoken chrono --features chrono/serde
rustc --extern jsonwebtoken --extern serde --extern chrono generate-test-token.rs && ./generate-test-token
```

## 📊 Events

The service publishes CloudEvents-compliant events:

### order.created

Published when a new order is created.

```json
{
  "specversion": "1.0",
  "type": "order.created",
  "source": "orders-service",
  "id": "uuid",
  "time": "2025-08-25T12:34:56Z",
  "data": {
    "id": "order-uuid",
    "customer_id": "customer-123",
    "items": ["item-1", "item-2"],
    "status": "pending",
    "created_at": "2025-08-25T12:34:56Z"
  }
}
```

### order.updated

Published when an order's status changes.

```json
{
  "specversion": "1.0",
  "type": "order.updated",
  "source": "orders-service",
  "id": "uuid",
  "time": "2025-08-25T12:34:56Z",
  "data": {
    "id": "order-uuid",
    "customer_id": "customer-123",
    "status": "paid",
    "updated_at": "2025-08-25T12:34:56Z"
  }
}
```

## 🏗 Architecture

The service follows a clean architecture pattern:

```
src/
├── main.rs              # Application entry point
├── config.rs            # Configuration management
├── telemetry.rs         # Logging and tracing setup
├── auth/                # Authentication and authorization
│   ├── mod.rs           # JWT validation middleware
│   └── scopes.rs        # Scope validation
├── common/              # Shared utilities
│   └── errors.rs        # Error handling and Problem+JSON
├── events.rs            # CloudEvents publishing
├── health.rs            # Health check endpoints
└── orders/              # Orders domain
    ├── mod.rs           # HTTP handlers and routing
    ├── dto.rs           # Data transfer objects
    ├── entities.rs      # Domain entities
    └── service.rs       # Business logic
```

## 🔍 Observability

### Structured Logging

All logs are emitted in structured JSON format with required fields:

```json
{
  "timestamp": "2025-08-25T12:34:56Z",
  "level": "INFO",
  "service": "orders",
  "trace_id": "abc123",
  "span_id": "def456",
  "message": "Order created",
  "order_id": "uuid"
}
```

### Distributed Tracing

The service supports OpenTelemetry tracing with W3C Trace Context propagation. Traces can be exported to Jaeger (included in docker-compose).

### Health Checks

- `/healthz` - Returns 200 if the service is alive
- `/readyz` - Returns 200 if the service is ready to handle requests

## ⚙️ Configuration

Configuration is handled via environment variables:

- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT validation (default: "your-secret-key")
- `JAEGER_ENDPOINT` - Jaeger endpoint for trace export (optional)
- `RUST_LOG` - Log level (default: "info")

## 🧪 Testing

```bash
# Run unit tests
cargo test

# Run with coverage
cargo install cargo-tarpaulin
cargo tarpaulin --verbose --all-features --workspace --timeout 120
```

## 📏 Service Standard v1 Compliance

This implementation fully complies with Service Standard v1:

### ✅ API (REST)

- OpenAPI 3.0+ specification (`/openapi.json`)
- JSON content type only
- Resource-oriented paths (`/orders/{id}`)
- Pagination via `limit` and `offset`
- Service info endpoint (`/`)

### ✅ Authentication

- OAuth2/OIDC Bearer token support
- Scope-based authorization (`orders.read`, `orders.write`)

### ✅ Events

- CloudEvents JSON format
- AsyncAPI 2.0+ specification
- JSON Schema payload validation

### ✅ Error Handling

- RFC 7807 Problem+JSON format
- Standard error types:
  - `validation_error` - with detailed validation messages
  - `unauthorized`
  - `forbidden`
  - `not_found`
  - `conflict`
  - `internal_error`

### ✅ Logging & Observability

- Structured JSON logs with required fields
- OpenTelemetry tracing and metrics
- W3C Trace Context support

### ✅ Health & Lifecycle

- `/healthz` (liveness) and `/readyz` (readiness)
- Environment variable configuration
- Stateless design

### ✅ Service Manifest

- Complete `service.yaml` with all required fields
- API and event contract references

## 🔧 Development

### Project Structure

The project uses standard Rust conventions with Cargo for dependency management. Key dependencies:

- **axum** - Web framework
- **utoipa** - OpenAPI generation
- **tokio** - Async runtime
- **tracing** - Structured logging
- **jsonwebtoken** - JWT handling
- **cloudevents-sdk** - CloudEvents support
- **opentelemetry** - Observability

### Adding New Features

1. Define domain entities in `orders/entities.rs`
2. Create DTOs in `orders/dto.rs`
3. Implement business logic in `orders/service.rs`
4. Add HTTP handlers in `orders/mod.rs`
5. Update OpenAPI annotations
6. Add tests

## 🚢 Deployment

### Production Considerations

1. **Database**: Replace in-memory storage with a proper database
2. **Event Publishing**: Integrate with a message broker (Kafka, RabbitMQ)
3. **Security**: Use proper JWT validation with OIDC discovery
4. **Monitoring**: Configure metrics collection and alerting
5. **Load Balancing**: Deploy multiple instances behind a load balancer

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: orders-service
  template:
    metadata:
      labels:
        app: orders-service
    spec:
      containers:
        - name: orders-service
          image: orders-service:1.0.0
          ports:
            - containerPort: 3000
          env:
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: orders-secrets
                  key: jwt-secret
          livenessProbe:
            httpGet:
              path: /healthz
              port: 3000
          readinessProbe:
            httpGet:
              path: /readyz
              port: 3000
```

## 📄 License

This implementation is part of the Service Standard v1 example and follows the same licensing terms.
