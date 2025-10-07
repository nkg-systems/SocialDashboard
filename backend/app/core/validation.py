"""
Input validation utilities for API security.
"""
import re
import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, validator
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


class ValidationError(HTTPException):
    """Custom validation error with sanitized messages."""
    
    def __init__(self, detail: str = "Invalid input parameters", status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)


class InputValidator:
    """Utilities for validating and sanitizing API inputs."""
    
    # Safe character patterns
    PLATFORM_PATTERN = re.compile(r'^[a-z]+$')
    STATE_PATTERN = re.compile(r'^[A-Za-z0-9_-]{16,128}$')
    CODE_PATTERN = re.compile(r'^[A-Za-z0-9_.-]{10,512}$')
    UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    USERNAME_PATTERN = re.compile(r'^[A-Za-z0-9_.-]{1,50}$')
    
    @staticmethod
    def validate_platform(platform: str) -> str:
        """Validate social media platform name."""
        if not platform:
            raise ValidationError("Platform parameter is required")
        
        platform = platform.lower().strip()
        
        if not InputValidator.PLATFORM_PATTERN.match(platform):
            raise ValidationError("Invalid platform identifier")
        
        if len(platform) > 20:
            raise ValidationError("Platform identifier too long")
            
        return platform
    
    @staticmethod
    def validate_oauth_state(state: str) -> str:
        """Validate OAuth state parameter."""
        if not state:
            raise ValidationError("OAuth state parameter is required")
        
        state = state.strip()
        
        if not InputValidator.STATE_PATTERN.match(state):
            raise ValidationError("Invalid OAuth state format")
            
        return state
    
    @staticmethod
    def validate_oauth_code(code: str) -> str:
        """Validate OAuth authorization code."""
        if not code:
            raise ValidationError("OAuth authorization code is required")
        
        code = code.strip()
        
        if not InputValidator.CODE_PATTERN.match(code):
            raise ValidationError("Invalid OAuth authorization code format")
            
        return code
    
    @staticmethod
    def validate_account_id(account_id: str) -> str:
        """Validate social account UUID."""
        if not account_id:
            raise ValidationError("Account ID is required")
        
        account_id = account_id.lower().strip()
        
        if not InputValidator.UUID_PATTERN.match(account_id):
            raise ValidationError("Invalid account identifier format")
            
        return account_id
    
    @staticmethod
    def validate_username(username: str) -> str:
        """Validate social media username."""
        if not username:
            raise ValidationError("Username is required")
        
        username = username.strip()
        
        if not InputValidator.USERNAME_PATTERN.match(username):
            raise ValidationError("Invalid username format")
            
        return username
    
    @staticmethod
    def sanitize_error_message(error: Exception, context: str = None) -> str:
        """Sanitize error messages to prevent information disclosure."""
        # Common error message patterns to sanitize
        sensitive_patterns = [
            r'password',
            r'secret',
            r'key',
            r'token',
            r'credential',
            r'authentication',
            r'authorization',
            r'database',
            r'connection',
            r'internal',
            r'server',
            r'stack trace',
            r'file not found',
            r'permission denied',
            r'access denied'
        ]
        
        error_str = str(error).lower()
        
        # Generic network/HTTP errors (check first, before sensitive patterns)
        if any(phrase in error_str for phrase in ['connection', 'timeout', 'network', 'http']):
            return "Service temporarily unavailable"
        
        # OAuth specific errors (check before sensitive patterns)
        if any(phrase in error_str for phrase in ['oauth', 'authorization']) and 'token' not in error_str:
            return "Authentication service error"
        
        # Database errors (check before sensitive patterns)
        if any(phrase in error_str for phrase in ['database', 'sql', 'query']):
            return "Data service temporarily unavailable"
        
        # Check if error contains sensitive information
        for pattern in sensitive_patterns:
            if re.search(pattern, error_str):
                logger.warning(f"Sanitized sensitive error in {context}: {error}")
                return "An error occurred while processing your request"
        
        # Log the actual error for debugging
        logger.error(f"Error in {context}: {error}")
        
        # Return sanitized generic message
        return "An error occurred while processing your request"


class OAuthRequestValidator(BaseModel):
    """Request validator for OAuth endpoints."""
    
    platform: str
    
    @validator('platform')
    def validate_platform_field(cls, v):
        return InputValidator.validate_platform(v)


class OAuthCallbackValidator(BaseModel):
    """Request validator for OAuth callback."""
    
    platform: str
    code: str
    state: str
    error: Optional[str] = None
    
    @validator('platform')
    def validate_platform_field(cls, v):
        return InputValidator.validate_platform(v)
    
    @validator('code')
    def validate_code_field(cls, v):
        return InputValidator.validate_oauth_code(v)
    
    @validator('state')
    def validate_state_field(cls, v):
        return InputValidator.validate_oauth_state(v)
    
    @validator('error', pre=True)
    def validate_error_field(cls, v):
        if v is not None:
            # Sanitize error parameter to prevent XSS and remove dangerous content
            v = str(v)[:100]  # Truncate first
            v = re.sub(r'[<>&"\']', '', v)  # Remove dangerous characters
            v = re.sub(r'script|javascript|onload|onerror|alert|eval|prompt|confirm', '', v, flags=re.IGNORECASE)  # Remove script-related content
        return v


class AccountRequestValidator(BaseModel):
    """Request validator for account operations."""
    
    account_id: str
    
    @validator('account_id')
    def validate_account_id_field(cls, v):
        return InputValidator.validate_account_id(v)