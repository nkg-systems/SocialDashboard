"""
Analytics endpoints.
"""
from fastapi import APIRouter, Depends
from app.api import deps
from app.models.user import User

router = APIRouter()


@router.get("/dashboard")
def get_dashboard_analytics(
    current_user: User = Depends(deps.get_current_user),
):
    """Get dashboard analytics data."""
    return {"message": "Dashboard analytics endpoint - to be implemented"}


@router.get("/posts/{post_id}")
def get_post_analytics(
    post_id: str,
    current_user: User = Depends(deps.get_current_user),
):
    """Get analytics for a specific post."""
    return {"message": f"Post {post_id} analytics - to be implemented"}