"""
Social media integration endpoints.
"""
from fastapi import APIRouter, Depends
from app.api import deps
from app.models.user import User

router = APIRouter()


@router.get("/accounts")
def get_social_accounts(
    current_user: User = Depends(deps.get_current_user),
):
    """Get user's social media accounts."""
    return {"message": "Social accounts endpoint - to be implemented"}


@router.post("/connect/{platform}")
def connect_platform(
    platform: str,
    current_user: User = Depends(deps.get_current_user),
):
    """Connect to a social media platform."""
    return {"message": f"Connect to {platform} - to be implemented"}