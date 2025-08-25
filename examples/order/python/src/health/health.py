from fastapi import APIRouter
from pydantic import BaseModel
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter()


class HealthResponse(BaseModel):
    status: str = "ok"


@router.get("/healthz", response_model=HealthResponse)
async def liveness_check():
    """Liveness probe - checks if the service is running."""
    logger.debug("Liveness check requested")
    return HealthResponse(status="ok")


@router.get("/readyz", response_model=HealthResponse) 
async def readiness_check():
    """Readiness probe - checks if the service is ready to accept requests."""
    # In a real application, you might check:
    # - Database connectivity
    # - External service dependencies
    # - Configuration validity
    # etc.
    
    logger.debug("Readiness check requested")
    return HealthResponse(status="ok")
