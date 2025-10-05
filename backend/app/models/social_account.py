"""
Social account database model.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class SocialAccount(Base):
    __tablename__ = "social_accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    platform = Column(String(50), nullable=False)  # twitter, instagram, facebook, etc.
    platform_user_id = Column(String(255), nullable=False)
    username = Column(String(255), nullable=True)
    display_name = Column(String(255), nullable=True)
    profile_image_url = Column(String(500), nullable=True)
    access_token = Column(Text, nullable=True)  # Encrypted
    refresh_token = Column(Text, nullable=True)  # Encrypted
    token_expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    last_sync_at = Column(DateTime, nullable=True)
    sync_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="social_accounts")
    posts = relationship("Post", back_populates="social_account")
    analytics = relationship("AnalyticsData", back_populates="social_account")
    
    def __repr__(self):
        return f"<SocialAccount({self.platform}:{self.username})>"