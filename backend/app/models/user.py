"""
User database model.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.db_utils import GUID


class User(Base):
    __tablename__ = "users"
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    social_accounts = relationship("SocialAccount", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    
    @property
    def full_name(self) -> str:
        """Return the full name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.email