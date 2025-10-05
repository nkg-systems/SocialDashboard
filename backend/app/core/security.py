"""
Security utilities for authentication and authorization.
"""
from datetime import datetime, timedelta
from typing import Any, Union, Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, status
from .config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    """
    Create JWT access token.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(subject: Union[str, Any]) -> str:
    """
    Create JWT refresh token.
    """
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str) -> Optional[str]:
    """
    Verify JWT token and return subject.
    """
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        token_data = payload.get("sub")
        if token_data is None:
            return None
        return token_data
    except JWTError:
        return None


def verify_refresh_token(token: str) -> Optional[str]:
    """
    Verify refresh token and return subject.
    """
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        token_type = payload.get("type")
        if token_type != "refresh":
            return None
        token_data = payload.get("sub")
        if token_data is None:
            return None
        return token_data
    except JWTError:
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password for storage.
    """
    return pwd_context.hash(password)


def generate_password_reset_token(email: str) -> str:
    """
    Generate password reset token.
    """
    delta = timedelta(hours=24)  # 24 hours expiry
    now = datetime.utcnow()
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> Optional[str]:
    """
    Verify password reset token and return email.
    """
    try:
        decoded_token = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        return decoded_token["sub"]
    except JWTError:
        return None


class SecurityUtils:
    """
    Security utilities class for additional security operations.
    """
    
    @staticmethod
    def generate_state_token() -> str:
        """
        Generate state token for OAuth2 CSRF protection.
        """
        import secrets
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def generate_code_verifier() -> str:
        """
        Generate code verifier for PKCE.
        """
        import secrets
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def generate_code_challenge(code_verifier: str) -> str:
        """
        Generate code challenge from verifier for PKCE.
        """
        import hashlib
        import base64
        digest = hashlib.sha256(code_verifier.encode('utf-8')).digest()
        return base64.urlsafe_b64encode(digest).decode('utf-8').rstrip('=')
    
    @staticmethod
    def encrypt_token(token: str, key: str) -> str:
        """
        Encrypt OAuth tokens for storage.
        """
        from cryptography.fernet import Fernet
        import base64
        import hashlib
        
        # Create key from provided key
        key_bytes = hashlib.sha256(key.encode()).digest()
        fernet_key = base64.urlsafe_b64encode(key_bytes)
        f = Fernet(fernet_key)
        
        return f.encrypt(token.encode()).decode()
    
    @staticmethod
    def decrypt_token(encrypted_token: str, key: str) -> str:
        """
        Decrypt OAuth tokens from storage.
        """
        from cryptography.fernet import Fernet
        import base64
        import hashlib
        
        # Create key from provided key
        key_bytes = hashlib.sha256(key.encode()).digest()
        fernet_key = base64.urlsafe_b64encode(key_bytes)
        f = Fernet(fernet_key)
        
        return f.decrypt(encrypted_token.encode()).decode()