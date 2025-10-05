"""
User management endpoints.
"""
from fastapi import APIRouter, Depends
from app.api import deps
from app.models.user import User

router = APIRouter()


@router.get("/me")
def get_user_profile(
    current_user: User = Depends(deps.get_current_user),
):
    """Get current user profile."""
    return current_user


@router.get("/")
def list_users(
    current_user: User = Depends(deps.get_current_superuser),
):
    """List all users (admin only)."""
    return {"message": "User list endpoint - to be implemented"}