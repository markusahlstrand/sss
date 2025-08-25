# 🛠 Service Standard v1

This document defines the **Service Standard v1**, a strict contract for designing backend services that can be **implemented in any language** and remain **replaceable and compatible**.

The goal is to ensure:

- Predictable **APIs**
- Consistent **authentication**
- Standardized **events, logging, and errors**
- Interoperability via shared **contracts**
- Easy **tooling and automation**

---

## 📦 Service Components

Every service must provide the following:

### 1. API (REST)

- **OpenAPI 3.0+ (OAS)** is the only allowed format.
- **Conventions**:

  - Content type: `application/json` only.
  - Resource-oriented paths (`/orders/{id}`).
  - Pagination: `limit` + `offset`.
  - Schemas defined via **JSON Schema**.

- **Service Information Endpoint**: All services must expose a root endpoint (`GET /`) that returns service metadata:
  ```json
  {
    "name": "service-name",
    "version": "1.0.0"
  }
  ```

- **Error handling**: all errors use [RFC 7807 Problem+JSON](https://datatracker.ietf.org/doc/html/rfc7807).
- Required error types:

  - `validation_error`
  - `unauthorized`
  - `forbidden`
  - `not_found`
  - `conflict`
  - `internal_error`

---

### 2. Authentication

- All services must accept **OAuth2 / OIDC bearer tokens**.
- Tokens are passed as:

  ```
  Authorization: Bearer <token>
  ```

- **Scopes** must be declared in the service manifest and OAS.
- Service-to-service communication may additionally use **JWT with mTLS**.

---

### 3. Events

- Services publish events in **CloudEvents JSON format**.
- Event contracts must be described using **AsyncAPI 2.0+**.
- Payloads validated against **JSON Schema**.
- Event versioning must be backwards compatible.

---

### 4. Logging & Observability

- All logs are **structured JSON** with required fields:

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

- Traces and metrics must use **OpenTelemetry**.
- Distributed tracing follows **W3C Trace Context**.

---

### 5. Health & Lifecycle

- Services must expose:

  - `/healthz` → liveness
  - `/readyz` → readiness

- Config is provided via **environment variables only**.
- Services must be **stateless** (no local persistence).

---

### 6. Service Manifest

Each service must ship a `service.yaml` alongside its implementation:

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

This manifest allows automated discovery, validation, and documentation.

---

## 🚀 Tooling

To support this standard, the following tooling is expected:

1. **Validator** – verifies OAS, AsyncAPI, and manifest compliance.
2. **Codegen** – generates server stubs (Go, Java, Python, Node, …) and client SDKs.
3. **Service catalog** – central registry of all manifests and contracts.
4. **Scaffolder** – bootstraps new services with logging, auth, and error-handling preconfigured.

---

## 🤖 AI-Assisted Service Generation

You can use AI assistants (like GitHub Copilot) to generate fully compliant services by providing this prompt:

```
Can you generate nestjs app in the examples/order/node folder based on the stacks/node.md stack and the examples/order/spec.md spec and the readme.md instructions?
```

This approach:

- **Reads the service specification** from `examples/{service}/spec.md`
- **Follows the technology stack** defined in `stacks/{language}.md`
- **Implements all Service Standard v1 requirements** from `readme.md`
- **Generates a complete, runnable application** with proper structure, authentication, error handling, and documentation

The AI will create:

- Complete application structure with all required modules
- OpenAPI and AsyncAPI specifications
- Service manifest (`service.yaml`)
- Dockerfile and development setup
- Comprehensive documentation and examples
- Tests demonstrating compliance

---

## 📏 Scope of v1

This version is intentionally strict and limited:

- **REST only** (no GraphQL, gRPC yet).
- **CloudEvents only** for events.
- **OAuth2 only** for authentication.
- **JSON only** for data format.
- **No workflows** (reserved for a future version).

---

## ✅ Benefits

- Replaceable implementations in any language.
- Predictable integration patterns.
- Centralized tooling for validation and generation.
- Strong interoperability across teams and services.
