from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from typing import Union
import logging

logger = logging.getLogger(__name__)

class APIErrorDetail:
    def __init__(self, message: str, code: str = None, details: dict = None):
        self.message = message
        self.code = code
        self.details = details

class StandardizedHTTPError(Exception):
    def __init__(self, status_code: int, detail: Union[str, APIErrorDetail]):
        self.status_code = status_code
        self.detail = detail
        super().__init__(str(detail) if isinstance(detail, str) else detail.message)

async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Global handler for HTTPException
    """
    logger.error(f"HTTP Exception: status={exc.status_code}, detail={exc.detail}")
    
    # Format error response according to standard
    error_response = {
        "error": {
            "message": exc.detail if isinstance(exc.detail, str) else str(exc.detail),
            "code": "HTTP_ERROR",
            "status_code": exc.status_code,
        }
    }
    
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response
    )

async def validation_exception_handler(request: Request, exc: Exception):
    """
    Global handler for validation errors (like Pydantic validation)
    """
    logger.error(f"Validation Exception: {exc}")
    
    error_response = {
        "error": {
            "message": "Validation error in request data",
            "code": "VALIDATION_ERROR",
            "status_code": 422,
            "details": {
                "errors": [
                    {
                        "field": err.get("loc", ["unknown"])[-1] if isinstance(err, dict) else "unknown",
                        "message": err.get("msg", "Invalid input") if isinstance(err, dict) else str(err),
                        "type": err.get("type", "validation_error") if isinstance(err, dict) else "validation_error"
                    }
                    for err in (exc.errors() if hasattr(exc, 'errors') else [])
                ]
            }
        }
    }
    
    return JSONResponse(
        status_code=422,
        content=error_response
    )

async def general_exception_handler(request: Request, exc: Exception):
    """
    Global handler for unexpected exceptions
    """
    logger.error(f"Unexpected Exception: {exc}", exc_info=True)
    
    error_response = {
        "error": {
            "message": "An unexpected error occurred",
            "code": "INTERNAL_ERROR",
            "status_code": 500,
        }
    }
    
    return JSONResponse(
        status_code=500,
        content=error_response
    )

def add_error_handlers(app):
    """
    Add standardized error handlers to the FastAPI app
    """
    from fastapi.exceptions import RequestValidationError
    from starlette.exceptions import HTTPException as StarletteHTTPException
    
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
    
    return app