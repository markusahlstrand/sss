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
