# NestJS Router - Service Standard v1

**NestJS** is a strongly opinionated TypeScript framework built on top of Express/Fastify that provides excellent support for Service Standard v1 requirements through decorators and dependency injection.

## Key Features

- **Strongly opinionated** framework with built-in support for Service Standard v1 requirements
- **OpenAPI auto-generation** via `@nestjs/swagger` decorators
- **Easy OAuth2/OIDC** integration with Passport.js (`@nestjs/passport`, `passport-jwt`)
- **Event publishing** integrations with Kafka, NATS, RabbitMQ
- **OpenTelemetry** support available
- **Built-in validation** with `class-validator` and `ValidationPipe`
- **Decorator-based** routing and middleware
- **Dependency injection** for clean architecture

## Required Dependencies

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

**Validation & Transformation:**

```json
{
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

**Observability:**

```json
{
  "winston": "^3.10.0",
  "nest-winston": "^1.9.4",
  "@opentelemetry/api": "^1.6.0",
  "@opentelemetry/auto-instrumentations-node": "^0.39.4",
  "@opentelemetry/sdk-node": "^0.43.0"
}
```

## Project Structure

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

## Implementation Patterns

### Controllers with OpenAPI

```typescript
@ApiTags("orders")
@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  @Get()
  @ApiOperation({ summary: "Get all orders" })
  @ApiResponse({ status: 200, type: [OrderDto] })
  @UseGuards(ScopesGuard)
  @RequiredScopes("orders.read")
  async getOrders(@Query() query: PaginationDto): Promise<OrderDto[]> {
    return this.ordersService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: "Create order" })
  @ApiResponse({ status: 201, type: OrderDto })
  @UseGuards(ScopesGuard)
  @RequiredScopes("orders.write")
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<OrderDto> {
    return this.ordersService.create(createOrderDto);
  }
}
```

### DTOs with Validation

```typescript
export class CreateOrderDto {
  @ApiProperty({ description: "Customer ID" })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ description: "Order items" })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsArray()
  @ArrayNotEmpty()
  items: OrderItemDto[];

  @ApiProperty({ description: "Total amount", example: 99.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  totalAmount: number;
}
```

### Global Exception Filter

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let problemDetails: any = {
      type: "internal_error",
      title: "Internal Server Error",
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: "An unexpected error occurred",
      instance: request.url,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      switch (status) {
        case HttpStatus.BAD_REQUEST:
          let detail = "Invalid input";
          if (typeof exceptionResponse === "object" && exceptionResponse) {
            const response = exceptionResponse as any;
            if (response.message && Array.isArray(response.message)) {
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
          break;
        // ... other cases
      }
    }

    response.status(status).json(problemDetails);
  }
}
```

### Authentication Setup

```typescript
// JWT Strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      scopes: payload.scopes || [],
    };
  }
}

// Scopes Guard
@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredScopes) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredScopes.some((scope) => user.scopes?.includes(scope));
  }
}
```

### Application Bootstrap

```typescript
// main.ts
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { WinstonModule } from "nest-winston";
import { initializeTelemetry } from "./telemetry";

async function bootstrap() {
  // Initialize telemetry first
  initializeTelemetry();

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      // Winston configuration
    }),
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // OpenAPI setup
  const config = new DocumentBuilder()
    .setTitle("Service API")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  // OpenAPI JSON endpoint
  app.getHttpAdapter().get("/openapi.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(document);
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```

## Strengths

- ✅ **Enterprise-ready** with comprehensive tooling
- ✅ **Type safety** with TypeScript throughout
- ✅ **Auto-generated OpenAPI** documentation
- ✅ **Built-in validation** with detailed error messages
- ✅ **Modular architecture** with dependency injection
- ✅ **Extensive ecosystem** with official packages
- ✅ **Testing utilities** built-in

## Considerations

- ⚠️ **Learning curve** - requires understanding of decorators and DI
- ⚠️ **Opinionated** - less flexibility than lightweight frameworks
- ⚠️ **Bundle size** - larger than minimal alternatives
- ⚠️ **Performance** - slight overhead compared to raw Express

## Best Use Cases

- **Large teams** requiring consistent patterns
- **Enterprise applications** with complex business logic
- **API-first development** with auto-documentation
- **Microservices** requiring standardized patterns
- **Teams familiar with Angular** (similar architecture)
