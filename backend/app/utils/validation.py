"""
Backend validation utilities for security and data integrity
"""
import re
from typing import List

# Valid platform names (must match OAuth2Service.PLATFORMS)
VALID_PLATFORMS = ['twitter', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube']

# UUID v4 regex pattern
UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', re.IGNORECASE)

def validate_platform(platform: str) -> bool:
    """Validate platform name"""
    return platform in VALID_PLATFORMS

def validate_uuid(id_str: str) -> bool:
    """Validate UUID format"""
    return UUID_PATTERN.match(id_str) is not None

def validate_account_id(account_id: str) -> bool:
    """Validate account ID (must be UUID)"""
    return validate_uuid(account_id)

def sanitize_string(input_str: str, max_length: int = 1000) -> str:
    """Sanitize string input to prevent XSS"""
    if not isinstance(input_str, str):
        return ""
    
    return input_str.replace('<', '').replace('>', '').strip()[:max_length]

def validate_oauth_state(state: str) -> bool:
    """Validate OAuth state parameter"""
    if not isinstance(state, str) or len(state) < 32:
        return False
    
    # State should be base64url safe characters only
    return re.match(r'^[A-Za-z0-9_-]+$', state) is not None

def validate_oauth_code(code: str) -> bool:
    """Validate OAuth authorization code"""
    if not isinstance(code, str):
        return False
    
    # Authorization codes should be alphanumeric and reasonable length
    return (10 <= len(code) <= 512 and 
            re.match(r'^[A-Za-z0-9_-]+$', code) is not None)

def sanitize_error_message(error: str) -> str:
    """
    Secure error message filtering
    Removes sensitive information from error messages before displaying to user
    """
    if not isinstance(error, str):
        return "Unknown error"
    
    # Patterns to remove sensitive information
    sensitive_patterns = [
        (r'token[s]?[:=]\s*[^\s,}]+', 'token: [REDACTED]'),
        (r'key[s]?[:=]\s*[^\s,}]+', 'key: [REDACTED]'),
        (r'secret[s]?[:=]\s*[^\s,}]+', 'secret: [REDACTED]'),
        (r'password[s]?[:=]\s*[^\s,}]+', 'password: [REDACTED]'),
        (r'Bearer\s+[^\s,}]+', 'Bearer [REDACTED]'),
        (r'\b[a-f0-9]{32,}\b', '[REDACTED]'),  # Potential hashes/tokens (word boundary)
        (r'sk_[a-zA-Z0-9]+', '[REDACTED]'),  # API keys starting with sk_
    ]

    sanitized = error
    for pattern, replacement in sensitive_patterns:
        sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)

    return sanitized

def validate_api_endpoint(endpoint: str) -> bool:
    """Validate API endpoint path"""
    if not isinstance(endpoint, str):
        return False
    
    # Should start with /api/v and contain only safe characters
    return re.match(r'^/api/v\d+/[\w\/-]+$', endpoint) is not None

def validate_email(email: str) -> bool:
    """Validate email format"""
    if not isinstance(email, str) or len(email) > 254:
        return False
    
    # Simple email validation
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password_strength(password: str) -> tuple[bool, List[str]]:
    """
    Validate password strength
    Returns (is_valid, list_of_issues)
    """
    issues = []
    
    if not isinstance(password, str):
        return False, ["Password must be a string"]
    
    if len(password) < 8:
        issues.append("Password must be at least 8 characters long")
    
    if len(password) > 128:
        issues.append("Password must be less than 128 characters")
    
    if not re.search(r'[a-z]', password):
        issues.append("Password must contain at least one lowercase letter")
    
    if not re.search(r'[A-Z]', password):
        issues.append("Password must contain at least one uppercase letter")
    
    if not re.search(r'\d', password):
        issues.append("Password must contain at least one number")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        issues.append("Password must contain at least one special character")
    
    return len(issues) == 0, issues

def validate_username(username: str) -> bool:
    """Validate username format"""
    if not isinstance(username, str):
        return False
    
    # Username should be 3-30 characters, alphanumeric with underscores
    if not (3 <= len(username) <= 30):
        return False
    
    return re.match(r'^[a-zA-Z0-9_]+$', username) is not None

def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal"""
    if not isinstance(filename, str):
        return "file"
    
    # Remove directory traversal attempts
    sanitized = filename.replace('..', '').replace('/', '').replace('\\', '')
    
    # Remove special characters except dots and dashes
    sanitized = re.sub(r'[^a-zA-Z0-9._-]', '', sanitized)
    
    # Limit length
    return sanitized[:255] if sanitized else "file"