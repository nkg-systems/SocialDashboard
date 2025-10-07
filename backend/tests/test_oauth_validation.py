"""
Test OAuth input validation and error sanitization.
"""
import pytest
from unittest.mock import Mock, patch
from fastapi import HTTPException
from app.core.validation import InputValidator, ValidationError, OAuthCallbackValidator


class TestInputValidator:
    """Test input validation utilities."""
    
    def test_valid_platform(self):
        """Test validation of valid platform names."""
        assert InputValidator.validate_platform("twitter") == "twitter"
        assert InputValidator.validate_platform("FACEBOOK") == "facebook"
        assert InputValidator.validate_platform(" instagram ") == "instagram"
    
    def test_invalid_platform(self):
        """Test validation rejects invalid platform names."""
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_platform("")
        assert "Platform parameter is required" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_platform("twitter123")
        assert "Invalid platform identifier" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_platform("x" * 25)
        assert "Platform identifier too long" in str(exc_info.value)
    
    def test_valid_oauth_state(self):
        """Test validation of valid OAuth state tokens."""
        valid_state = "abcdef123456789_-"
        assert InputValidator.validate_oauth_state(valid_state) == valid_state
    
    def test_invalid_oauth_state(self):
        """Test validation rejects invalid OAuth state tokens."""
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_oauth_state("")
        assert "OAuth state parameter is required" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_oauth_state("short")
        assert "Invalid OAuth state format" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_oauth_state("invalid@state!")
        assert "Invalid OAuth state format" in str(exc_info.value)
    
    def test_valid_oauth_code(self):
        """Test validation of valid OAuth codes."""
        valid_code = "abc123-def456.ghi789_jkl012"
        assert InputValidator.validate_oauth_code(valid_code) == valid_code
    
    def test_invalid_oauth_code(self):
        """Test validation rejects invalid OAuth codes."""
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_oauth_code("")
        assert "OAuth authorization code is required" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_oauth_code("short")
        assert "Invalid OAuth authorization code format" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_oauth_code("invalid@code!")
        assert "Invalid OAuth authorization code format" in str(exc_info.value)
    
    def test_valid_account_id(self):
        """Test validation of valid UUID account IDs."""
        valid_uuid = "123e4567-e89b-12d3-a456-426614174000"
        assert InputValidator.validate_account_id(valid_uuid) == valid_uuid
    
    def test_invalid_account_id(self):
        """Test validation rejects invalid account IDs."""
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_account_id("")
        assert "Account ID is required" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_account_id("not-a-uuid")
        assert "Invalid account identifier format" in str(exc_info.value)


class TestErrorSanitization:
    """Test error message sanitization."""
    
    def test_sanitize_sensitive_errors(self):
        """Test that sensitive information is removed from error messages."""
        sensitive_errors = [
            Exception("Database password failed"),
            Exception("Secret key not found"),
            Exception("Invalid authentication token"),
            Exception("Internal server error occurred"),
            Exception("Connection to database failed"),
        ]
        
        for error in sensitive_errors:
            sanitized = InputValidator.sanitize_error_message(error, "test_context")
            # Should not contain the original sensitive message
            assert "password" not in sanitized.lower()
            assert "secret" not in sanitized.lower()
            assert "token" not in sanitized.lower()
            assert "internal" not in sanitized.lower()
            assert "database" not in sanitized.lower()
    
    def test_categorize_error_types(self):
        """Test that errors are categorized appropriately."""
        network_error = Exception("Connection timeout occurred")
        sanitized = InputValidator.sanitize_error_message(network_error)
        assert sanitized == "Service temporarily unavailable"
        
        oauth_error = Exception("OAuth authorization failed")
        sanitized = InputValidator.sanitize_error_message(oauth_error)
        assert sanitized == "Authentication service error"
        
        db_error = Exception("Database query failed")
        sanitized = InputValidator.sanitize_error_message(db_error)
        assert sanitized == "Data service temporarily unavailable"
    
    def test_generic_error_fallback(self):
        """Test generic error message fallback."""
        generic_error = Exception("Some random error")
        sanitized = InputValidator.sanitize_error_message(generic_error)
        assert sanitized == "An error occurred while processing your request"


class TestOAuthValidators:
    """Test OAuth request validators."""
    
    def test_valid_oauth_callback_validator(self):
        """Test OAuth callback validator with valid input."""
        valid_data = {
            "platform": "twitter",
            "code": "abc123def456ghi789",
            "state": "state123456789_abcdef",
            "error": None
        }
        
        validator = OAuthCallbackValidator(**valid_data)
        assert validator.platform == "twitter"
        assert validator.code == "abc123def456ghi789"
        assert validator.state == "state123456789_abcdef"
        assert validator.error is None
    
    def test_oauth_callback_validator_with_error(self):
        """Test OAuth callback validator sanitizes error parameter."""
        data_with_error = {
            "platform": "twitter",
            "code": "abc123def456ghi789",
            "state": "state123456789_abcdef", 
            "error": "<script>alert('xss')</script>access_denied"
        }
        
        validator = OAuthCallbackValidator(**data_with_error)
        # Should sanitize XSS attempts and truncate
        assert "<script>" not in validator.error
        assert "alert" not in validator.error
        assert len(validator.error) <= 100
    
    def test_invalid_oauth_callback_validator(self):
        """Test OAuth callback validator rejects invalid input."""
        invalid_data = {
            "platform": "invalid@platform",
            "code": "short",
            "state": "invalid_state_format",
        }
        
        with pytest.raises(Exception):  # Pydantic validation error
            OAuthCallbackValidator(**invalid_data)