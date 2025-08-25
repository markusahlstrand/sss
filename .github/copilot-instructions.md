# GitHub Copilot Instructions for Service Standard v1

## Overview

This repository implements **Service Standard v1** - a strict contract for designing backend services that are replaceable and compatible across any programming language.

## AI-Assisted Service Generation

### Quick Start Prompt

When asked to generate a new service, use this pattern:

```
Can you generate [framework] app in the examples/[service]/[language] folder based on the stacks/[language].md stack and the examples/[service]/spec.md spec and the readme.md instructions?
```

### Key Files to Always Read First

1. `/readme.md` - Core Service Standard v1 requirements
2. `/stacks/[language].md` - Technology stack guidelines
3. `/examples/[service]/spec.md` - Service specification
4. Existing implementations for reference patterns

## Service Standard v1 Compliance Checklist

### ✅ Required Components

Every generated service MUST include:

#### 1. API (REST)

- [ ] OpenAPI 3.0+ specification (`openapi.yaml`)
- [ ] Content-Type: `application/json` only
- [ ] Resource-oriented paths (`/resource/{id}`)
- [ ] Pagination with `limit` + `offset`
- [ ] JSON Schema for all requests/responses
- [ ] Service info endpoint (`GET /`) returning `{"name": "service-name", "version": "1.0.0"}`
- [ ] OpenAPI JSON endpoint (`GET /openapi.json`) exposing the API specification

#### 2. Authentication

- [ ] OAuth2/OIDC bearer token support
- [ ] `Authorization: Bearer <token>` header
- [ ] Scope-based authorization
- [ ] JWT strategy implementation

#### 3. Error Handling

- [ ] RFC 7807 Problem+JSON format
- [ ] Required error types: `validation_error`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `internal_error`
- [ ] Global exception filter/handler

#### 4. Events

- [ ] CloudEvents JSON format
- [ ] AsyncAPI 2.0+ specification (`asyncapi.yaml`)
- [ ] Event publishing service
- [ ] JSON Schema validation for payloads

#### 5. Logging & Observability

- [ ] Structured JSON logs with required fields:
  - `timestamp`, `level`, `service`, `trace_id`, `span_id`, `message`
- [ ] OpenTelemetry integration
- [ ] W3C Trace Context support

#### 6. Health & Lifecycle

- [ ] `/healthz` - liveness probe
- [ ] `/readyz` - readiness probe
- [ ] Environment variable configuration only
- [ ] Stateless design

#### 7. Service Manifest

- [ ] `service.yaml` with all metadata
- [ ] API and event contract references
- [ ] Required scopes declaration

## Implementation Patterns

### Project Structure

```
examples/[service]/[language]/
├── src/
│   ├── auth/              # Authentication & authorization
│   ├── common/filters/    # RFC 7807 error handling
│   ├── events/            # CloudEvents publishing
│   ├── health/            # Health check endpoints
│   ├── [domain]/          # Business logic
│   ├── main.ts            # App bootstrap with telemetry
│   └── telemetry.ts       # OpenTelemetry setup
├── service.yaml           # Service manifest
├── openapi.yaml          # API specification
├── asyncapi.yaml         # Event specification
├── Dockerfile            # Container image
├── docker-compose.yml    # Development environment
├── README.md             # Setup & usage guide
└── IMPLEMENTATION.md     # Standards compliance summary
```

### Key Technical Decisions

#### NestJS Stack

- Use `@nestjs/swagger` for OpenAPI auto-generation
- Implement JWT strategy with `@nestjs/passport`
- Use Winston for structured logging with `nest-winston`
- Add OpenTelemetry auto-instrumentation
- Create scope-based guards and decorators
- Global validation pipes with `class-validator`
- Expose OpenAPI JSON via `app.getHttpAdapter().get('/openapi.json', (req, res) => res.send(document))`

#### Error Handling

- Create global exception filter implementing RFC 7807
- Map HTTP status codes to required error types
- Include `type`, `title`, `status`, `detail`, `instance` fields

#### Events

- Use CloudEvents v1.0 format with required fields
- Implement event service with proper typing
- Log events during development (replace with message broker in production)

