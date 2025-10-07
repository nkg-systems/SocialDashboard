"""
Rate limiting middleware for API protection
"""
import time
from typing import Dict, List
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from collections import defaultdict, deque
import hashlib

class RateLimiter:
    """
    Token bucket rate limiter with sliding window
    """
    
    def __init__(
        self,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        burst_limit: int = 10
    ):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.burst_limit = burst_limit
        
        # Store request history: {client_id: deque of timestamps}
        self.request_history: Dict[str, deque] = defaultdict(lambda: deque())
        self.blocked_clients: Dict[str, float] = {}  # {client_id: unblock_time}
        
    def get_client_id(self, request: Request) -> str:
        """Generate unique client ID from IP and user agent"""
        # Use IP address and User-Agent for identification
        ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Hash for privacy
        client_data = f"{ip}:{user_agent}"
        return hashlib.sha256(client_data.encode()).hexdigest()[:16]
        
    def is_allowed(self, client_id: str) -> tuple[bool, Dict[str, int]]:
        """
        Check if request is allowed for client
        Returns (allowed, rate_limit_info)
        """
        now = time.time()
        
        # Check if client is temporarily blocked
        if client_id in self.blocked_clients:
            if now < self.blocked_clients[client_id]:
                remaining = int(self.blocked_clients[client_id] - now)
                return False, {
                    "retry_after": remaining,
                    "requests_remaining": 0,
                    "reset_time": int(self.blocked_clients[client_id])
                }
            else:
                # Unblock client
                del self.blocked_clients[client_id]
        
        # Get request history for this client
        history = self.request_history[client_id]
        
        # Remove old requests (older than 1 hour)
        hour_ago = now - 3600
        while history and history[0] < hour_ago:
            history.popleft()
            
        # Count requests in the last minute
        minute_ago = now - 60
        recent_requests = sum(1 for timestamp in history if timestamp > minute_ago)
        
        # Check burst limit (requests in last 10 seconds)
        burst_window = now - 10
        burst_requests = sum(1 for timestamp in history if timestamp > burst_window)
        
        # Rate limiting logic
        total_requests = len(history)
        
        # Check burst limit
        if burst_requests >= self.burst_limit:
            self.blocked_clients[client_id] = now + 60  # Block for 1 minute
            return False, {
                "retry_after": 60,
                "requests_remaining": 0,
                "reset_time": int(now + 60)
            }
            
        # Check minute limit
        if recent_requests >= self.requests_per_minute:
            return False, {
                "retry_after": 60,
                "requests_remaining": 0,
                "reset_time": int(now + 60)
            }
            
        # Check hour limit
        if total_requests >= self.requests_per_hour:
            return False, {
                "retry_after": 3600,
                "requests_remaining": 0,
                "reset_time": int(now + 3600)
            }
        
        # Request is allowed - add to history
        history.append(now)
        
        # Calculate remaining requests
        minute_remaining = max(0, self.requests_per_minute - recent_requests - 1)
        hour_remaining = max(0, self.requests_per_hour - total_requests)
        
        return True, {
            "requests_remaining": min(minute_remaining, hour_remaining),
            "reset_time": int(now + 60),
            "retry_after": 0
        }
    
    def cleanup_old_data(self):
        """Clean up old request history data"""
        now = time.time()
        hour_ago = now - 3600
        
        # Clean up request history
        for client_id in list(self.request_history.keys()):
            history = self.request_history[client_id]
            while history and history[0] < hour_ago:
                history.popleft()
            
            # Remove empty histories
            if not history:
                del self.request_history[client_id]
        
        # Clean up expired blocks
        for client_id in list(self.blocked_clients.keys()):
            if now >= self.blocked_clients[client_id]:
                del self.blocked_clients[client_id]

# Global rate limiter instance
rate_limiter = RateLimiter(
    requests_per_minute=60,
    requests_per_hour=1000,
    burst_limit=10
)

async def rate_limit_middleware(request: Request, call_next):
    """FastAPI middleware for rate limiting"""
    
    # Skip rate limiting for health checks and static files
    if request.url.path in ["/health", "/", "/favicon.ico"]:
        return await call_next(request)
    
    client_id = rate_limiter.get_client_id(request)
    allowed, rate_info = rate_limiter.is_allowed(client_id)
    
    if not allowed:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": "Rate limit exceeded",
                "retry_after": rate_info["retry_after"],
                "requests_remaining": rate_info["requests_remaining"]
            },
            headers={
                "Retry-After": str(rate_info["retry_after"]),
                "X-RateLimit-Remaining": str(rate_info["requests_remaining"]),
                "X-RateLimit-Reset": str(rate_info["reset_time"])
            }
        )
    
    # Process the request
    response = await call_next(request)
    
    # Add rate limit headers to response
    response.headers["X-RateLimit-Remaining"] = str(rate_info["requests_remaining"])
    response.headers["X-RateLimit-Reset"] = str(rate_info["reset_time"])
    
    return response

# Cleanup task - call this periodically
def cleanup_rate_limiter():
    """Clean up old rate limiting data"""
    rate_limiter.cleanup_old_data()