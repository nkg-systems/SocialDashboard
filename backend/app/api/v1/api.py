"""
API router configuration for v1 endpoints.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, social, posts, analytics

api_router = APIRouter()

# Authentication routes
api_router.include_router(
    auth.router, 
    prefix="/auth", 
    tags=["Authentication"]
)

# User management routes
api_router.include_router(
    users.router, 
    prefix="/users", 
    tags=["Users"]
)

# Social media integration routes
api_router.include_router(
    social.router, 
    prefix="/social", 
    tags=["Social Media"]
)

# Post management routes
api_router.include_router(
    posts.router, 
    prefix="/posts", 
    tags=["Posts"]
)

# Analytics routes
api_router.include_router(
    analytics.router, 
    prefix="/analytics", 
    tags=["Analytics"]
)