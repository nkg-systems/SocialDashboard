"""
OAuth State Store for secure CSRF protection
Provides secure storage and validation of OAuth state tokens
"""
import time
import secrets
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta

class OAuthStateStore:
    """
    Secure in-memory storage for OAuth state tokens and PKCE verifiers.
    In production, this should be backed by Redis or similar distributed cache.
    """
    
    def __init__(self, expiry_minutes: int = 10):
        self._store: Dict[str, Dict] = {}
        self._expiry_minutes = expiry_minutes
        
    def store_state(
        self, 
        state: str, 
        user_id: str, 
        platform: str,
        code_verifier: str,
        redirect_uri: str
    ) -> None:
        """Store OAuth state with associated data"""
        expires_at = datetime.utcnow() + timedelta(minutes=self._expiry_minutes)
        
        self._store[state] = {
            "user_id": user_id,
            "platform": platform,
            "code_verifier": code_verifier,
            "redirect_uri": redirect_uri,
            "created_at": datetime.utcnow(),
            "expires_at": expires_at
        }
        
        # Clean up expired entries
        self._cleanup_expired()
    
    def get_and_remove_state(self, state: str) -> Optional[Dict]:
        """Get state data and remove it (one-time use)"""
        self._cleanup_expired()
        
        if state not in self._store:
            return None
            
        data = self._store.pop(state)
        
        # Check if expired
        if datetime.utcnow() > data["expires_at"]:
            return None
            
        return data
    
    def validate_state(self, state: str, user_id: str, platform: str) -> bool:
        """Validate state without removing it"""
        data = self._store.get(state)
        
        if not data:
            return False
            
        if datetime.utcnow() > data["expires_at"]:
            return False
            
        return (
            data["user_id"] == user_id and 
            data["platform"] == platform
        )
    
    def _cleanup_expired(self) -> None:
        """Remove expired state entries"""
        now = datetime.utcnow()
        expired_keys = [
            key for key, data in self._store.items()
            if now > data["expires_at"]
        ]
        
        for key in expired_keys:
            del self._store[key]

# Global instance (in production, use Redis)
oauth_state_store = OAuthStateStore()