// Import telemetry first
import "./telemetry";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { WinstonModule } from "nest-winston";
import * as winston from "winston";
import { trace } from "@opentelemetry/api";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";

async function bootstrap() {
  // Setup Winston logger with structured JSON format
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
          winston.format.printf(
            ({
              timestamp,
              level,
              message,
              service = "orders",
              trace_id,
              span_id,
              ...meta
            }) => {
              const logEntry = {
                timestamp,
                level: level.toUpperCase(),
                service,
                trace_id,
                span_id,
                message,
                ...meta,
              };
              return JSON.stringify(logEntry);
            }
          )
        ),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Global exception filter for RFC 7807 Problem+JSON error handling
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger/OpenAPI setup
  const config = new DocumentBuilder()
    .setTitle("Orders API")
    .setDescription("Orders Service - Service Standard v1 compliant")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-docs", app, document);

  // Expose OpenAPI JSON at /openapi.json
  app.getHttpAdapter().get("/openapi.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(document);
  });

  // Add tracing context to requests
  app.use((req, res, next) => {
    const span = trace.getActiveSpan();
    if (span) {
      const spanContext = span.spanContext();
      req.traceId = spanContext.traceId;
      req.spanId = spanContext.spanId;
    }
    next();
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Orders Service is running on port ${port}`, "Bootstrap");
}

bootstrap();
