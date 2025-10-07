"""
Security headers middleware for enhanced protection
"""
from fastapi import Request
from fastapi.responses import Response

async def security_headers_middleware(request: Request, call_next):
    """Add security headers to all responses"""
    
    response: Response = await call_next(request)
    
    # Security headers
    security_headers = {
        # Prevent XSS attacks
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        
        # HSTS (only add if using HTTPS)
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains" if request.url.scheme == "https" else None,
        
        # Referrer policy
        "Referrer-Policy": "strict-origin-when-cross-origin",
        
        # Permissions policy
        "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
        
        # Content Security Policy
        "Content-Security-Policy": (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none';"
        ),
        
        # Server information hiding
        "Server": "SM3D-API",
    }
    
    # Add headers to response
    for header_name, header_value in security_headers.items():
        if header_value is not None:
            response.headers[header_name] = header_value
    
    # Remove potentially sensitive headers
    if "server" in response.headers:
        del response.headers["server"]
    if "x-powered-by" in response.headers:
        del response.headers["x-powered-by"]
    
    return response