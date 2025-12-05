# backend/app/api/deps.py
from fastapi import Depends, HTTPException
from app.db import get_session
from app.auth_utils import get_current_user
from app.models import User

def get_current_tenant_id(current_user: User = Depends(get_current_user)) -> str:
    """
    Extract tenant ID from current authenticated user.
    """
    if not hasattr(current_user, 'tenant_id') or not current_user.tenant_id:
        raise HTTPException(
            status_code=403,
            detail="User does not have a valid tenant assignment"
        )
    return current_user.tenant_id