"""
Social media integration endpoints.
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api import deps
from app.core.database import get_db
from app.core.config import settings
from app.core.oauth_state_store import oauth_state_store
from app.core.validation import (
    InputValidator, 
    ValidationError,
    OAuthCallbackValidator,
    AccountRequestValidator
)
from app.models.user import User
from app.models.social_account import SocialAccount
from app.services.oauth_service import OAuth2Service
from app.services.social_service import SocialMediaService

router = APIRouter()
oauth_service = OAuth2Service()
social_service = SocialMediaService()
logger = logging.getLogger(__name__)


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


def extract_profile_info(platform: str, profile_data: Dict) -> Tuple[str, str, str]:
    """Extract platform-specific user info from profile data."""
    try:
        if platform == "twitter":
            user_data = profile_data.get("data", {})
            return (
                user_data.get("id", ""),
                user_data.get("username", ""),
                user_data.get("name", "")
            )
        elif platform == "facebook":
            return (
                profile_data.get("id", ""),
                profile_data.get("name", "").replace(" ", "").lower(),
                profile_data.get("name", "")
            )
        elif platform == "instagram":
            return (
                profile_data.get("id", ""),
                profile_data.get("username", ""),
                profile_data.get("username", "")  # Instagram doesn't have display names
            )
        elif platform == "linkedin":
            localized_first = profile_data.get("localizedFirstName", "")
            localized_last = profile_data.get("localizedLastName", "")
            return (
                profile_data.get("id", ""),
                f"{localized_first.lower()}{localized_last.lower()}".replace(" ", ""),
                f"{localized_first} {localized_last}"
            )
        elif platform == "youtube":
            items = profile_data.get("items", [])
            if items:
                channel = items[0]
                snippet = channel.get("snippet", {})
                return (
                    channel.get("id", ""),
                    snippet.get("customUrl", snippet.get("title", "")).replace(" ", "").lower(),
                    snippet.get("title", "")
                )
        elif platform == "tiktok":
            data = profile_data.get("data", {})
            user = data.get("user", {})
            return (
                user.get("open_id", ""),
                user.get("username", ""),
                user.get("display_name", "")
            )
    except Exception as e:
        logger.warning(f"Error extracting profile info for {platform}: {str(e)}")
    
    # Fallback for any platform or error
    return "", "", ""


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
    # Validate platform parameter
    try:
        platform = InputValidator.validate_platform(platform)
    except ValidationError as e:
        raise e
    
    if platform not in oauth_service.PLATFORMS:
        raise ValidationError("Unsupported social platform")
    
    # Check if user already has this platform connected
    existing = db.query(SocialAccount).filter(
        SocialAccount.user_id == current_user.id,
        SocialAccount.platform == platform,
        SocialAccount.is_active == True
    ).first()
    
    if existing:
        raise ValidationError("Platform account already connected")
    
    # Generate dynamic OAuth URL based on request
    base_url = str(request.base_url).rstrip('/')
    # Support both HTTP (dev) and HTTPS (prod)
    if request.headers.get('x-forwarded-proto') == 'https':
        base_url = base_url.replace('http://', 'https://')
    
    redirect_uri = f"{base_url}{settings.API_V1_STR}/social/callback/{platform}"
    
    try:
        auth_url, state, code_verifier = oauth_service.get_authorization_url(
            platform=platform,
            redirect_uri=redirect_uri,
            user_id=str(current_user.id)
        )
        
        # Securely store state and code_verifier for CSRF protection
        oauth_state_store.store_state(
            state=state,
            user_id=str(current_user.id),
            platform=platform,
            code_verifier=code_verifier,
            redirect_uri=redirect_uri
        )
        
        return ConnectResponse(
            auth_url=auth_url,
            state=state,
            platform=platform
        )
        
    except Exception as e:
        sanitized_error = InputValidator.sanitize_error_message(e, "oauth_initiation")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=sanitized_error
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
    # Validate request parameters
    try:
        req = OAuthCallbackValidator(platform=platform, code=code, state=state, error=error)
        platform = req.platform
        code = req.code
        state = req.state
        error = req.error
    except ValidationError as e:
        raise e
    
    if error:
        raise ValidationError("OAuth authorization was denied")
    
    if platform not in oauth_service.PLATFORMS:
        raise ValidationError("Unsupported social platform")
    
    # Validate and retrieve state data for CSRF protection
    state_data = oauth_state_store.get_and_remove_state(state)
    
    if not state_data:
        raise ValidationError("OAuth session expired or invalid")
    
    user_id = state_data["user_id"]
    code_verifier = state_data["code_verifier"]
    stored_redirect_uri = state_data["redirect_uri"]
    stored_platform = state_data["platform"]
    
    # Validate platform matches
    if stored_platform != platform:
        raise ValidationError("OAuth session validation failed")
    
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValidationError("Authentication required")
    
    try:
        # Exchange code for tokens using stored redirect URI
        token_data = await oauth_service.exchange_code_for_tokens(
            platform=platform,
            code=code,
            redirect_uri=stored_redirect_uri,
            code_verifier=code_verifier
        )
        
        # Get user profile from the platform
        access_token = token_data.get('access_token')
        
        # Create temporary account to get profile data
        temp_account = SocialAccount(
            user_id=user.id,
            platform=platform,
            platform_user_id="temp",
            username="temp",
            access_token=oauth_service.encrypt_token(access_token, user_id),
            refresh_token=None,
            token_expires_at=datetime.utcnow() + timedelta(hours=1),
            is_active=False,
            sync_enabled=False
        )
        
        # Fetch user profile to get real username and user ID
        try:
            profile_data = await social_service.get_user_profile(temp_account)
            
            # Extract platform-specific user info
            platform_user_id, username, display_name = extract_profile_info(platform, profile_data)
            
        except Exception as e:
            # If profile fetch fails, use fallback values but log the error
            logger.warning(f"Failed to fetch {platform} profile for user {user_id}: {str(e)}")
            platform_user_id = f"{platform}_{user_id}"
            username = f"{platform}_user_{user_id[:8]}"
            display_name = f"{platform.title()} Account"
        
        # Check if account with this platform user ID already exists
        existing_account = db.query(SocialAccount).filter(
            SocialAccount.platform == platform,
            SocialAccount.platform_user_id == platform_user_id
        ).first()
        
        if existing_account and existing_account.user_id != user.id:
            raise ValidationError("Social account already in use")
        
        # Encrypt tokens before storing
        encrypted_access_token = oauth_service.encrypt_token(access_token, user_id)
        encrypted_refresh_token = None
        
        refresh_token = token_data.get('refresh_token')
        if refresh_token:
            encrypted_refresh_token = oauth_service.encrypt_token(refresh_token, user_id)
        
        # Calculate token expiry
        expires_in = token_data.get('expires_in', 3600)  # Default 1 hour
        token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        # Create or update social account with real profile data
        if existing_account and existing_account.user_id == user.id:
            # Update existing account
            existing_account.username = username
            existing_account.display_name = display_name
            existing_account.access_token = encrypted_access_token
            existing_account.refresh_token = encrypted_refresh_token
            existing_account.token_expires_at = token_expires_at
            existing_account.is_active = True
            existing_account.sync_enabled = True
            social_account = existing_account
        else:
            # Create new account
            social_account = SocialAccount(
                user_id=user.id,
                platform=platform,
                platform_user_id=platform_user_id,
                username=username,
                display_name=display_name,
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
        
    except ValidationError:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        sanitized_error = InputValidator.sanitize_error_message(e, "oauth_callback")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=sanitized_error
        )


@router.delete("/accounts/{account_id}")
def disconnect_account(
    account_id: str,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Disconnect a social media account."""
    # Validate account ID
    try:
        account_id = InputValidator.validate_account_id(account_id)
    except ValidationError as e:
        raise e
        
    account = db.query(SocialAccount).filter(
        SocialAccount.id == account_id,
        SocialAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise ValidationError("Social account not found")
    
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
    # Validate account ID
    try:
        account_id = InputValidator.validate_account_id(account_id)
    except ValidationError as e:
        raise e
        
    account = db.query(SocialAccount).filter(
        SocialAccount.id == account_id,
        SocialAccount.user_id == current_user.id,
        SocialAccount.is_active == True
    ).first()
    
    if not account:
        raise ValidationError("Active social account not found")
    
    try:
        await social_service.sync_analytics(account, db)
        return {"message": "Account data synchronized successfully"}
    except Exception as e:
        sanitized_error = InputValidator.sanitize_error_message(e, "account_sync")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=sanitized_error
        )


@router.get("/accounts/{account_id}/metrics")
async def get_account_metrics(
    account_id: str,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Get current metrics for a social media account."""
    # Validate account ID
    try:
        account_id = InputValidator.validate_account_id(account_id)
    except ValidationError as e:
        raise e
        
    account = db.query(SocialAccount).filter(
        SocialAccount.id == account_id,
        SocialAccount.user_id == current_user.id,
        SocialAccount.is_active == True
    ).first()
    
    if not account:
        raise ValidationError("Active social account not found")
    
    try:
        metrics = await social_service.get_account_metrics(account)
        return {
            "platform": account.platform,
            "username": account.username,
            "metrics": metrics,
            "last_sync": account.last_sync_at
        }
    except Exception as e:
        sanitized_error = InputValidator.sanitize_error_message(e, "account_metrics")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=sanitized_error
        )
