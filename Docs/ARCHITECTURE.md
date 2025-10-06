# SM3D System Architecture

## Overview
This document outlines the comprehensive system architecture for the Social Media Monitoring & Management Dashboard (SM3D), focusing on scalability, security, and maintainability.

## Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Backend       │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   Services      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Static CDN    │    │   Load Balancer │    │   Database      │
│   (Assets)      │    │   (Future)      │    │   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   Cache Layer   │
                                               │   (Redis)       │
                                               └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   Background    │
                                               │   Workers       │
                                               │   (Celery/RQ)   │
                                               └─────────────────┘
```

## Component Architecture

### 1. Frontend Layer (Next.js)
```typescript
// Component hierarchy
App/
├── Layout/
│   ├── Sidebar/
│   ├── Topbar/
│   └── Main/
├── Pages/
│   ├── Dashboard/
│   ├── Analytics/
│   ├── PostManager/
│   ├── Notifications/
│   └── Settings/
├── Components/
│   ├── UI/
│   │   ├── Card/
│   │   ├── Chart/
│   │   ├── Modal/
│   │   └── Form/
│   ├── Business/
│   │   ├── MetricCard/
│   │   ├── PostComposer/
│   │   ├── SocialConnector/
│   │   └── AnalyticsChart/
│   └── Shared/
│       ├── Loading/
│       ├── Error/
│       └── Empty/
└── Services/
    ├── api.ts
    ├── auth.ts
    └── websocket.ts
```

**Security Features:**
- Content Security Policy (CSP)
- XSS protection through React's built-in sanitization
- Secure HTTP headers
- Input validation on client side
- Secure token storage (httpOnly cookies)

### 2. Backend Layer (FastAPI)

```python
# Backend structure
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth.py
│   │   │   ├── social.py
│   │   │   ├── analytics.py
│   │   │   ├── posts.py
│   │   │   └── users.py
│   │   └── deps.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── database.py
│   ├── models/
│   │   ├── user.py
│   │   ├── social_account.py
│   │   ├── post.py
│   │   └── analytics.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── social_service.py
│   │   ├── analytics_service.py
│   │   └── ai_service.py
│   └── utils/
│       ├── validators.py
│       ├── helpers.py
│       └── exceptions.py
├── tests/
└── migrations/
```

**Security Features:**
- JWT token authentication with refresh tokens
- OAuth2 with PKCE for social media integrations
- API rate limiting (Redis-based)
- Request/response validation with Pydantic
- SQL injection prevention with SQLAlchemy ORM
- CORS configuration
- Environment-based secrets management

### 3. Database Schema (PostgreSQL)

```sql
-- Core Tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    platform_user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(platform, platform_user_id)
);

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    social_account_id UUID REFERENCES social_accounts(id),
    content TEXT NOT NULL,
    media_urls TEXT[],
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft',
    platform_post_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE analytics_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    social_account_id UUID REFERENCES social_accounts(id),
    post_id UUID REFERENCES posts(id),
    metric_type VARCHAR(50) NOT NULL,
    metric_value BIGINT NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Caching Strategy (Redis)

```python
# Redis key patterns
user_sessions = "session:{user_id}"
social_tokens = "tokens:{platform}:{user_id}"
analytics_cache = "analytics:{account_id}:{date_range}"
rate_limits = "rate_limit:{user_id}:{endpoint}"
background_jobs = "job:{job_id}"
```

### 5. Background Workers

```python
# Celery tasks for async operations
@celery.task
def sync_social_media_data(account_id: str):
    """Sync data from social media platform"""
    pass

@celery.task
def generate_ai_insights(user_id: str):
    """Generate AI-powered insights"""
    pass

@celery.task
def send_scheduled_post(post_id: str):
    """Publish scheduled posts"""
    pass

@celery.task
def cleanup_expired_tokens():
    """Clean up expired OAuth tokens"""
    pass
```

## Security Architecture

### 1. Authentication Flow
```
1. User login → JWT access token + refresh token
2. Access token (15 min expiry) stored in httpOnly cookie
3. Refresh token (7 days expiry) stored in secure httpOnly cookie
4. Automatic token refresh on expiry
```

### 2. OAuth2 Integration Security
```python
# OAuth2 security measures
class OAuth2Config:
    def __init__(self):
        self.use_pkce = True  # Proof Key for Code Exchange
        self.state_validation = True  # CSRF protection
        self.token_encryption = True  # Encrypt stored tokens
        self.scope_validation = True  # Validate requested scopes
```

### 3. API Security Layers
```python
# Security middleware stack
security_middleware = [
    CORSMiddleware,
    TrustedHostMiddleware,
    HTTPSRedirectMiddleware,
    SessionMiddleware,
    RateLimitMiddleware,
    AuthenticationMiddleware,
    ValidationMiddleware,
]
```

## Data Flow Architecture

### 1. Real-time Data Flow
```
Social Media APIs → Background Workers → Database → Cache → WebSocket → Frontend
```

### 2. Request/Response Flow
```
Frontend → API Gateway → Authentication → Business Logic → Database → Response
```

### 3. Analytics Pipeline
```
Raw Data → Data Processing → Aggregation → AI Analysis → Insights → Dashboard
```

## Performance Considerations

### 1. Caching Strategy
- **L1 Cache**: Frontend component state
- **L2 Cache**: API response caching (Redis)
- **L3 Cache**: Database query caching
- **CDN**: Static assets and images

### 2. Database Optimization
- Proper indexing on frequently queried columns
- Connection pooling
- Read replicas for analytics queries
- Partitioning for large tables

### 3. API Optimization
- Response compression
- Pagination for large datasets
- Field selection (GraphQL-style)
- Background job processing

## Scalability Architecture

### 1. Horizontal Scaling Points
- Multiple API server instances
- Database read replicas
- Redis cluster
- Background worker scaling

### 2. Monitoring & Observability
- Application performance monitoring (APM)
- Database query monitoring
- API response time tracking
- Error rate monitoring
- Resource utilization alerts

## Deployment Architecture

### 1. Development Environment
```
Docker Compose:
- Frontend (Next.js dev server)
- Backend (FastAPI with auto-reload)
- PostgreSQL
- Redis
- Celery worker
```

### 2. Production Environment
```
Kubernetes/Docker:
- Load balancer
- Multiple API instances
- Database with backups
- Redis cluster
- Worker nodes
- Monitoring stack
```

## Error Handling & Recovery

### 1. Application Level
- Graceful degradation
- Circuit breaker pattern
- Retry mechanisms with exponential backoff
- Dead letter queues for failed jobs

### 2. Infrastructure Level
- Database failover
- Cache failure handling
- API rate limit recovery
- Background job recovery

This architecture ensures the SM3D platform is secure, scalable, and maintainable while providing excellent user experience and performance.