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

- **OpenAPI JSON Endpoint**: All services must expose their OpenAPI specification as JSON at (`GET /openapi.json`).

- **Error handling**: all errors use [RFC 7807 Problem+JSON](https://datatracker.ietf.org/doc/html/rfc7807).
- Required error types:

  - `validation_error` - Must include detailed validation failure messages in the `detail` field
  - `unauthorized`
  - `forbidden`
  - `not_found`
  - `conflict`
  - `internal_error`

- **Validation Errors**: When request validation fails, the response must:
  - Return HTTP 400 status
  - Use `validation_error` type
  - Include specific field validation messages in the `detail` field
  - Example response:
    ```json
    {
      "type": "validation_error",
      "title": "Validation Error",
      "status": 400,
      "detail": "customerId should not be empty, items must contain at least 1 elements",
      "instance": "/orders"
    }
    ```

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

## � Implementation Experience

Service Standard v1 has been successfully implemented across multiple languages and frameworks, with each bringing unique strengths:

### Language Maturity for SSv1

| Language    | Framework    | OpenAPI    | Events     | Auth       | Observability | Effort |
| ----------- | ------------ | ---------- | ---------- | ---------- | ------------- | ------ |
| **Node.js** | NestJS       | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐    | Low    |
| **.NET**    | ASP.NET Core | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐    | Low    |
| **Rust**    | Axum         | ⭐⭐⭐⭐   | ⭐⭐⭐     | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐    | Medium |
| **Go**      | Gin/Chi      | ⭐⭐⭐⭐   | ⭐⭐⭐⭐   | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐    | Low    |
| **Java**    | Spring Boot  | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐    | Medium |
| **Python**  | FastAPI      | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐⭐   | ⭐⭐⭐⭐      | Low    |

### Key Learnings

#### What Works Well

- **Automatic API generation** (FastAPI, NestJS) from type annotations provides excellent DX
- **Compile-time API generation** (Rust utoipa, Java OpenAPI) catches inconsistencies early
- **Decorator/annotation patterns** (NestJS, Spring, FastAPI) provide clean, declarative APIs
- **Middleware architectures** enable clean separation of cross-cutting concerns
- **Type-safe validation** prevents runtime errors and improves developer experience
- **Structured logging** with OpenTelemetry provides excellent observability

#### Common Challenges

- **CloudEvents integration** varies significantly across ecosystems
  - Node.js: Excellent native support
  - .NET: Simple custom implementation works well, CloudNative.CloudEvents has compatibility issues
  - Rust: Custom implementation needed due to crate compatibility
  - Java/Spring: Good with dedicated libraries
- **JWT middleware complexity** requires framework-specific solutions

  - Some frameworks have excellent OAuth2 integration (NestJS, Spring, FastAPI, ASP.NET Core)
  - Others need custom middleware (Rust/Axum, Go)

- **Error handling standardization** across languages

  - Problem+JSON implementation varies in complexity
  - Type systems help (Rust, TypeScript, C#, Python with Pydantic) vs. runtime validation

- **Version targeting considerations**
  - Python 3.13 is very new - use 3.12 for best compatibility
  - .NET: Target latest available SDK version (adjust framework target as needed)
  - Mixed virtual environments (different Python versions) cause import failures

#### Performance Characteristics

- **Rust**: Fastest startup, lowest memory, highest throughput
- **.NET**: Excellent performance, fast startup, efficient memory usage, strong typing
- **Node.js**: Good performance, excellent ecosystem, fast development
- **Go**: Fast compilation, good performance, simple deployment
- **Java**: Mature ecosystem, excellent tooling, higher memory usage
- **Python**: Good development speed, moderate performance, excellent for data-heavy services

---

## �📏 Scope of v1

This version is intentionally strict and limited:

- **REST only** (no GraphQL, gRPC yet).
- **CloudEvents only** for events.
- **OAuth2 only** for authentication.
- **JSON only** for data format.
- **No workflows** (reserved for a future version).

---

Service Standard v1 was designed with **AI-assisted development** as a core consideration. The strict contracts, comprehensive specifications, and consistent patterns make it ideal for code generation tools.

### AI Development Success Factors

✅ **Clear specifications** - Detailed specs in `examples/*/spec.md` provide unambiguous requirements  
✅ **Reference implementations** - Existing examples serve as concrete patterns to follow  
✅ **Stack-specific guidance** - `stacks/*.md` files contain framework best practices  
✅ **Incremental validation** - Services can be built and tested step-by-step  
✅ **Consistent patterns** - Same architectural patterns across all languages

### Typical AI Generation Flow

1. **Context gathering** - AI reads readme, stack guide, and service spec
2. **Structure creation** - Generate project files, dependencies, basic structure
3. **Core implementation** - Authentication, health checks, error handling
4. **Business logic** - Service-specific features with proper validation
5. **Integration testing** - Verify all SSv1 requirements are met

Services generated with AI assistance typically achieve **90%+ compliance** on first generation, with remaining issues being primarily integration details rather than architectural problems.

---

## 🏗️ Benefits

- Replaceable implementations in any language.
- Predictable integration patterns.
- Centralized tooling for validation and generation.
- Strong interoperability across teams and services.
