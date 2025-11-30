# backend/app/api/deps.py
from fastapi import Depends, HTTPException
from app.db import get_session
from app.auth_utils import get_current_user
from app.models import User

def get_current_tenant_id(current_user: User = Depends(get_current_user)) -> str:
    """
    Extract tenant ID from current authenticated user.
    For demo purposes, we'll use a fixed tenant, but in a real multi-tenant system,
    this would come from the user's profile or JWT claims.
    """
    # In a real multi-tenant system, you would extract this from the JWT token or user profile
    # For now, we'll maintain the demo tenant for backward compatibility
    return getattr(current_user, 'tenant_id', 'demo-tenant')  # fallback for existing users