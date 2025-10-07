"""
Security tests for all the fixes we implemented
Tests OAuth state validation, CSRF protection, input validation, and more
"""
import pytest
import time
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

# Import our security components
from app.core.oauth_state_store import OAuthStateStore
from app.middleware.rate_limiting import RateLimiter
from app.services.oauth_service import OAuth2Service
from app.utils.validation import (
    validate_platform, validate_account_id, validate_oauth_state, 
    validate_oauth_code, sanitize_error_message
)


class TestOAuthStateStore:
    """Test OAuth state store security"""
    
    def setup_method(self):
        self.state_store = OAuthStateStore(expiry_minutes=10)
    
    def test_store_and_retrieve_state(self):
        """Test basic state storage and retrieval"""
        state = "test_state_12345"
        user_id = "user_123"
        platform = "twitter"
        code_verifier = "test_verifier"
        redirect_uri = "http://localhost:3000/callback"
        
        # Store state
        self.state_store.store_state(
            state=state,
            user_id=user_id,
            platform=platform,
            code_verifier=code_verifier,
            redirect_uri=redirect_uri
        )
        
        # Retrieve state
        data = self.state_store.get_and_remove_state(state)
        
        assert data is not None
        assert data["user_id"] == user_id
        assert data["platform"] == platform
        assert data["code_verifier"] == code_verifier
        assert data["redirect_uri"] == redirect_uri
    
    def test_state_one_time_use(self):
        """Test that state can only be used once (CSRF protection)"""
        state = "test_state_54321"
        
        self.state_store.store_state(
            state=state,
            user_id="user_123",
            platform="twitter",
            code_verifier="verifier",
            redirect_uri="http://test.com"
        )
        
        # First retrieval should work
        data1 = self.state_store.get_and_remove_state(state)
        assert data1 is not None
        
        # Second retrieval should fail (already used)
        data2 = self.state_store.get_and_remove_state(state)
        assert data2 is None
    
    def test_state_expiry(self):
        """Test that expired states are rejected"""
        # Create state store with very short expiry
        short_store = OAuthStateStore(expiry_minutes=0.01)  # ~0.6 seconds
        
        state = "test_expiry_state"
        short_store.store_state(
            state=state,
            user_id="user_123",
            platform="twitter",
            code_verifier="verifier",
            redirect_uri="http://test.com"
        )
        
        # Wait for expiry
        time.sleep(1)
        
        # Should return None for expired state
        data = short_store.get_and_remove_state(state)
        assert data is None
    
    def test_invalid_state(self):
        """Test handling of invalid/non-existent states"""
        data = self.state_store.get_and_remove_state("non_existent_state")
        assert data is None
    
    def test_state_validation(self):
        """Test state validation without removal"""
        state = "validation_test_state"
        user_id = "user_123"
        platform = "twitter"
        
        self.state_store.store_state(
            state=state,
            user_id=user_id,
            platform=platform,
            code_verifier="verifier",
            redirect_uri="http://test.com"
        )
        
        # Valid validation
        assert self.state_store.validate_state(state, user_id, platform) == True
        
        # Invalid user
        assert self.state_store.validate_state(state, "wrong_user", platform) == False
        
        # Invalid platform
        assert self.state_store.validate_state(state, user_id, "wrong_platform") == False


