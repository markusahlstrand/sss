# Rust

✅ For performance-critical services with safety guarantees.

## Recommended Stack

### Web Framework

- **Axum 0.7+** (preferred) - Modern, performant, and built on Tower ecosystem
- Features needed: `["macros"]` for routing derives
- Alternative: Actix Web (more mature but heavier)

### OpenAPI Generation

- **utoipa 4.0+** - Compile-time OpenAPI generation with derive macros
- Features: `["axum_extras", "chrono", "uuid"]` for full integration
- Generates both OpenAPI JSON and interactive documentation
- Type-safe: API docs stay in sync with code

### Authentication & Authorization

- **jsonwebtoken 9.0** - Standard JWT validation and creation
- **tower-http** - Middleware for request processing
- Custom middleware pattern works well for OAuth2/OIDC integration

### Error Handling

- **thiserror 1.0** - Ergonomic custom error types with derive macros
- **anyhow 1.0** - Flexible error handling for application errors
- **validator 0.18** - Request validation with derive support

### Async Runtime & HTTP

- **tokio 1.0** with `["full"]` features - Complete async runtime
- **tower 0.4** - Service abstraction layer
- **tower-http 0.5** - HTTP middleware (`["cors", "trace", "request-id"]`)

### Observability

- **tracing 0.1** - Structured logging and instrumentation
- **tracing-subscriber 0.3** with `["json", "env-filter"]` - JSON logs and filtering
- **tracing-opentelemetry 0.24** - OpenTelemetry integration
- **opentelemetry 0.23** + **opentelemetry_sdk 0.23** - Distributed tracing

### Serialization & Data

- **serde 1.0** with `["derive"]` - JSON serialization
- **serde_json 1.0** - JSON processing
- **uuid 1.0** with `["v4", "serde"]` - UUID generation and serialization
- **chrono 0.4** with `["serde"]` - Date/time handling

### Development Utilities

- **once_cell 1.19** - Lazy static initialization
- **async-trait 0.1** - Async traits

## Key Learnings

### Strengths

- **Excellent type safety** - Compile-time guarantees prevent runtime errors
- **Outstanding performance** - Near-C performance with memory safety
- **Rich ecosystem** - Tower/Axum ecosystem is mature and well-integrated
- **Zero-cost abstractions** - High-level code compiles to efficient machine code
- **Automatic API documentation** - utoipa generates OpenAPI from types

### Challenges & Solutions

- **Compilation complexity** - Rust has strict borrowing rules

  - Solution: Use `Arc<T>` and `RwLock<T>` for shared state
  - Clone cheaply with `Arc::clone()` instead of fighting the borrow checker

- **CloudEvents integration** - Native CloudEvents crates have compatibility issues

  - Solution: Implement custom CloudEvents-compatible structs
  - Alternative: Use serde_json directly for event serialization

- **Swagger UI integration** - utoipa-swagger-ui has version compatibility issues

  - Solution: Serve OpenAPI JSON at `/openapi.json`, use external Swagger UI
  - Alternative: Generate static HTML documentation

- **JWT middleware** - Complex to integrate with Axum's type system
  - Solution: Custom Tower middleware with proper error conversion
  - Use extractors for authorization checks in handlers

### Best Practices

1. **Feature flags** - Always specify needed features to reduce compile time
2. **Error conversion** - Implement `From` traits for error type conversion
3. **Instrumentation** - Use `#[instrument]` macro for automatic tracing
4. **Validation** - Use validator derives for automatic request validation
5. **State management** - Use `Arc<T>` for shared application state

### Development Experience

- **Fast iteration** - `cargo check` provides quick feedback
- **Excellent tooling** - rust-analyzer provides great IDE support
- **Clear error messages** - Compiler errors guide you to solutions
- **Memory safety** - No garbage collector, no memory leaks
- **Concurrency** - Tokio provides excellent async/await support

### Production Considerations

- **Small binaries** - Results in minimal container images
- **Low memory usage** - No garbage collection overhead
- **High throughput** - Can handle thousands of concurrent connections
- **Resource efficient** - Ideal for cloud-native deployments

## Ecosystem Maturity

- **Web frameworks** - Axum is production-ready and actively maintained
- **OpenAPI** - utoipa provides comprehensive OpenAPI 3.0+ support
- **Observability** - Full OpenTelemetry integration available
- **Authentication** - JWT and OAuth2 well-supported
- **Still evolving** - Some integrations require custom solutions, but core is solid

## When to Choose Rust

- High-performance requirements
- Memory-constrained environments
- Team comfortable with systems programming concepts
- Long-running services where efficiency matters
- When compile-time safety guarantees are valuable
