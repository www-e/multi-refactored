# backend/app/api/deps.py
from fastapi import Depends, HTTPException
from app.db import get_session
from app.auth_utils import get_current_user
from app.models import User, UserRoleEnum

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

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to ensure the current user is an admin.
    Raises HTTPException if the user is not an admin.
    """
    if not current_user or current_user.role != UserRoleEnum.admin:
        raise HTTPException(
            status_code=403,
            detail="Access denied: Admin privileges required"
        )
    return current_user