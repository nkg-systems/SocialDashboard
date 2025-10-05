"""
Post management endpoints.
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.models.post import Post
from app.models.social_account import SocialAccount
from app.services.social_service import SocialMediaService

router = APIRouter()
social_service = SocialMediaService()


class PostCreate(BaseModel):
    content: str
    media_urls: List[str] = []
    hashtags: List[str] = []
    mentions: List[str] = []
    scheduled_at: Optional[datetime] = None
    social_account_ids: List[str] = []  # Which accounts to post to
    
    @validator('content')
    def validate_content(cls, v):
        if not v or not v.strip():
            raise ValueError('Content cannot be empty')
        if len(v) > 2000:  # General limit, adjust per platform
            raise ValueError('Content too long')
        return v.strip()
    
    @validator('scheduled_at')
    def validate_scheduled_at(cls, v):
        if v and v <= datetime.utcnow():
            raise ValueError('Scheduled time must be in the future')
        return v


class PostUpdate(BaseModel):
    content: Optional[str] = None
    media_urls: Optional[List[str]] = None
    hashtags: Optional[List[str]] = None
    mentions: Optional[List[str]] = None
    scheduled_at: Optional[datetime] = None


class PostResponse(BaseModel):
    id: str
    content: str
    media_urls: List[str]
    hashtags: List[str]
    mentions: List[str]
    scheduled_at: Optional[datetime]
    published_at: Optional[datetime]
    status: str
    platform_post_id: Optional[str]
    ai_generated: bool
    engagement_metrics: Optional[Dict] = None
    social_account_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/", response_model=List[PostResponse])
def get_posts(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
    status: Optional[str] = Query(None, description="Filter by status: draft, scheduled, published, failed"),
    platform: Optional[str] = Query(None, description="Filter by social media platform"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get user's posts with optional filtering."""
    query = db.query(Post).filter(Post.user_id == current_user.id)
    
    if status:
        query = query.filter(Post.status == status)
    
    if platform:
        query = query.join(SocialAccount).filter(SocialAccount.platform == platform)
    
    posts = query.order_by(Post.created_at.desc()).offset(offset).limit(limit).all()
    return posts


@router.get("/{post_id}", response_model=PostResponse)
def get_post(
    post_id: str,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific post."""
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.user_id == current_user.id
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    return post


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_data: PostCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new post."""
    
    # Validate social accounts belong to user
    if post_data.social_account_ids:
        accounts = db.query(SocialAccount).filter(
            SocialAccount.id.in_(post_data.social_account_ids),
            SocialAccount.user_id == current_user.id,
            SocialAccount.is_active == True
        ).all()
        
        if len(accounts) != len(post_data.social_account_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more social accounts not found or inactive"
            )
    
    # Determine initial status
    initial_status = "scheduled" if post_data.scheduled_at else "draft"
    
    # Create the post
    post = Post(
        user_id=current_user.id,
        content=post_data.content,
        media_urls=post_data.media_urls,
        hashtags=post_data.hashtags,
        mentions=post_data.mentions,
        scheduled_at=post_data.scheduled_at,
        status=initial_status,
        ai_generated=False
    )
    
    db.add(post)
    db.commit()
    db.refresh(post)
    
    # If posting immediately and accounts specified, schedule posting
    if not post_data.scheduled_at and post_data.social_account_ids:
        background_tasks.add_task(
            publish_post_to_platforms,
            post.id,
            post_data.social_account_ids,
            db
        )
        post.status = "publishing"
        db.commit()
    
    return post


@router.put("/{post_id}", response_model=PostResponse)
def update_post(
    post_id: str,
    post_update: PostUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Update a post (only if not published)."""
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.user_id == current_user.id
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.status == "published":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update published posts"
        )
    
    # Update fields
    update_data = post_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)
    
    post.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(post)
    
    return post


@router.delete("/{post_id}")
def delete_post(
    post_id: str,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a post (only if not published)."""
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.user_id == current_user.id
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.status == "published":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete published posts"
        )
    
    db.delete(post)
    db.commit()
    
    return {"message": "Post deleted successfully"}


@router.post("/{post_id}/publish")
async def publish_post_now(
    post_id: str,
    social_account_ids: List[str],
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Publish a post immediately to specified social accounts."""
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.user_id == current_user.id
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.status == "published":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post is already published"
        )
    
    # Validate social accounts
    accounts = db.query(SocialAccount).filter(
        SocialAccount.id.in_(social_account_ids),
        SocialAccount.user_id == current_user.id,
        SocialAccount.is_active == True
    ).all()
    
    if len(accounts) != len(social_account_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more social accounts not found or inactive"
        )
    
    # Attempt to publish to each platform
    results = []
    successful_publishes = 0
    
    for account in accounts:
        try:
            result = await social_service.post_content(
                account=account,
                content=post.content,
                media_urls=post.media_urls
            )
            
            # Create a new post record for each platform
            platform_post = Post(
                user_id=current_user.id,
                social_account_id=account.id,
                content=post.content,
                media_urls=post.media_urls,
                hashtags=post.hashtags,
                mentions=post.mentions,
                status="published",
                published_at=datetime.utcnow(),
                platform_post_id=result.get('id') or result.get('post_id'),
                ai_generated=post.ai_generated
            )
            
            db.add(platform_post)
            successful_publishes += 1
            
            results.append({
                "platform": account.platform,
                "success": True,
                "post_id": result.get('id') or result.get('post_id'),
                "message": "Published successfully"
            })
            
        except Exception as e:
            results.append({
                "platform": account.platform,
                "success": False,
                "error": str(e),
                "message": f"Failed to publish to {account.platform}"
            })
    
    # Update original post status
    if successful_publishes > 0:
        post.status = "published"
        post.published_at = datetime.utcnow()
    else:
        post.status = "failed"
        post.error_message = "Failed to publish to any platform"
    
    db.commit()
    
    return {
        "message": f"Published to {successful_publishes}/{len(accounts)} platforms",
        "results": results
    }


@router.get("/{post_id}/analytics")
def get_post_analytics(
    post_id: str,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Get analytics for a specific post."""
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.user_id == current_user.id
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.status != "published":
        return {
            "message": "Analytics only available for published posts",
            "status": post.status
        }
    
    return {
        "post_id": str(post.id),
        "content": post.content[:100] + "..." if len(post.content) > 100 else post.content,
        "published_at": post.published_at,
        "engagement_metrics": post.engagement_metrics or {},
        "platform": post.social_account.platform if post.social_account else None
    }


# Background task for publishing posts
async def publish_post_to_platforms(
    post_id: str, 
    social_account_ids: List[str], 
    db: Session
):
    """Background task to publish a post to multiple platforms."""
    # This would be implemented as a Celery task in production
    pass
