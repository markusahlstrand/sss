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

#### Node.js-Specific Pitfalls

- **Hono Version Compatibility** - Use Hono v4+ for latest ecosystem compatibility
  - Hono v4 required for `@hono/node-server` v1.19+, `@hono/zod-openapi` v0.17+
  - JWT middleware is built into Hono core - no need for separate `@hono/jwt` package
  - Update `@hono/swagger-ui` to v0.4+ for Hono v4 compatibility
- **Package Version Alignment** - CloudEvents and OpenTelemetry package versions matter
  - Use `cloudevents@^8.0.0` for Node.js 20+ support (v6 has Node version restrictions)
  - OpenTelemetry packages should be aligned: use latest v1.x versions consistently
- **Schema-First Development** - Leverage Zod for both validation AND OpenAPI generation
  - Define schemas first, then build routes around them for best type inference
  - Use `z.infer<>` for automatic TypeScript type generation from schemas
  - Transform functions in schemas (`.transform()`) provide data conversion and validation
- **Middleware Composition** - Hono middleware order matters for authentication flow
  - Apply `cors()` and logging middleware globally first
  - Apply `jwt()` authentication middleware before route-specific authorization
  - Use `requireScopes()` middleware after JWT validation for fine-grained access control
- **Error Handling Pattern** - Centralized error handler for consistent RFC 7807 responses
  - Handle `ZodError` specifically for validation errors with detailed field messages
  - Handle `HTTPException` for structured error responses with proper status codes
  - Use `createMiddleware()` pattern for reusable authorization logic

#### .NET-Specific Pitfalls

- **Framework Version Compatibility** - Use .NET 9.0 for latest features but adjust based on available SDK
  - Check `dotnet --version` and adjust `<TargetFramework>` in .csproj accordingly
  - Update package references to match framework version (e.g., Microsoft.AspNetCore.\* packages)
- **CloudEvents Package Issues** - CloudNative.CloudEvents.AspNetCore has compatibility issues
  - Use simple custom CloudEvents implementation with JSON serialization instead
  - Avoids version conflicts and provides better control over event structure
- **JWT Token Generation** - Integrate token generation into Program.cs main method
  - Handle command-line arguments for `--generate-tokens` and `--generate-token --scopes`
  - Use conditional compilation with Environment.Exit(0) for token-only execution
- **Package Reference Versions** - ASP.NET Core package versions must align with framework
  - Microsoft.AspNetCore.\* packages should match .NET version (8.0.x for net8.0, 9.0.x for net9.0)
  - Serilog and OpenTelemetry packages are more version-agnostic
- **Global Exception Handling** - Use middleware pattern instead of filters
  - Implement custom middleware class in Common/ folder
  - Register with `app.UseMiddleware<GlobalExceptionMiddleware>()`
- **Swagger Integration** - Use `ISwaggerProvider` from `Swashbuckle.AspNetCore.Swagger`
  - Add to using statements and inject into minimal API endpoints
  - Configure both Swagger UI and JSON endpoint for OpenAPI specification

#### Python-Specific Pitfalls

- **Python Version Compatibility** - Use Python 3.12 for best package compatibility
  - Python 3.13 may cause pydantic-core compilation issues
  - Always create virtual environment with consistent Python version
- **Import Structure** - Use absolute imports in main.py for direct execution
  - Add `sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))` for relative imports
- **Virtual Environment Issues** - Mixed Python versions cause import failures
  - If getting "ModuleNotFoundError" despite pip showing packages installed
  - Check `which python` vs `which pip` point to same environment
  - Recreate venv if Python versions don't match
- **Package Installation** - Use `pip install --only-binary=:all:` for compilation issues
- **FastAPI Structure** - Leverage dependency injection for auth and validation
  - Use Pydantic models for automatic OpenAPI generation
  - Implement RFC 7807 error handlers as FastAPI exception handlers

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

### Quick Dependencies (package.json for Hono + Zod)

```json
{
  "dependencies": {
    "hono": "^4.0.0",
    "@hono/zod-openapi": "^0.17.0",
    "@hono/swagger-ui": "^0.4.0",
    "@hono/node-server": "^1.19.0",
    "zod": "^3.22.4",
    "jsonwebtoken": "^9.0.2",
    "@opentelemetry/api": "^1.6.0",
    "@opentelemetry/auto-instrumentations-node": "^0.39.4",
    "@opentelemetry/sdk-node": "^0.43.0",
    "@opentelemetry/resources": "^1.18.0",
    "@opentelemetry/semantic-conventions": "^1.18.0",
    "winston": "^3.10.0",
    "cloudevents": "^8.0.0",
    "uuid": "^9.0.1"
  }
}
```

