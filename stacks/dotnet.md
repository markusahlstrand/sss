🟦 .NET (C#)

✅ Excellent choice for enterprise applications and Microsoft ecosystems.

## Framework & Architecture

- **ASP.NET Core Web API** - High-performance, cross-platform web framework
- **Controller-based routing** with attribute-based configuration
- **Built-in dependency injection** with service registration
- **Middleware pipeline** for cross-cutting concerns
- **Strong type safety** with C# records and nullable reference types

## Service Standard v1 Implementation

### OpenAPI Generation

- **Swashbuckle.AspNetCore** for automatic OpenAPI specification generation
- **Attribute-based documentation** with XML comments support
- **Security scheme configuration** for JWT bearer tokens
- **Response type annotations** for comprehensive API documentation

### Authentication & Authorization

- **Microsoft.AspNetCore.Authentication.JwtBearer** for JWT validation
- **Policy-based authorization** with scope requirements
- **Built-in OAuth2/OIDC support** for enterprise integrations
- **Custom JWT token generators** for development/testing

### Logging & Observability

- **Serilog.AspNetCore** for structured JSON logging
- **Native OpenTelemetry support** with automatic instrumentation
- **Built-in health checks** with Microsoft.Extensions.Diagnostics.HealthChecks
- **Trace context propagation** with W3C standards

### Error Handling

- **Global exception middleware** for consistent error responses
- **RFC 7807 Problem Details** with Microsoft.AspNetCore.Mvc.ProblemDetails
- **Custom exception types** mapped to HTTP status codes
- **Model validation** with System.ComponentModel.DataAnnotations

## Key Dependencies

```xml
<!-- Core ASP.NET Core -->
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.0.8" />
<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="9.0.8" />

<!-- OpenAPI/Swagger -->
<PackageReference Include="Swashbuckle.AspNetCore" Version="6.7.0" />

<!-- Logging -->
<PackageReference Include="Serilog.AspNetCore" Version="8.0.2" />
<PackageReference Include="Serilog.Formatting.Compact" Version="3.0.0" />

<!-- Observability -->
<PackageReference Include="OpenTelemetry.Extensions.Hosting" Version="1.9.0" />
<PackageReference Include="OpenTelemetry.Instrumentation.AspNetCore" Version="1.9.0" />
<PackageReference Include="OpenTelemetry.Exporter.Jaeger" Version="1.5.1" />

<!-- Health Checks -->
<PackageReference Include="Microsoft.Extensions.Diagnostics.HealthChecks" Version="9.0.8" />

<!-- JWT -->
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.0.2" />
```

## Implementation Patterns

### Project Structure

```
{Domain}/            # Domain logic with models, services, controllers
Auth/               # JWT utilities and authentication components
Common/             # Shared exceptions and middleware
Events/             # CloudEvents publishing service
Health/             # Health check controllers
```

### JWT Authentication Setup

```csharp
// JWT Configuration
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(jwtKey),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

// Scope-based authorization
builder.Services.AddAuthorization(options => {
    options.AddPolicy("{service}.read", policy =>
        policy.RequireClaim("scope", "{service}.read"));
});
```

### CloudEvents Implementation

```csharp
// Simple CloudEvents-compatible structure
var cloudEvent = new {
    specversion = "1.0",
    type = eventType,
    source = "https://{service-name}/events",
    id = Guid.NewGuid().ToString(),
    time = DateTimeOffset.UtcNow.ToString("O"),
    data = eventData
};
```

## Development Experience

### Strengths

- **Excellent IDE support** with IntelliSense and debugging
- **Compile-time validation** catches errors early
- **Hot reload** for fast development cycles
- **Strong typing** prevents runtime errors
- **Rich ecosystem** of NuGet packages
- **Automatic OpenAPI generation** from controllers

### Best Practices

- Use **C# records** for immutable DTOs
- Implement **global exception middleware** for error handling
- Use **policy-based authorization** for scope validation
- Structure projects by **domain boundaries**
- Leverage **built-in dependency injection**

### Version Considerations

- **Target .NET 9.0** for latest features (adjust based on available SDK)
- **CloudNative.CloudEvents** package may have version compatibility issues
- Consider **custom CloudEvents implementation** for better control

## Performance Characteristics

- ⚡ **Fast startup time** with minimal overhead
- 🔋 **Efficient memory usage** compared to other enterprise frameworks
- 🚀 **High throughput** with async/await patterns
- 📊 **Excellent scalability** with built-in connection pooling
- 🎯 **Low latency** HTTP processing

## Production Readiness

- **Docker support** with multi-stage builds
- **Health check integration** with container orchestrators
- **Configuration providers** for various sources (env vars, Azure Key Vault, etc.)
- **Metrics collection** with built-in counters
- **Logging providers** for centralized log aggregation
  ✅ Great if you’re in a Microsoft ecosystem.

- ASP.NET Core Web API

- OpenAPI via Swashbuckle.

- Built-in OAuth2/OIDC support.

- Structured logging via Serilog.

- Native OpenTelemetry support.
