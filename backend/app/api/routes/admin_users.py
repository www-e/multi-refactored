from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app import models
from app.api import deps
from app.password_utils import validate_password_strength, hash_password

router = APIRouter()

def generate_id(prefix: str = "usr") -> str:
    import secrets
    return f"{prefix}_{secrets.token_hex(8)}"

class UserCreateRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str = "user"  # Default to user role

class UserUpdateRequest(BaseModel):
    name: str = None
    role: str = None
    is_active: bool = None

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    is_active: bool
    tenant_id: str
    created_at: str

@router.get("/users", response_model=List[UserResponse])
def get_users(
    current_user: models.User = Depends(deps.require_admin),
    db_session: Session = Depends(deps.get_session)
):
    """
    Get all users (admin only)
    """
    users = db_session.query(models.User).all()
    return [
        UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role.value,
            is_active=user.is_active,
            tenant_id=user.tenant_id,
            created_at=user.created_at.isoformat() if user.created_at else None
        )
        for user in users
    ]

@router.post("/users", response_model=UserResponse)
def create_user(
    user_data: UserCreateRequest,
    current_user: models.User = Depends(deps.require_admin),
    db_session: Session = Depends(deps.get_session)
):
    """
    Create a new user (admin only)
    """
    # Check if user already exists
    existing_user = db_session.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists"
        )

    # Validate password strength
    is_valid, error_msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=error_msg
        )

    # Validate role
    if user_data.role not in ["user", "admin"]:
        raise HTTPException(
            status_code=400,
            detail="Role must be either 'user' or 'admin'"
        )

    user_id = generate_id("usr")
    hashed_password = hash_password(user_data.password)

    # Use the same tenant_id as the admin creating the user
    tenant_id = current_user.tenant_id

    db_user = models.User(
        id=user_id,
        email=user_data.email,
        password_hash=hashed_password,
        name=user_data.name,
        role=models.UserRoleEnum[user_data.role],
        tenant_id=tenant_id
    )
    db_session.add(db_user)
    db_session.commit()
    db_session.refresh(db_user)

    return UserResponse(
        id=db_user.id,
        email=db_user.email,
        name=db_user.name,
        role=db_user.role.value,
        is_active=db_user.is_active,
        tenant_id=db_user.tenant_id,
        created_at=db_user.created_at.isoformat() if db_user.created_at else None
    )

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    user_data: UserUpdateRequest,
    current_user: models.User = Depends(deps.require_admin),
    db_session: Session = Depends(deps.get_session)
):
    """
    Update a user (admin only)
    """
    db_user = db_session.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from changing their own role to avoid lockout
    if db_user.id == current_user.id and user_data.role is not None and user_data.role != "admin":
        raise HTTPException(status_code=400, detail="Admin cannot change their own role")

    # Update fields if provided
    if user_data.name is not None:
        db_user.name = user_data.name
    if user_data.role is not None:
        if user_data.role not in ["user", "admin"]:
            raise HTTPException(
                status_code=400,
                detail="Role must be either 'user' or 'admin'"
            )
        db_user.role = models.UserRoleEnum[user_data.role]
    if user_data.is_active is not None:
        db_user.is_active = user_data.is_active

    db_session.commit()
    db_session.refresh(db_user)

    return UserResponse(
        id=db_user.id,
        email=db_user.email,
        name=db_user.name,
        role=db_user.role.value,
        is_active=db_user.is_active,
        tenant_id=db_user.tenant_id,
        created_at=db_user.created_at.isoformat() if db_user.created_at else None
    )

@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    current_user: models.User = Depends(deps.require_admin),
    db_session: Session = Depends(deps.get_session)
):
    """
    Delete a user (admin only)
    """
    db_user = db_session.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from deleting themselves
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Admin cannot delete their own account")

    db_session.delete(db_user)
    db_session.commit()

    return {"message": "User deleted successfully"}