#### Development Experience

- Include test JWT token generator
- Provide API usage examples script
- Add comprehensive E2E tests
- Create development docker-compose setup

## Performance Optimizations

### Code Generation Strategy

1. **Read all specs first** - readme.md, stack guide, service spec
2. **Create core structure** - package.json, config files, directories
3. **Generate in logical order** - auth → health → events → business logic
4. **Build incrementally** - verify compilation at each major step
5. **Test early** - run builds and basic tests to catch issues

### Common Pitfalls to Avoid

- Don't generate files with missing imports - create all dependencies first
- Don't skip OpenTelemetry setup - it's required for compliance
- Don't forget scope enforcement - authentication without authorization is incomplete
- Don't hardcode values - use environment variables for all configuration
- Don't skip error types - all 6 RFC 7807 error types are mandatory

#### Rust-Specific Pitfalls

- **Cargo features** - Always specify needed features (e.g., `serde = ["derive"]`)
- **CloudEvents** - Native crates have compatibility issues, implement custom structs
- **Swagger UI** - utoipa-swagger-ui has integration challenges, serve OpenAPI JSON directly
- **Error conversion** - Implement proper `From` traits for error type conversion
- **Shared state** - Use `Arc<T>` and `RwLock<T>` instead of fighting borrowing rules
- **Middleware integration** - Custom Tower middleware needed for complex auth scenarios

## File Templates

### Quick Dependencies (package.json)

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "winston": "^3.10.0",
    "nest-winston": "^1.9.4",
    "@opentelemetry/api": "^1.6.0",
    "@opentelemetry/auto-instrumentations-node": "^0.39.4",
    "@opentelemetry/sdk-node": "^0.43.0"
  }
}
```

### Quick Dependencies (Cargo.toml for Rust)

```toml
[dependencies]
axum = { version = "0.7", features = ["macros"] }
tokio = { version = "1.0", features = ["full"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace", "request-id"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["json", "env-filter"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
uuid = { version = "1.0", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
anyhow = "1.0"
thiserror = "1.0"
jsonwebtoken = "9.0"
utoipa = { version = "4.0", features = ["axum_extras", "chrono", "uuid"] }
opentelemetry = "0.23"
opentelemetry_sdk = { version = "0.23", features = ["rt-tokio"] }
opentelemetry-jaeger = { version = "0.22", features = ["rt-tokio"] }
tracing-opentelemetry = "0.24"
validator = { version = "0.18", features = ["derive"] }
async-trait = "0.1"
once_cell = "1.19"
```

### Service Manifest Template

```yaml
name: [service-name]
version: 1.0.0
owner: team-[service-name]
api: ./openapi.yaml
events: ./asyncapi.yaml
auth:
  required_scopes:
    - [service].read
    - [service].write
```

## Success Metrics

A successful generation includes:

- ✅ Clean `npm run build` with no errors
- ✅ All Service Standard v1 requirements implemented
- ✅ Comprehensive documentation and examples
- ✅ Working authentication and authorization
- ✅ Proper error handling with RFC 7807 format
- ✅ Event publishing with CloudEvents format
- ✅ Health check endpoints functional
- ✅ OpenTelemetry integration working
- ✅ Tests demonstrating key functionality

## Follow-up Actions

After generation, always:

1. **Add appropriate .gitignore entries** - Ensure language-specific build artifacts are excluded:
   - Node.js: `node_modules/`, `dist/`, `.env` files
   - Rust: `target/` directory, compiled binaries (`.exe`, `.dll`, `.so`, `.dylib`)
   - Go: compiled binaries, `vendor/` (if using)
   - Java: `target/`, `*.class`, `*.jar` (build artifacts)
   - Python: `__pycache__/`, `*.pyc`, `.env`, `venv/`
2. Run `npm install && npm run build` (or language equivalent) to verify
3. Create simple test script or examples
4. Document any technology-specific considerations
5. Suggest next steps for productionization (database, message broker, etc.)

---

_This file should be updated with learnings from each service generation session to improve future AI assistance._
