"""
Analytics data database model.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, BigInteger, ForeignKey, Float, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class AnalyticsData(Base):
    __tablename__ = "analytics_data"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    social_account_id = Column(UUID(as_uuid=True), ForeignKey("social_accounts.id"), nullable=False)
    post_id = Column(UUID(as_uuid=True), ForeignKey("posts.id"), nullable=True)
    metric_type = Column(String(50), nullable=False)  # followers, likes, shares, comments, etc.
    metric_value = Column(BigInteger, nullable=False)
    metric_change = Column(Float, nullable=True)  # Change from previous period
    metric_percentage_change = Column(Float, nullable=True)  # Percentage change
    recorded_at = Column(DateTime, nullable=False)  # When the metric was recorded
    period_start = Column(DateTime, nullable=True)  # For period-based metrics
    period_end = Column(DateTime, nullable=True)  # For period-based metrics
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    social_account = relationship("SocialAccount", back_populates="analytics")
    post = relationship("Post", back_populates="analytics")
    
    # Indexes for better query performance
    __table_args__ = (
        Index('idx_analytics_account_metric_recorded', 'social_account_id', 'metric_type', 'recorded_at'),
        Index('idx_analytics_post_metric', 'post_id', 'metric_type'),
        Index('idx_analytics_recorded_at', 'recorded_at'),
    )
    
    def __repr__(self):
        return f"<AnalyticsData({self.metric_type}:{self.metric_value})>"