# backend/app/auth_utils.py
import os
import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

# This is used to extract the token from the "Authorization: Bearer <token>" header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Auth0 configuration from environment variables
AUTH0_DOMAIN = os.getenv("AUTH0_ISSUER_BASE_URL", "").replace("https://", "").rstrip("/")
API_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
ALGORITHMS = ["RS256"]

# Fetch the Auth0 public keys (JWKS) to verify the token signature
jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
jwks = requests.get(jwks_url).json()

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

def get_token_payload(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Validates the Auth0 Access Token and returns its payload.
    This will be used as a dependency for all protected endpoints.
    """
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError:
        raise UnauthenticatedException()

    rsa_key = {}
    for key in jwks["keys"]:
        if key["kid"] == unverified_header["kid"]:
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"],
            }
            break

    if not rsa_key:
        raise UnauthenticatedException()

    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=ALGORITHMS,
            audience=API_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/",
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise UnauthenticatedException()
    except jwt.JWTClaimsError:
        raise UnauthenticatedException()
    except Exception:
        raise UnauthenticatedException()

def require_auth(payload: dict = Depends(get_token_payload)):
    """
    A simple dependency that just requires a valid token to be present.
    For endpoints accessible by any logged-in user.
    """
    return payload