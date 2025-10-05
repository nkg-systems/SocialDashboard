"""
OAuth2 service for social media platform integrations.
"""
import secrets
import hashlib
import base64
from typing import Dict, Optional, Tuple
from urllib.parse import urlencode
import httpx
from app.core.config import settings
from app.core.security import SecurityUtils


class OAuth2Service:
    """
    OAuth2 service for handling social media authentication flows.
    """
    
    # Platform configurations
    PLATFORMS = {
        "twitter": {
            "auth_url": "https://twitter.com/i/oauth2/authorize",
            "token_url": "https://api.twitter.com/2/oauth2/token",
            "scopes": ["tweet.read", "tweet.write", "users.read", "offline.access"],
            "client_id": settings.TWITTER_API_KEY,
            "client_secret": settings.TWITTER_API_SECRET,
        },
        "facebook": {
            "auth_url": "https://www.facebook.com/v18.0/dialog/oauth",
            "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
            "scopes": ["pages_manage_posts", "pages_read_engagement", "pages_show_list"],
            "client_id": settings.FACEBOOK_APP_ID,
            "client_secret": settings.FACEBOOK_APP_SECRET,
        },
        "instagram": {
            "auth_url": "https://api.instagram.com/oauth/authorize",
            "token_url": "https://api.instagram.com/oauth/access_token",
            "scopes": ["user_profile", "user_media"],
            "client_id": settings.INSTAGRAM_CLIENT_ID,
            "client_secret": settings.INSTAGRAM_CLIENT_SECRET,
        },
        "linkedin": {
            "auth_url": "https://www.linkedin.com/oauth/v2/authorization",
            "token_url": "https://www.linkedin.com/oauth/v2/accessToken",
            "scopes": ["r_liteprofile", "r_emailaddress", "w_member_social"],
            "client_id": settings.LINKEDIN_CLIENT_ID,
            "client_secret": settings.LINKEDIN_CLIENT_SECRET,
        },
        "tiktok": {
            "auth_url": "https://www.tiktok.com/auth/authorize/",
            "token_url": "https://open-api.tiktok.com/oauth/access_token/",
            "scopes": ["user.info.basic", "video.list", "video.upload"],
            "client_id": settings.TIKTOK_CLIENT_ID,
            "client_secret": settings.TIKTOK_CLIENT_SECRET,
        },
        "youtube": {
            "auth_url": "https://accounts.google.com/o/oauth2/auth",
            "token_url": "https://oauth2.googleapis.com/token",
            "scopes": ["https://www.googleapis.com/auth/youtube"],
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
        }
    }
    
    def __init__(self):
        self.security_utils = SecurityUtils()
    
    def get_authorization_url(
        self, 
        platform: str, 
        redirect_uri: str,
        user_id: str
    ) -> Tuple[str, str, str]:
        """
        Generate OAuth2 authorization URL with PKCE for security.
        
        Returns:
            Tuple of (auth_url, state, code_verifier)
        """
        if platform not in self.PLATFORMS:
            raise ValueError(f"Unsupported platform: {platform}")
        
        config = self.PLATFORMS[platform]
        
        # Generate security tokens
        state = self.security_utils.generate_state_token()
        code_verifier = self.security_utils.generate_code_verifier()
        code_challenge = self.security_utils.generate_code_challenge(code_verifier)
        
        # Build authorization parameters
        params = {
            "client_id": config["client_id"],
            "response_type": "code",
            "redirect_uri": redirect_uri,
            "scope": " ".join(config["scopes"]),
            "state": f"{state}:{user_id}",  # Include user_id in state for security
        }
        
        # Add PKCE parameters for supported platforms
        if platform in ["twitter", "youtube"]:
            params.update({
                "code_challenge": code_challenge,
                "code_challenge_method": "S256"
            })
        
        auth_url = f"{config['auth_url']}?{urlencode(params)}"
        
        return auth_url, state, code_verifier
    
    async def exchange_code_for_tokens(
        self,
        platform: str,
        code: str,
        redirect_uri: str,
        code_verifier: Optional[str] = None
    ) -> Dict:
        """
        Exchange authorization code for access and refresh tokens.
        """
        if platform not in self.PLATFORMS:
            raise ValueError(f"Unsupported platform: {platform}")
        
        config = self.PLATFORMS[platform]
        
        # Prepare token exchange data
        data = {
            "grant_type": "authorization_code",
            "client_id": config["client_id"],
            "client_secret": config["client_secret"],
            "code": code,
            "redirect_uri": redirect_uri,
        }
        
        # Add PKCE verifier for supported platforms
        if platform in ["twitter", "youtube"] and code_verifier:
            data["code_verifier"] = code_verifier
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                config["token_url"],
                data=data,
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise ValueError(f"Token exchange failed: {response.text}")
            
            return response.json()
    
    async def refresh_access_token(
        self, 
        platform: str, 
        refresh_token: str
    ) -> Dict:
        """
        Refresh access token using refresh token.
        """
        if platform not in self.PLATFORMS:
            raise ValueError(f"Unsupported platform: {platform}")
        
        config = self.PLATFORMS[platform]
        
        data = {
            "grant_type": "refresh_token",
            "client_id": config["client_id"],
            "client_secret": config["client_secret"],
            "refresh_token": refresh_token,
        }
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                config["token_url"],
                data=data,
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise ValueError(f"Token refresh failed: {response.text}")
            
            return response.json()
    
    def encrypt_token(self, token: str, user_id: str) -> str:
        """
        Encrypt token for secure storage.
        """
        encryption_key = f"{settings.SECRET_KEY}:{user_id}"
        return self.security_utils.encrypt_token(token, encryption_key)
    
    def decrypt_token(self, encrypted_token: str, user_id: str) -> str:
        """
        Decrypt token from storage.
        """
        encryption_key = f"{settings.SECRET_KEY}:{user_id}"
        return self.security_utils.decrypt_token(encrypted_token, encryption_key)
    
    async def validate_token(self, platform: str, access_token: str) -> bool:
        """
        Validate access token by making a test API call.
        """
        validation_endpoints = {
            "twitter": "https://api.twitter.com/2/users/me",
            "facebook": "https://graph.facebook.com/me",
            "instagram": "https://graph.instagram.com/me",
            "linkedin": "https://api.linkedin.com/v2/me",
            "youtube": "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        }
        
        if platform not in validation_endpoints:
            return False
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    validation_endpoints[platform],
                    headers=headers,
                    timeout=10.0
                )
                return response.status_code == 200
        except Exception:
            return False