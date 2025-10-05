"""
Post database model.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, JSON, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from app.core.database import Base


class Post(Base):
    __tablename__ = "posts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    social_account_id = Column(UUID(as_uuid=True), ForeignKey("social_accounts.id"), nullable=True)
    content = Column(Text, nullable=False)
    media_urls = Column(ARRAY(String), nullable=True, default=[])
    hashtags = Column(ARRAY(String), nullable=True, default=[])
    mentions = Column(ARRAY(String), nullable=True, default=[])
    scheduled_at = Column(DateTime, nullable=True)
    published_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="draft")  # draft, scheduled, published, failed
    platform_post_id = Column(String(255), nullable=True)
    ai_generated = Column(Boolean, default=False)
    ai_suggestions = Column(JSON, nullable=True)  # Store AI suggestions
    engagement_metrics = Column(JSON, nullable=True)  # Store engagement data
    error_message = Column(Text, nullable=True)  # Error details if posting failed
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="posts")
    social_account = relationship("SocialAccount", back_populates="posts")
    analytics = relationship("AnalyticsData", back_populates="post")
    
    def __repr__(self):
        return f"<Post({self.id}:{self.status})>"