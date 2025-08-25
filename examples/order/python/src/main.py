import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel

# Add parent directory to path for relative imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.telemetry import setup_telemetry, setup_logging, instrument_fastapi
from src.common.errors import (
    ServiceError,
    service_error_handler,
    http_exception_handler,
    validation_exception_handler
)
from src.health.health import router as health_router
from src.orders.router import router as orders_router

import structlog

# Setup logging and telemetry
setup_logging()
setup_telemetry()

logger = structlog.get_logger(__name__)


class ServiceInfo(BaseModel):
    name: str = "orders"
    version: str = "1.0.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Starting Orders Service", version="1.0.0")
    yield
    logger.info("Shutting down Orders Service")


# Create FastAPI app
app = FastAPI(
    title="Orders API",
    version="1.0.0",
    description="Orders Service - Service Standard v1 compliant",
    lifespan=lifespan
)

# Setup OpenTelemetry instrumentation
instrument_fastapi(app)

# Add exception handlers
app.add_exception_handler(ServiceError, service_error_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)


@app.get("/", response_model=ServiceInfo)
async def get_service_info():
    """Service information endpoint."""
    return ServiceInfo()


@app.get("/openapi.json")
async def get_openapi():
    """OpenAPI specification endpoint."""
    return app.openapi()


# Include routers
app.include_router(health_router)
app.include_router(orders_router)


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info("Starting server", host=host, port=port)
    
    uvicorn.run(
        "src.main:app",
        host=host,
        port=port,
        reload=True,
        log_config=None  # Use our structured logging
    )
