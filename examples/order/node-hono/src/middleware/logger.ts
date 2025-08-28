import { createMiddleware } from "hono/factory";
import winston from "winston";
import { trace } from "@opentelemetry/api";

// Configure Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "orders-service" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export const loggerMiddleware = createMiddleware(async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const url = c.req.url;

  // Get trace context
  const activeSpan = trace.getActiveSpan();
  const traceId = activeSpan?.spanContext().traceId || "unknown";
  const spanId = activeSpan?.spanContext().spanId || "unknown";

  // Log request start
  logger.info("Request started", {
    method,
    url,
    trace_id: traceId,
    span_id: spanId,
  });

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  // Log request completion
  logger.info("Request completed", {
    method,
    url,
    status,
    duration,
    trace_id: traceId,
    span_id: spanId,
  });
});

export { logger };
