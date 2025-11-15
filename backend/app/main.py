from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import logging
from dotenv import load_dotenv
from app.db import get_session
from app.api.api import api_router
from app.auth_utils import require_auth

# Load .env file from the 'backend' directory
load_dotenv()

# Minimal logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Voice Agent Portal API",
    description="Backend services for the Agentic Navaia portal.",
    version="2.0.0"
)
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://agentic.navaia.sa",
]
# CORS Middleware Setup
# This allows your Next.js frontend at localhost:3000 to communicate with this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routes from the master router in api.py
# This is the single line that makes all your endpoints from other files available.
app.include_router(api_router)

# --- Root and Health Check Endpoints ---
# These are the only endpoints that remain directly in main.py.

@app.get("/")
def read_root(_=Depends(require_auth)):
    """
    An authenticated root endpoint to confirm the API is running and secured.
    """
    return {"status": "Voice Agent Portal API is running"}


@app.get("/healthz")
def health_check(db_session: Session = Depends(get_session)):
    """
    A public health check endpoint for monitoring tools.
    It verifies that the application is running and can connect to the database.
    """
    try:
        db_session.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "db_connection": "ok",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: DB connection error: {e}")
        # In a real production environment, you might not want to expose the error details.
        return {
            "status": "unhealthy",
            "db_connection": "error",
            "timestamp": datetime.utcnow().isoformat()
        }
