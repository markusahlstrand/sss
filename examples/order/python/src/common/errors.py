from typing import Optional, Dict, Any
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import structlog

logger = structlog.get_logger(__name__)


class ProblemDetails(BaseModel):
    """RFC 7807 Problem Details for HTTP APIs."""
    type: str
    title: str
    status: int
    detail: Optional[str] = None
    instance: Optional[str] = None


class ErrorType:
    """Standard error types for Service Standard v1."""
    VALIDATION_ERROR = "validation_error"
    UNAUTHORIZED = "unauthorized"
    FORBIDDEN = "forbidden"
    NOT_FOUND = "not_found"
    CONFLICT = "conflict"
    INTERNAL_ERROR = "internal_error"


class ServiceError(Exception):
    """Base service error with RFC 7807 support."""
    def __init__(
        self,
        error_type: str,
        title: str,
        status: int,
        detail: Optional[str] = None,
        instance: Optional[str] = None
    ):
        self.error_type = error_type
        self.title = title
        self.status = status
        self.detail = detail
        self.instance = instance
        super().__init__(detail or title)

    def to_problem_details(self) -> ProblemDetails:
        return ProblemDetails(
            type=self.error_type,
            title=self.title,
            status=self.status,
            detail=self.detail,
            instance=self.instance
        )


class ValidationError(ServiceError):
    def __init__(self, detail: str, instance: Optional[str] = None):
        super().__init__(
            error_type=ErrorType.VALIDATION_ERROR,
            title="Validation Error",
            status=400,
            detail=detail,
            instance=instance
        )


class UnauthorizedError(ServiceError):
    def __init__(self, detail: str = "Missing or invalid authorization token", instance: Optional[str] = None):
        super().__init__(
            error_type=ErrorType.UNAUTHORIZED,
            title="Unauthorized",
            status=401,
            detail=detail,
            instance=instance
        )


class ForbiddenError(ServiceError):
    def __init__(self, detail: str = "Insufficient permissions to access this resource", instance: Optional[str] = None):
        super().__init__(
            error_type=ErrorType.FORBIDDEN,
            title="Forbidden",
            status=403,
            detail=detail,
            instance=instance
        )


class NotFoundError(ServiceError):
    def __init__(self, detail: str, instance: Optional[str] = None):
        super().__init__(
            error_type=ErrorType.NOT_FOUND,
            title="Not Found",
            status=404,
            detail=detail,
            instance=instance
        )


class ConflictError(ServiceError):
    def __init__(self, detail: str, instance: Optional[str] = None):
        super().__init__(
            error_type=ErrorType.CONFLICT,
            title="Conflict",
            status=409,
            detail=detail,
            instance=instance
        )


class InternalError(ServiceError):
    def __init__(self, detail: str = "An unexpected error occurred", instance: Optional[str] = None):
        super().__init__(
            error_type=ErrorType.INTERNAL_ERROR,
            title="Internal Server Error",
            status=500,
            detail=detail,
            instance=instance
        )


async def service_error_handler(request: Request, exc: ServiceError) -> JSONResponse:
    """Handle ServiceError exceptions with RFC 7807 format."""
    problem = exc.to_problem_details()
    
    logger.error(
        "Service error occurred",
        error_type=problem.type,
        status=problem.status,
        detail=problem.detail,
        instance=problem.instance,
        path=str(request.url.path)
    )
    
    return JSONResponse(
        status_code=problem.status,
        content=problem.dict(exclude_none=True),
        media_type="application/problem+json"
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Convert HTTPException to RFC 7807 format."""
    # Map HTTP status codes to error types
    error_type_map = {
        400: ErrorType.VALIDATION_ERROR,
        401: ErrorType.UNAUTHORIZED,
        403: ErrorType.FORBIDDEN,
        404: ErrorType.NOT_FOUND,
        409: ErrorType.CONFLICT,
        500: ErrorType.INTERNAL_ERROR,
    }
    
    title_map = {
        400: "Bad Request",
        401: "Unauthorized", 
        403: "Forbidden",
        404: "Not Found",
        409: "Conflict",
        500: "Internal Server Error",
    }
    
    error_type = error_type_map.get(exc.status_code, ErrorType.INTERNAL_ERROR)
    title = title_map.get(exc.status_code, "Error")
    
    problem = ProblemDetails(
        type=error_type,
        title=title,
        status=exc.status_code,
        detail=str(exc.detail),
        instance=str(request.url.path)
    )
    
    logger.error(
        "HTTP exception occurred",
        error_type=problem.type,
        status=problem.status,
        detail=problem.detail,
        instance=problem.instance,
        path=str(request.url.path)
    )
    
    return JSONResponse(
        status_code=problem.status,
        content=problem.dict(exclude_none=True),
        media_type="application/problem+json"
    )


async def validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle Pydantic validation errors."""
    detail_messages = []
    
    # Handle FastAPI validation errors
    if hasattr(exc, 'errors'):
        for error in exc.errors():
            loc = error.get('loc', [])
            msg = error.get('msg', '')
            field = '.'.join(str(x) for x in loc if str(x) != 'body')
            if field:
                detail_messages.append(f"{field}: {msg}")
            else:
                detail_messages.append(msg)
    else:
        detail_messages.append(str(exc))
    
    detail = ", ".join(detail_messages)
    
    problem = ProblemDetails(
        type=ErrorType.VALIDATION_ERROR,
        title="Validation Error",
        status=422,
        detail=detail,
        instance=str(request.url.path)
    )
    
    logger.error(
        "Validation error occurred",
        error_type=problem.type,
        status=problem.status,
        detail=problem.detail,
        instance=problem.instance,
        path=str(request.url.path)
    )
    
    return JSONResponse(
        status_code=problem.status,
        content=problem.dict(exclude_none=True),
        media_type="application/problem+json"
    )
