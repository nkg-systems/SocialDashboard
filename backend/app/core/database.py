"""
Database configuration and connection management.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import redis
from .config import settings

# SQLAlchemy setup
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=StaticPool if settings.DATABASE_URL.startswith("sqlite") else None,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Redis setup
redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
redis_session = redis.Redis.from_url(
    settings.REDIS_URL.replace("/0", f"/{settings.REDIS_SESSION_DB}"), 
    decode_responses=True
)
redis_cache = redis.Redis.from_url(
    settings.REDIS_URL.replace("/0", f"/{settings.REDIS_CACHE_DB}"), 
    decode_responses=True
)


def get_db():
    """
    Dependency to get database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_redis():
    """
    Dependency to get Redis client.
    """
    return redis_client


def get_redis_session():
    """
    Dependency to get Redis session client.
    """
    return redis_session


def get_redis_cache():
    """
    Dependency to get Redis cache client.
    """
    return redis_cache