### Quick Dependencies (.csproj for .NET)

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.0.8" />
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="9.0.8" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.7.0" />
    <PackageReference Include="Serilog.AspNetCore" Version="8.0.2" />
    <PackageReference Include="Serilog.Formatting.Compact" Version="3.0.0" />
    <PackageReference Include="OpenTelemetry.Extensions.Hosting" Version="1.9.0" />
    <PackageReference Include="OpenTelemetry.Instrumentation.AspNetCore" Version="1.9.0" />
    <PackageReference Include="OpenTelemetry.Exporter.Jaeger" Version="1.5.1" />
    <PackageReference Include="Microsoft.Extensions.Diagnostics.HealthChecks" Version="9.0.8" />
    <PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.0.2" />
  </ItemGroup>
</Project>
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

### Quick Dependencies (requirements.txt for Python)

```txt
# Core FastAPI dependencies
fastapi>=0.104.1,<0.112.0
uvicorn[standard]>=0.24.0,<0.31.0
pydantic>=2.5.0,<3.0.0
python-multipart>=0.0.6,<0.1.0

# Authentication
python-jose[cryptography]>=3.3.0,<4.0.0

# Logging
structlog>=23.2.0,<25.0.0

# OpenTelemetry
opentelemetry-api>=1.21.0,<2.0.0
opentelemetry-sdk>=1.21.0,<2.0.0
opentelemetry-instrumentation-fastapi>=0.42b0,<1.0.0
opentelemetry-instrumentation-logging>=0.42b0,<1.0.0
opentelemetry-exporter-jaeger-thrift>=1.21.0,<2.0.0

# Events
cloudevents>=1.10.1,<2.0.0

# Configuration
python-dotenv>=1.0.0,<2.0.0
PyYAML>=6.0,<7.0.0

# Testing
pytest>=7.4.3,<9.0.0
pytest-asyncio>=0.21.1,<1.0.0
httpx>=0.25.2,<1.0.0
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
   - .NET: `bin/`, `obj/`, `*.dll`, `*.exe`, `*.pdb`, `*.user`, `*.suo`, `.vs/`
   - Rust: `target/` directory, compiled binaries (`.exe`, `.dll`, `.so`, `.dylib`)
   - Go: compiled binaries, `vendor/` (if using)
   - Java: `target/`, `*.class`, `*.jar` (build artifacts)
   - Python: `__pycache__/`, `*.pyc`, `.env`, `.venv/`, `venv/`
2. Run `npm install && npm run build` (or language equivalent) to verify:
   - .NET: `dotnet build && dotnet run -- --generate-tokens`
   - Python: `pip install -r requirements.txt && python -c "from src.main import app; print('✅ Success')"`
3. Create simple test script or examples
4. Document any technology-specific considerations
5. Suggest next steps for productionization (database, message broker, etc.)

### Recent Successes

#### .NET ASP.NET Core Implementation ✅

The .NET ASP.NET Core implementation (August 2025) was successfully generated and is fully operational:

- **Full Service Standard v1 compliance** achieved with excellent developer experience
- **Key strength**: Strong type safety with compile-time validation catches errors early
- **CloudEvents solution**: Custom implementation works better than CloudNative.CloudEvents package
- **JWT integration**: Built-in ASP.NET Core authentication provides excellent OAuth2/JWT support
- **Architecture success**: Clean domain-driven structure with middleware pipeline for cross-cutting concerns
- **Performance**: Fast startup, efficient memory usage, excellent scalability
- **All endpoints working**: Authentication, error handling, events, health checks, Swagger UI
- **Production ready**: Docker setup, comprehensive documentation, structured logging with OpenTelemetry

#### Node.js Hono + Zod OpenAPI Implementation ✅

The Node.js Hono + Zod OpenAPI implementation (August 2025) was successfully generated and is fully operational:

- **Full Service Standard v1 compliance** achieved with modern edge-ready architecture
- **Key innovation**: Schema-first development with automatic OpenAPI generation and full TypeScript inference
- **Performance excellence**: Ultra-fast with minimal bundle size, optimized for serverless/edge deployment
- **Package compatibility**: Hono v4+ required for latest `@hono/node-server` compatibility, JWT middleware built into core
- **Developer experience**: Exceptional type safety, sub-second builds, comprehensive tooling
- **All endpoints working**: Authentication, error handling, events, health checks, interactive documentation
- **Production ready**: Docker setup, edge deployment ready, comprehensive observability

#### Python FastAPI Implementation ✅

The Python FastAPI implementation (August 2025) was successfully generated and is fully operational:

- **Full Service Standard v1 compliance** achieved
- **Key challenge resolved**: Mixed Python environment (3.12 vs 3.13) causing import failures
- **Solution**: Recreated virtual environment with consistent Python version
- **Import fix**: Used absolute imports with sys.path manipulation for direct script execution
- **All endpoints working**: Authentication, error handling, events, health checks
- **Production ready**: Docker setup, comprehensive tests, structured logging

---

_This file should be updated with learnings from each service generation session to improve future AI assistance._