class TestRateLimiter:
    """Test rate limiting functionality"""
    
    def setup_method(self):
        self.rate_limiter = RateLimiter(
            requests_per_minute=5,
            requests_per_hour=20,
            burst_limit=3
        )
    
    def test_normal_requests_allowed(self):
        """Test that normal requests are allowed"""
        client_id = "test_client_1"
        
        for i in range(3):  # Within burst limit
            allowed, info = self.rate_limiter.is_allowed(client_id)
            assert allowed == True
            assert info["requests_remaining"] >= 0
    
    def test_burst_limit_protection(self):
        """Test burst limit protection"""
        client_id = "test_client_burst"
        
        # Make requests up to burst limit
        for i in range(3):  # Burst limit is 3
            allowed, info = self.rate_limiter.is_allowed(client_id)
            assert allowed == True
        
        # Next request should be blocked
        allowed, info = self.rate_limiter.is_allowed(client_id)
        assert allowed == False
        assert info["retry_after"] > 0
    
    def test_minute_rate_limit(self):
        """Test per-minute rate limiting"""
        client_id = "test_client_minute"
        
        # Simulate requests spread over time to avoid burst limit
        with patch('app.middleware.rate_limiting.time.time') as mock_time:
            current_time = 1000.0
            mock_time.return_value = current_time
            
            # Make requests up to minute limit (with time spacing)
            for i in range(5):  # requests_per_minute = 5
                mock_time.return_value = current_time + (i * 12)  # 12 seconds apart
                allowed, info = self.rate_limiter.is_allowed(client_id)
                assert allowed == True
            
            # Next request within same minute should be blocked
            mock_time.return_value = current_time + 59  # Still within same minute
            allowed, info = self.rate_limiter.is_allowed(client_id)
            assert allowed == False


class TestInputValidation:
    """Test input validation utilities"""
    
    def test_platform_validation(self):
        """Test platform name validation"""
        # Valid platforms
        assert validate_platform("twitter") == True
        assert validate_platform("facebook") == True
        assert validate_platform("instagram") == True
        assert validate_platform("linkedin") == True
        assert validate_platform("tiktok") == True
        assert validate_platform("youtube") == True
        
        # Invalid platforms
        assert validate_platform("invalid") == False
        assert validate_platform("") == False
        assert validate_platform("TWITTER") == False  # Case sensitive
        assert validate_platform("twitter; DROP TABLE users;") == False
    
    def test_account_id_validation(self):
        """Test account ID UUID validation"""
        # Valid UUIDs
        assert validate_account_id("550e8400-e29b-41d4-a716-446655440000") == True
        assert validate_account_id("6ba7b810-9dad-11d1-80b4-00c04fd430c8") == True
        
        # Invalid UUIDs
        assert validate_account_id("not-a-uuid") == False
        assert validate_account_id("") == False
        assert validate_account_id("550e8400-e29b-41d4-a716") == False  # Too short
        assert validate_account_id("550e8400-e29b-41d4-a716-446655440000; DROP TABLE;") == False
    
    def test_oauth_state_validation(self):
        """Test OAuth state parameter validation"""
        # Valid states (base64url, >= 32 chars)
        assert validate_oauth_state("abcdefghijklmnopqrstuvwxyz123456") == True
        assert validate_oauth_state("ABC123_-" * 8) == True
        
        # Invalid states
        assert validate_oauth_state("short") == False  # Too short
        assert validate_oauth_state("") == False
        assert validate_oauth_state("invalid+chars=here") == False  # Invalid chars
        assert validate_oauth_state("a" * 31) == False  # Just under 32 chars
    
    def test_oauth_code_validation(self):
        """Test OAuth authorization code validation"""
        # Valid codes
        assert validate_oauth_code("valid_auth_code_123") == True
        assert validate_oauth_code("a" * 50) == True  # Reasonable length
        
        # Invalid codes
        assert validate_oauth_code("short") == False  # Too short
        assert validate_oauth_code("") == False
        assert validate_oauth_code("a" * 600) == False  # Too long
        assert validate_oauth_code("invalid chars!@#") == False  # Invalid chars
    
    def test_error_message_sanitization(self):
        """Test that sensitive information is removed from error messages"""
        # Test token sanitization
        error = "Authentication failed with token: abc123xyz789"
        sanitized = sanitize_error_message(error)
        assert "abc123xyz789" not in sanitized
        assert "[REDACTED]" in sanitized
        
        # Test key sanitization
        error = "API key invalid: sk_live_123456789"
        sanitized = sanitize_error_message(error)
        assert "sk_live_123456789" not in sanitized
        
        # Test Bearer token sanitization
        error = "Bearer abcd1234efgh5678 is invalid"
        sanitized = sanitize_error_message(error)
        assert "abcd1234efgh5678" not in sanitized
        
        # Test password sanitization
        error = "Password: mySecret123 is incorrect"
        sanitized = sanitize_error_message(error)
        assert "mySecret123" not in sanitized


