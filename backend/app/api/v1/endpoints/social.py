"""
Social media integration endpoints.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api import deps
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.social_account import SocialAccount
from app.services.oauth_service import OAuth2Service
from app.services.social_service import SocialMediaService

router = APIRouter()
oauth_service = OAuth2Service()
social_service = SocialMediaService()


class SocialAccountResponse(BaseModel):
    id: str
    platform: str
    username: str
    display_name: str = None
    profile_image_url: str = None
    is_active: bool
    last_sync_at: datetime = None
    sync_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ConnectResponse(BaseModel):
    auth_url: str
    state: str
    platform: str


@router.get("/accounts", response_model=List[SocialAccountResponse])
def get_social_accounts(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's social media accounts."""
    accounts = db.query(SocialAccount).filter(
        SocialAccount.user_id == current_user.id
    ).all()
    
    return accounts


@router.get("/platforms")
def get_supported_platforms():
    """Get list of supported social media platforms."""
    return {
        "platforms": [
            {"name": "twitter", "display_name": "Twitter (X)", "icon": "twitter"},
            {"name": "facebook", "display_name": "Facebook", "icon": "facebook"},
            {"name": "instagram", "display_name": "Instagram", "icon": "instagram"},
            {"name": "linkedin", "display_name": "LinkedIn", "icon": "linkedin"},
            {"name": "tiktok", "display_name": "TikTok", "icon": "tiktok"},
            {"name": "youtube", "display_name": "YouTube", "icon": "youtube"},
        ]
    }


@router.post("/connect/{platform}", response_model=ConnectResponse)
def initiate_oauth_connection(
    platform: str,
    request: Request,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Initiate OAuth connection to a social media platform."""
    if platform not in oauth_service.PLATFORMS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported platform: {platform}"
        )
    
    # Check if user already has this platform connected
    existing = db.query(SocialAccount).filter(
        SocialAccount.user_id == current_user.id,
        SocialAccount.platform == platform,
        SocialAccount.is_active == True
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Already connected to {platform}"
        )
    
    # Generate OAuth URL
    base_url = str(request.base_url).rstrip('/')
    redirect_uri = f"{base_url}{settings.API_V1_STR}/social/callback/{platform}"
    
    auth_url, state, code_verifier = oauth_service.get_authorization_url(
        platform=platform,
        redirect_uri=redirect_uri,
        user_id=str(current_user.id)
    )
    
    # Store state and code_verifier in session/cache for verification
    # For now, we'll use a simple in-memory store (in production, use Redis)
    # oauth_cache[state] = {"user_id": current_user.id, "code_verifier": code_verifier}
    
    return ConnectResponse(
        auth_url=auth_url,
        state=state,
        platform=platform
    )


@router.get("/callback/{platform}")
async def oauth_callback(
    platform: str,
    code: str = Query(...),
    state: str = Query(...),
    error: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Handle OAuth callback from social media platforms."""
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth error: {error}"
        )
    
    if platform not in oauth_service.PLATFORMS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported platform: {platform}"
        )
    
    # Extract user_id from state (format: "state_token:user_id")
    try:
        state_token, user_id = state.split(':', 1)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid state parameter"
        )
    
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # For production, retrieve code_verifier from cache using state
    # code_verifier = oauth_cache.get(state, {}).get("code_verifier")
    code_verifier = None  # Simplified for now
    
    try:
        # Exchange code for tokens
        redirect_uri = f"http://localhost:8000{settings.API_V1_STR}/social/callback/{platform}"  # This should be dynamic
        token_data = await oauth_service.exchange_code_for_tokens(
            platform=platform,
            code=code,
            redirect_uri=redirect_uri,
            code_verifier=code_verifier
        )
        
        # Get user profile from the platform
        access_token = token_data.get('access_token')
        # This is simplified - in real implementation, we'd use the social_service
        # to get proper user profile data
        
        # Encrypt tokens before storing
        encrypted_access_token = oauth_service.encrypt_token(access_token, user_id)
        encrypted_refresh_token = None
        
        refresh_token = token_data.get('refresh_token')
        if refresh_token:
            encrypted_refresh_token = oauth_service.encrypt_token(refresh_token, user_id)
        
        # Calculate token expiry
        expires_in = token_data.get('expires_in', 3600)  # Default 1 hour
        token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        # Create or update social account
        social_account = SocialAccount(
            user_id=user.id,
            platform=platform,
            platform_user_id="temp_id",  # Will be updated after profile fetch
            username=f"{platform}_user",  # Will be updated after profile fetch
            access_token=encrypted_access_token,
            refresh_token=encrypted_refresh_token,
            token_expires_at=token_expires_at,
            is_active=True,
            sync_enabled=True
        )
        
        db.add(social_account)
        db.commit()
        db.refresh(social_account)
        
        return {
            "message": f"Successfully connected to {platform}",
            "platform": platform,
            "account_id": str(social_account.id)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to connect to {platform}: {str(e)}"
        )


@router.delete("/accounts/{account_id}")
def disconnect_account(
    account_id: str,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Disconnect a social media account."""
    account = db.query(SocialAccount).filter(
        SocialAccount.id == account_id,
        SocialAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social account not found"
        )
    
    account.is_active = False
    db.commit()
    
    return {"message": f"Disconnected from {account.platform}"}


@router.post("/accounts/{account_id}/sync")
async def sync_account(
    account_id: str,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Manually sync data from a social media account."""
    account = db.query(SocialAccount).filter(
        SocialAccount.id == account_id,
        SocialAccount.user_id == current_user.id,
        SocialAccount.is_active == True
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active social account not found"
        )
    
    try:
        await social_service.sync_analytics(account, db)
        return {"message": f"Successfully synced {account.platform} data"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync data: {str(e)}"
        )


@router.get("/accounts/{account_id}/metrics")
async def get_account_metrics(
    account_id: str,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Get current metrics for a social media account."""
    account = db.query(SocialAccount).filter(
        SocialAccount.id == account_id,
        SocialAccount.user_id == current_user.id,
        SocialAccount.is_active == True
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active social account not found"
        )
    
    try:
        metrics = await social_service.get_account_metrics(account)
        return {
            "platform": account.platform,
            "username": account.username,
            "metrics": metrics,
            "last_sync": account.last_sync_at
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get metrics: {str(e)}"
        )
