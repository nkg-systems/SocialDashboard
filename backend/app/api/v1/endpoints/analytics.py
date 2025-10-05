"""
Analytics endpoints.
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from pydantic import BaseModel

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.models.social_account import SocialAccount
from app.models.analytics import AnalyticsData
from app.models.post import Post

router = APIRouter()


class DashboardMetrics(BaseModel):
    total_followers: int
    total_posts: int
    total_engagement: int
    active_platforms: int
    recent_growth: Dict[str, float]  # percentage changes


class PlatformMetrics(BaseModel):
    platform: str
    followers: int
    following: int
    posts: int
    engagement_rate: float
    growth_rate: float
    last_sync: Optional[datetime]


class TimeSeriesData(BaseModel):
    date: datetime
    value: int
    change: Optional[float] = None


class AnalyticsResponse(BaseModel):
    platform: str
    metric_type: str
    current_value: int
    previous_value: int
    change: float
    percentage_change: float
    time_series: List[TimeSeriesData]


@router.get("/dashboard", response_model=DashboardMetrics)
def get_dashboard_analytics(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze")
):
    """Get comprehensive dashboard analytics."""
    
    # Get all active social accounts for the user
    social_accounts = db.query(SocialAccount).filter(
        SocialAccount.user_id == current_user.id,
        SocialAccount.is_active == True
    ).all()
    
    if not social_accounts:
        return DashboardMetrics(
            total_followers=0,
            total_posts=0,
            total_engagement=0,
            active_platforms=0,
            recent_growth={}
        )
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get latest metrics for each account
    total_followers = 0
    total_posts = 0
    total_engagement = 0
    recent_growth = {}
    
    for account in social_accounts:
        # Get latest follower count
        latest_followers = db.query(AnalyticsData).filter(
            AnalyticsData.social_account_id == account.id,
            AnalyticsData.metric_type == "followers"
        ).order_by(AnalyticsData.recorded_at.desc()).first()
        
        if latest_followers:
            total_followers += latest_followers.metric_value
            
            # Calculate growth rate
            if latest_followers.metric_percentage_change:
                recent_growth[account.platform] = latest_followers.metric_percentage_change
        
        # Get latest post count
        latest_posts = db.query(AnalyticsData).filter(
            AnalyticsData.social_account_id == account.id,
            AnalyticsData.metric_type == "posts"
        ).order_by(AnalyticsData.recorded_at.desc()).first()
        
        if latest_posts:
            total_posts += latest_posts.metric_value
        
        # Calculate engagement (likes + comments + shares)
        engagement_metrics = db.query(func.sum(AnalyticsData.metric_value)).filter(
            AnalyticsData.social_account_id == account.id,
            AnalyticsData.metric_type.in_(["likes", "comments", "shares"]),
            AnalyticsData.recorded_at >= start_date
        ).scalar() or 0
        
        total_engagement += engagement_metrics
    
    return DashboardMetrics(
        total_followers=total_followers,
        total_posts=total_posts,
        total_engagement=total_engagement,
        active_platforms=len(social_accounts),
        recent_growth=recent_growth
    )


@router.get("/platforms", response_model=List[PlatformMetrics])
def get_platform_analytics(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Get analytics for all connected platforms."""
    
    social_accounts = db.query(SocialAccount).filter(
        SocialAccount.user_id == current_user.id,
        SocialAccount.is_active == True
    ).all()
    
    platform_metrics = []
    
    for account in social_accounts:
        # Get latest metrics
        latest_metrics = {}
        for metric_type in ["followers", "following", "posts", "likes"]:
            metric = db.query(AnalyticsData).filter(
                AnalyticsData.social_account_id == account.id,
                AnalyticsData.metric_type == metric_type
            ).order_by(AnalyticsData.recorded_at.desc()).first()
            
            if metric:
                latest_metrics[metric_type] = {
                    "value": metric.metric_value,
                    "change": metric.metric_percentage_change or 0.0
                }
        
        # Calculate engagement rate
        followers = latest_metrics.get("followers", {}).get("value", 1)
        likes = latest_metrics.get("likes", {}).get("value", 0)
        engagement_rate = (likes / followers * 100) if followers > 0 else 0.0
        
        # Get overall growth rate (average of all metrics)
        growth_rates = [m.get("change", 0) for m in latest_metrics.values()]
        avg_growth = sum(growth_rates) / len(growth_rates) if growth_rates else 0.0
        
        platform_metrics.append(PlatformMetrics(
            platform=account.platform,
            followers=latest_metrics.get("followers", {}).get("value", 0),
            following=latest_metrics.get("following", {}).get("value", 0),
            posts=latest_metrics.get("posts", {}).get("value", 0),
            engagement_rate=round(engagement_rate, 2),
            growth_rate=round(avg_growth, 2),
            last_sync=account.last_sync_at
        ))
    
    return platform_metrics


