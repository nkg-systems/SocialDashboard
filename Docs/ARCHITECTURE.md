# SM3D System Architecture

## Overview
This document outlines the comprehensive system architecture for the Social Media Monitoring & Management Dashboard (SM3D), focusing on scalability, security, and maintainability.

## Current Implementation Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   FastAPI       │    │   Services      │
│   (Next.js 14)  │◄──►│   REST API      │◄──►│   OAuth2 &      │
│   TypeScript    │    │   + OpenAPI     │    │   Social Media  │
│   Tailwind CSS  │    │   Documentation │    │   Integration   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Component     │    │   JWT Auth      │    │   PostgreSQL    │
│   Library       │    │   + Middleware  │    │   Database      │
│   (In Progress) │    │   Security      │    │   + Models      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Redis Cache   │    │   Analytics     │
                       │   + Sessions    │    │   Engine        │
                       │   + Rate Limit  │    │   Time Series   │
                       └─────────────────┘    └─────────────────┘
                                │                       │
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Background    │    │   Encrypted     │
                       │   Workers       │    │   Token         │
                       │   (Ready)       │    │   Storage       │
                       └─────────────────┘    └─────────────────┘
```

## Component Architecture

### 1. Frontend Layer (Next.js 14) - ✅ 80% Complete
```typescript
// Current Implementation Structure
frontend/src/
├── components/             # React Components (In Progress)
│   ├── ui/                # Base UI Components
│   └── dashboard/         # Dashboard-specific Components
├── pages/                 # Next.js Pages (Planned)
│   ├── dashboard/         # Dashboard pages
│   ├── analytics/         # Analytics pages
│   ├── posts/            # Post management
│   └── settings/         # Settings & integrations
├── lib/                  # ✅ Utilities & Services
│   └── api.ts            # ✅ Complete API client with auth
├── types/                # ✅ TypeScript Definitions
│   └── index.ts          # ✅ Comprehensive type system
├── hooks/                # Custom React Hooks (Planned)
│   ├── useAuth.ts        # Authentication hooks
│   ├── useAnalytics.ts   # Analytics data hooks
│   └── usePosts.ts       # Post management hooks
└── styles/               # ✅ Styling System
    └── globals.css       # Global styles with SM3D theme

// Configuration Files (✅ Complete)
├── next.config.js        # ✅ Next.js configuration
├── tailwind.config.js    # ✅ SM3D design system
├── tsconfig.json         # ✅ TypeScript configuration
└── package.json          # ✅ Dependencies
```

**Security Features:**
- Content Security Policy (CSP)
- XSS protection through React's built-in sanitization
- Secure HTTP headers
- Input validation on client side
- Secure token storage (httpOnly cookies)

### 2. Backend Layer (FastAPI) - ✅ 100% Complete

```python
# Current Implementation (✅ Fully Implemented)
backend/
├── app/
│   ├── api/                    # ✅ API Layer
│   │   ├── v1/
│   │   │   ├── endpoints/      # ✅ Route Handlers
│   │   │   │   ├── auth.py     # ✅ Authentication endpoints
│   │   │   │   ├── social.py   # ✅ Social media OAuth & management
│   │   │   │   ├── analytics.py # ✅ Analytics & metrics
│   │   │   │   ├── posts.py    # ✅ Post management & publishing
│   │   │   │   └── users.py    # ✅ User management
│   │   │   └── api.py         # ✅ Router configuration
│   │   └── deps.py            # ✅ Dependency injection
│   ├── core/                   # ✅ Core Infrastructure
│   │   ├── config.py          # ✅ Settings & environment
│   │   ├── security.py        # ✅ JWT, OAuth2, encryption
│   │   └── database.py        # ✅ SQLAlchemy setup
│   ├── models/                 # ✅ Database Models
│   │   ├── user.py            # ✅ User model with relationships
│   │   ├── social_account.py  # ✅ Social accounts with encryption
│   │   ├── post.py            # ✅ Post model with analytics
│   │   └── analytics.py       # ✅ Time-series analytics data
│   ├── services/               # ✅ Business Logic
│   │   ├── oauth_service.py   # ✅ OAuth2 with PKCE implementation
│   │   └── social_service.py  # ✅ Social media API integrations
│   └── main.py                # ✅ FastAPI application setup
├── tests/                      # Test infrastructure (Ready)
├── migrations/                 # ✅ Database migrations (Alembic)
├── requirements.txt           # ✅ Python dependencies
├── alembic.ini               # ✅ Migration configuration
└── .env.example              # ✅ Environment template
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