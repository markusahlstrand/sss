import os
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel
import structlog

logger = structlog.get_logger(__name__)

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
JWT_ALGORITHM = "HS256"

security = HTTPBearer()


class TokenData(BaseModel):
    sub: Optional[str] = None
    scopes: List[str] = []


class AuthError(Exception):
    """Custom authentication error."""
    def __init__(self, message: str, error_type: str = "unauthorized"):
        self.message = message
        self.error_type = error_type
        super().__init__(self.message)


def decode_token(token: str) -> TokenData:
    """Decode and validate JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        sub: str = payload.get("sub")
        scopes: List[str] = payload.get("scopes", [])
        
        if sub is None:
            raise AuthError("Token missing 'sub' claim")
        
        return TokenData(sub=sub, scopes=scopes)
    
    except JWTError as e:
        logger.warning("JWT decode error", error=str(e))
        raise AuthError("Could not validate credentials")


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    """Extract and validate user from JWT token."""
    try:
        token_data = decode_token(credentials.credentials)
        logger.info("User authenticated", sub=token_data.sub, scopes=token_data.scopes)
        return token_data
    except AuthError as e:
        if e.error_type == "unauthorized":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=e.message
        )


def require_scopes(required_scopes: List[str]):
    """Dependency to require specific scopes."""
    def scopes_checker(current_user: TokenData = Depends(get_current_user)) -> TokenData:
        if not required_scopes:
            return current_user
            
        for scope in required_scopes:
            if scope not in current_user.scopes:
                logger.warning(
                    "Insufficient permissions", 
                    required=required_scopes, 
                    user_scopes=current_user.scopes,
                    user=current_user.sub
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. Required scope: {scope}"
                )
        
        logger.info("Authorization successful", user=current_user.sub, scopes=required_scopes)
        return current_user
    
    return scopes_checker
