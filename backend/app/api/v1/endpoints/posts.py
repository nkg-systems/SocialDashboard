"""
Post management endpoints.
"""
from fastapi import APIRouter, Depends
from app.api import deps
from app.models.user import User

router = APIRouter()


@router.get("/")
def get_posts(
    current_user: User = Depends(deps.get_current_user),
):
    """Get user's posts."""
    return {"message": "Posts endpoint - to be implemented"}


@router.post("/")
def create_post(
    current_user: User = Depends(deps.get_current_user),
):
    """Create a new post."""
    return {"message": "Create post endpoint - to be implemented"}