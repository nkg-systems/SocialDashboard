"""
Authentication endpoints.
"""
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.api import deps
from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

router = APIRouter()


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str = None
    last_name: str = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str = None
    last_name: str = None
    is_active: bool
    is_superuser: bool

    class Config:
        from_attributes = True


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db),
) -> Any:
    """
    Register a new user.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create new user
    hashed_password = security.get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/login", response_model=Token)
def login(
    response: Response,
    user_credentials: UserLogin,
    db: Session = Depends(get_db),
) -> Any:
    """
    User login and token generation.
    """
    user = db.query(User).filter(User.email == user_credentials.email).first()
    
    if not user or not security.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Generate tokens
    access_token = security.create_access_token(user.id)
    refresh_token = security.create_refresh_token(user.id)
    
    # Set secure HTTP-only cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=not settings.DEBUG,  # HTTPS only in production
        samesite="lax"
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=not settings.DEBUG,  # HTTPS only in production
        samesite="lax"
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
def refresh_token(
    response: Response,
    refresh_token: str = Cookie(None),
    db: Session = Depends(get_db),
) -> Any:
    """
    Refresh access token using refresh token.
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
        )
    
    user_id = security.verify_refresh_token(refresh_token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    
    # Generate new tokens
    new_access_token = security.create_access_token(user.id)
    new_refresh_token = security.create_refresh_token(user.id)
    
    # Update cookies
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax"
    )
    
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax"
    )
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.post("/logout")
def logout(
    response: Response,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    User logout - clear tokens.
    """
    # Clear cookies
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user information.
    """
    return current_user