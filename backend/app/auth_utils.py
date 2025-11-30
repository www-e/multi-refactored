# backend/app/auth_utils.py
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from .db import get_session
from .models import User
from .password_utils import verify_password

# Secret key for JWT signing - should be set in environment
SECRET_KEY = os.getenv("JWT_SECRET", "your-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # Currently 15 minutes as per analysis
REFRESH_TOKEN_EXPIRE_DAYS = 7    # Refresh token expires in 7 days

# This is used to extract the token from the "Authorization: Bearer <token>" header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class UnauthenticatedException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

class UnauthorizedException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have the required permissions",
        )

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create a new access token with the given data
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create a new refresh token with the given data
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify the JWT token and return its payload
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise UnauthenticatedException()

def verify_refresh_token(token: str) -> Dict[str, Any]:
    """
    Verify the refresh token and return its payload
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        token_type = payload.get("type")
        if token_type != "refresh":
            raise UnauthenticatedException()
        return payload
    except JWTError:
        raise UnauthenticatedException()

def get_current_user_payload(token: str = Depends(oauth2_scheme), db_session: Session = Depends(get_session)) -> Dict[str, Any]:
    """
    Validates the JWT token and returns its payload.
    This will be used as a dependency for all protected endpoints.
    """
    try:
        payload = verify_token(token)
        return payload
    except Exception:
        raise UnauthenticatedException()

def get_current_user(token_payload: Dict[str, Any] = Depends(get_current_user_payload), db_session: Session = Depends(get_session)) -> User:
    """
    Validates the token and returns the actual user object.
    """
    user_id: str = token_payload.get("sub")
    if user_id is None:
        raise UnauthenticatedException()

    user = db_session.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise UnauthenticatedException()

    return user

def require_auth(user: User = Depends(get_current_user)):
    """
    A simple dependency that just requires an active logged-in user to be present.
    For endpoints accessible by any logged-in user.
    """
    return user

def require_admin(user: User = Depends(get_current_user)):
    """
    Dependency that requires the user to have admin role.
    """
    if user.role != "admin":
        raise UnauthorizedException()
    return user

def authenticate_user(db_session: Session, email: str, password: str) -> Optional[User]:
    """
    Authenticate a user by email and password
    """
    user = db_session.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        return None
    return user