@router.get("/metrics/{platform}", response_model=List[AnalyticsResponse])
def get_platform_metrics(
    platform: str,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
    days: int = Query(30, ge=1, le=365),
    metrics: str = Query("followers,posts,likes", description="Comma-separated list of metrics")
):
    """Get detailed metrics for a specific platform."""
    
    # Find the social account
    account = db.query(SocialAccount).filter(
        SocialAccount.user_id == current_user.id,
        SocialAccount.platform == platform,
        SocialAccount.is_active == True
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active {platform} account found"
        )
    
    # Parse requested metrics
    requested_metrics = [m.strip() for m in metrics.split(",")]
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    analytics_responses = []
    
    for metric_type in requested_metrics:
        # Get time series data
        time_series_data = db.query(AnalyticsData).filter(
            AnalyticsData.social_account_id == account.id,
            AnalyticsData.metric_type == metric_type,
            AnalyticsData.recorded_at >= start_date
        ).order_by(AnalyticsData.recorded_at.asc()).all()
        
        if not time_series_data:
            continue
        
        # Get current and previous values
        current_value = time_series_data[-1].metric_value
        previous_value = time_series_data[0].metric_value if len(time_series_data) > 1 else current_value
        
        change = current_value - previous_value
        percentage_change = (change / previous_value * 100) if previous_value > 0 else 0.0
        
        # Build time series
        time_series = [
            TimeSeriesData(
                date=data.recorded_at,
                value=data.metric_value,
                change=data.metric_change
            )
            for data in time_series_data
        ]
        
        analytics_responses.append(AnalyticsResponse(
            platform=platform,
            metric_type=metric_type,
            current_value=current_value,
            previous_value=previous_value,
            change=change,
            percentage_change=round(percentage_change, 2),
            time_series=time_series
        ))
    
    return analytics_responses


@router.get("/posts/{post_id}")
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
    
    # Get analytics data for this post
    post_analytics = db.query(AnalyticsData).filter(
        AnalyticsData.post_id == post.id
    ).all()
    
    # Aggregate metrics
    metrics = {}
    for analytic in post_analytics:
        metrics[analytic.metric_type] = {
            "value": analytic.metric_value,
            "change": analytic.metric_change,
            "recorded_at": analytic.recorded_at
        }
    
    return {
        "post_id": str(post.id),
        "platform": post.social_account.platform if post.social_account else "multiple",
        "content_preview": post.content[:100] + "..." if len(post.content) > 100 else post.content,
        "published_at": post.published_at,
        "metrics": metrics,
        "engagement_summary": {
            "total_likes": metrics.get("likes", {}).get("value", 0),
            "total_comments": metrics.get("comments", {}).get("value", 0),
            "total_shares": metrics.get("shares", {}).get("value", 0),
            "total_views": metrics.get("views", {}).get("value", 0),
        }
    }


@router.get("/trends")
def get_trending_content(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
    platform: Optional[str] = Query(None),
    days: int = Query(7, ge=1, le=30)
):
    """Get trending content and hashtags."""
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Build query
    query = db.query(Post).filter(
        Post.user_id == current_user.id,
        Post.status == "published",
        Post.published_at >= start_date
    )
    
    if platform:
        query = query.join(SocialAccount).filter(SocialAccount.platform == platform)
    
    # Get posts with engagement metrics
    posts = query.all()
    
    # Analyze hashtags
    hashtag_performance = {}
    top_posts = []
    
    for post in posts:
        # Calculate engagement score
        engagement_metrics = post.engagement_metrics or {}
        engagement_score = (
            engagement_metrics.get("likes", 0) * 1 +
            engagement_metrics.get("comments", 0) * 2 +
            engagement_metrics.get("shares", 0) * 3
        )
        
        # Track hashtag performance
        for hashtag in post.hashtags or []:
            if hashtag not in hashtag_performance:
                hashtag_performance[hashtag] = {"count": 0, "total_engagement": 0}
            hashtag_performance[hashtag]["count"] += 1
            hashtag_performance[hashtag]["total_engagement"] += engagement_score
        
        # Track top posts
        top_posts.append({
            "id": str(post.id),
            "content_preview": post.content[:100] + "...",
            "platform": post.social_account.platform if post.social_account else "unknown",
            "engagement_score": engagement_score,
            "published_at": post.published_at
        })
    
    # Sort and limit results
    top_hashtags = sorted(
        [
            {
                "hashtag": hashtag,
                "usage_count": data["count"],
                "avg_engagement": data["total_engagement"] / data["count"] if data["count"] > 0 else 0
            }
            for hashtag, data in hashtag_performance.items()
        ],
        key=lambda x: x["avg_engagement"],
        reverse=True
    )[:10]
    
    top_posts = sorted(top_posts, key=lambda x: x["engagement_score"], reverse=True)[:10]
    
    return {
        "period": f"Last {days} days",
        "platform": platform or "all",
        "top_hashtags": top_hashtags,
        "top_posts": top_posts,
        "total_posts_analyzed": len(posts)
    }
