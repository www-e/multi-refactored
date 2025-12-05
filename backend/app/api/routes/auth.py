# backend/app/api/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app import models
from app.api import deps
from app.auth_utils import authenticate_user, create_access_token, create_refresh_token, ACCESS_TOKEN_EXPIRE_MINUTES, verify_refresh_token
from app.password_utils import validate_password_strength, hash_password

router = APIRouter()

# --- Pydantic Models for Auth ---
from pydantic import BaseModel

class TokenRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserCreateRequest(BaseModel):
    email: str
    password: str
    name: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str

def generate_id(prefix: str = "id") -> str:
    import secrets
    return f"{prefix}_{secrets.token_hex(8)}"

@router.post("/auth/token", response_model=TokenResponse)
async def login_for_access_token(form_data: TokenRequest, db_session: Session = Depends(deps.get_session)):
    user = authenticate_user(db_session, form_data.email, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user.last_login_at = models.datetime.utcnow()
    db_session.commit()
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role.value, "tenant_id": user.tenant_id},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": user.id, "email": user.email, "role": user.role.value, "tenant_id": user.tenant_id}
    )
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/auth/refresh", response_model=TokenResponse)
async def refresh_access_token(refresh_token_data: RefreshTokenRequest, db_session: Session = Depends(deps.get_session)):
    try:
        payload = verify_refresh_token(refresh_token_data.refresh_token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Get user from database to ensure they still exist and are active
        user = db_session.query(models.User).filter(models.User.id == user_id).first()
        if user is None or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User no longer exists or is inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Create new access token with the same user data
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email, "role": user.role.value, "tenant_id": user.tenant_id},
            expires_delta=access_token_expires
        )

        # Create a new refresh token to replace the old one
        new_refresh_token = create_refresh_token(
            data={"sub": user.id, "email": user.email, "role": user.role.value, "tenant_id": user.tenant_id}
        )

        return {"access_token": access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/auth/register", response_model=UserResponse)
async def register_user(user_data: UserCreateRequest, db_session: Session = Depends(deps.get_session)):
    existing_user = db_session.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )

    is_valid, error_msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )

    user_id = generate_id("usr")
    hashed_password = hash_password(user_data.password)

    # For now, assign a default tenant ID based on user ID
    # In a real system, you would either accept tenant_id as a parameter
    # or assign the user to an existing organization
    tenant_id = f"tenant-{user_id}"

    db_user = models.User(
        id=user_id,
        email=user_data.email,
        password_hash=hashed_password,
        name=user_data.name,
        tenant_id=tenant_id
    )
    db_session.add(db_user)
    db_session.commit()
    db_session.refresh(db_user)

    return UserResponse(
        id=db_user.id,
        email=db_user.email,
        name=db_user.name,
        role=db_user.role.value
    )

@router.get("/auth/me", response_model=UserResponse)
async def read_users_me(current_user: models.User = Depends(deps.get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role.value
    )