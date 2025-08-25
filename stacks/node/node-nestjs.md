# Node.js Stack with NestJS- Service Standard v1

- **Strongly opinionated** framework with built-in support for Service Standard v1 requirements
- **OpenAPI auto-generation** via `@nestjs/swagger`
- **Easy OAuth2/OIDC** integration with Passport.js (`@nestjs/passport`, `passport-jwt`)
- **Event publishing** integrations with Kafka, NATS, RabbitMQ
- **OpenTelemetry** support available
- **Built-in validation** with `class-validator` and `ValidationPipe`

## Service Standard v1 Implementation Requirements

### 1. Project Structure

```
src/
├── auth/                  # JWT authentication & authorization
├── common/filters/        # RFC 7807 error handling
├── events/               # CloudEvents publishing
├── health/               # Health check endpoints
├── [domain]/             # Business logic modules
├── main.ts               # App bootstrap with telemetry
└── telemetry.ts          # OpenTelemetry configuration
```

### 2. Required Dependencies

**Core NestJS:**

```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@nestjs/platform-express": "^10.0.0",
  "@nestjs/swagger": "^7.0.0"
}
```

**Authentication:**

```json
{
  "@nestjs/passport": "^10.0.0",
  "@nestjs/jwt": "^10.0.0",
  "passport": "^0.6.0",
  "passport-jwt": "^4.0.0"
}
```

**Validation:**

```json
{
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

**Logging & Observability:**

```json
{
  "winston": "^3.10.0",
  "nest-winston": "^1.9.4",
  "@opentelemetry/api": "^1.6.0",
  "@opentelemetry/auto-instrumentations-node": "^0.39.4",
  "@opentelemetry/sdk-node": "^0.43.0"
}
```

### 3. Validation Error Handling

**Global ValidationPipe Configuration:**

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
);
```

**Global Exception Filter for RFC 7807:**

- Must handle validation errors from `ValidationPipe`
- Extract detailed validation messages from NestJS exception response
- Return proper JSON structure with specific field errors in `detail` field
- Example implementation:

```typescript
case HttpStatus.BAD_REQUEST:
  let detail = "Invalid input";

  if (typeof exceptionResponse === "object" && exceptionResponse) {
    const response = exceptionResponse as any;
    if (response.message && Array.isArray(response.message)) {
      // NestJS ValidationPipe returns array of validation messages
      detail = response.message.join(", ");
    }
  }

  problemDetails = {
    type: "validation_error",
    title: "Validation Error",
    status,
    detail,
    instance: request.url,
  };
```

### 4. Required Endpoints

**Service Info (`GET /`):**

```typescript
@Get()
getServiceInfo() {
  return { name: 'service-name', version: '1.0.0' };
}
```

**OpenAPI JSON (`GET /openapi.json`):**

```typescript
// In main.ts bootstrap function
const document = SwaggerModule.createDocument(app, config);
app.getHttpAdapter().get("/openapi.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(document);
});
```

### 5. Authentication & Authorization

**JWT Strategy Implementation:**

- Validate bearer tokens
- Extract scopes from JWT payload
- Implement scope-based guards using decorators

**Scope-based Authorization:**

```typescript
@UseGuards(JwtAuthGuard, ScopesGuard)
@RequiredScopes('orders.write')
@Post()
createOrder(@Body() createOrderDto: CreateOrderDto) {
  // Implementation
}
```

### 6. Observability Requirements

**Structured JSON Logging:**

- Use Winston with custom format
- Include required fields: timestamp, level, service, trace_id, span_id, message

**OpenTelemetry Integration:**

- Auto-instrumentation setup
- W3C Trace Context support
- Span context extraction for logging

### 7. Health Checks

```typescript
@Get('healthz')
healthCheck() {
  return { status: 'ok' };
}

@Get('readyz')
readinessCheck() {
  // Add dependency checks if needed
  return { status: 'ready' };
}
```

### 8. Development Tools

**Test Token Generator:**

- Create utility script for generating JWT tokens with required scopes
- Include in `package.json` scripts: `"generate-token": "ts-node generate-test-token.ts"`

**Docker Support:**

- Multi-stage Dockerfile for production builds
- Development docker-compose.yml with environment setup

## Best Practices

1. **Use DTOs with validation decorators** from `class-validator`
2. **Implement proper error handling** with detailed validation messages
3. **Set up OpenTelemetry early** in the bootstrap process
4. **Use environment variables** for all configuration
5. **Implement comprehensive E2E tests** covering validation scenarios
6. **Document API usage examples** in README.md
