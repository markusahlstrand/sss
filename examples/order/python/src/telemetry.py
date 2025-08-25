import os
import structlog
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor


def setup_telemetry():
    """Initialize OpenTelemetry tracing and instrumentation."""
    # Create resource
    resource = Resource.create({
        "service.name": "orders",
        "service.version": "1.0.0",
    })
    
    # Set up tracer provider
    trace.set_tracer_provider(TracerProvider(resource=resource))
    tracer_provider = trace.get_tracer_provider()
    
    # Configure Jaeger exporter (optional for development)
    jaeger_endpoint = os.getenv("JAEGER_ENDPOINT")
    if jaeger_endpoint:
        jaeger_exporter = JaegerExporter(
            agent_host_name=jaeger_endpoint.split("://")[1].split(":")[0] if "://" in jaeger_endpoint else jaeger_endpoint.split(":")[0],
            agent_port=int(jaeger_endpoint.split(":")[-1]) if ":" in jaeger_endpoint else 14268,
        )
        span_processor = BatchSpanProcessor(jaeger_exporter)
        tracer_provider.add_span_processor(span_processor)
    
    # Set up logging instrumentation
    LoggingInstrumentor().instrument(set_logging_format=True)


def setup_logging():
    """Configure structured JSON logging."""
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def instrument_fastapi(app):
    """Instrument FastAPI with OpenTelemetry."""
    FastAPIInstrumentor.instrument_app(app)