class TestOAuth2ServiceSecurity:
    """Test OAuth2 service security features"""
    
    def setup_method(self):
        self.oauth_service = OAuth2Service()
    
    def test_state_generation_uniqueness(self):
        """Test that generated states are unique"""
        states = set()
        for _ in range(100):
            auth_url, state, code_verifier = self.oauth_service.get_authorization_url(
                platform="twitter",
                redirect_uri="http://test.com",
                user_id="test_user"
            )
            states.add(state.split(':')[0])  # Get state part before user_id
        
        # All states should be unique
        assert len(states) == 100
    
    def test_code_verifier_generation(self):
        """Test PKCE code verifier generation"""
        auth_url, state, code_verifier = self.oauth_service.get_authorization_url(
            platform="twitter",
            redirect_uri="http://test.com",
            user_id="test_user"
        )
        
        # Code verifier should be present and proper length
        assert code_verifier is not None
        assert len(code_verifier) >= 32
        assert all(c.isalnum() or c in '-_' for c in code_verifier)
    
    def test_invalid_platform_rejection(self):
        """Test that invalid platforms are rejected"""
        with pytest.raises(ValueError, match="Unsupported platform"):
            self.oauth_service.get_authorization_url(
                platform="invalid_platform",
                redirect_uri="http://test.com",
                user_id="test_user"
            )
    
    def test_token_encryption_decryption(self):
        """Test token encryption and decryption"""
        original_token = "test_access_token_123"
        user_id = "user_123"
        
        # Encrypt token
        encrypted = self.oauth_service.encrypt_token(original_token, user_id)
        
        # Should be different from original
        assert encrypted != original_token
        
        # Decrypt should return original
        decrypted = self.oauth_service.decrypt_token(encrypted, user_id)
        assert decrypted == original_token
    
    def test_token_encryption_user_specific(self):
        """Test that encrypted tokens are user-specific"""
        token = "test_token"
        user1 = "user_1"
        user2 = "user_2"
        
        encrypted1 = self.oauth_service.encrypt_token(token, user1)
        encrypted2 = self.oauth_service.encrypt_token(token, user2)
        
        # Same token encrypted for different users should be different
        assert encrypted1 != encrypted2
        
        # Wrong user should not be able to decrypt
        with pytest.raises(Exception):  # Fernet will raise InvalidToken
            self.oauth_service.decrypt_token(encrypted1, user2)


# Integration test for the complete OAuth flow
class TestOAuthFlowSecurity:
    """Test the complete OAuth flow security"""
    
    @pytest.fixture
    def client(self):
        from app.main import app
        return TestClient(app)
    
    def test_oauth_initiation_requires_auth(self, client):
        """Test that OAuth initiation requires authentication"""
        response = client.post("/api/v1/social/connect/twitter")
        assert response.status_code == 401  # Unauthorized
    
    def test_invalid_platform_rejected(self, client):
        """Test that invalid platforms are rejected"""
        # Mock authentication
        with patch('app.api.deps.get_current_user') as mock_user:
            mock_user.return_value = Mock(id="user_123")
            
            response = client.post("/api/v1/social/connect/invalid_platform")
            assert response.status_code == 400
            assert "Unsupported platform" in response.json()["detail"]
    
    def test_oauth_callback_validates_state(self, client):
        """Test that OAuth callback validates state properly"""
        # Test with invalid state
        response = client.get(
            "/api/v1/social/callback/twitter",
            params={
                "code": "test_code",
                "state": "invalid_state"
            }
        )
        assert response.status_code == 400
        assert "Invalid or expired OAuth state" in response.json()["detail"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])