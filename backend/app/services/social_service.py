"""
Social media service for interacting with various platforms.
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import httpx
from sqlalchemy.orm import Session
from app.models.social_account import SocialAccount
from app.models.analytics import AnalyticsData
from app.services.oauth_service import OAuth2Service


class SocialMediaService:
    """
    Service for interacting with social media platforms.
    """
    
    def __init__(self):
        self.oauth_service = OAuth2Service()
    
    async def get_user_profile(self, account: SocialAccount) -> Dict:
        """
        Get user profile information from the social media platform.
        """
        platform = account.platform
        access_token = self.oauth_service.decrypt_token(
            account.access_token, 
            str(account.user_id)
        )
        
        endpoints = {
            "twitter": "https://api.twitter.com/2/users/me",
            "facebook": "https://graph.facebook.com/me?fields=id,name,picture",
            "instagram": "https://graph.instagram.com/me?fields=id,username,account_type",
            "linkedin": "https://api.linkedin.com/v2/me",
            "youtube": "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        }
        
        if platform not in endpoints:
            raise ValueError(f"Unsupported platform: {platform}")
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                endpoints[platform],
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise ValueError(f"Failed to fetch profile: {response.text}")
            
            return response.json()
    
    async def get_account_metrics(self, account: SocialAccount) -> Dict:
        """
        Get basic account metrics (followers, following, posts count).
        """
        platform = account.platform
        access_token = self.oauth_service.decrypt_token(
            account.access_token, 
            str(account.user_id)
        )
        
        if platform == "twitter":
            return await self._get_twitter_metrics(access_token)
        elif platform == "facebook":
            return await self._get_facebook_metrics(access_token)
        elif platform == "instagram":
            return await self._get_instagram_metrics(access_token)
        elif platform == "linkedin":
            return await self._get_linkedin_metrics(access_token)
        elif platform == "youtube":
            return await self._get_youtube_metrics(access_token)
        else:
            raise ValueError(f"Unsupported platform: {platform}")
    
    async def _get_twitter_metrics(self, access_token: str) -> Dict:
        """Get Twitter metrics."""
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            # Get user info with public metrics
            response = await client.get(
                "https://api.twitter.com/2/users/me?user.fields=public_metrics",
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                metrics = data.get("data", {}).get("public_metrics", {})
                return {
                    "followers": metrics.get("followers_count", 0),
                    "following": metrics.get("following_count", 0),
                    "posts": metrics.get("tweet_count", 0),
                    "likes": metrics.get("like_count", 0),
                }
            
            return {"followers": 0, "following": 0, "posts": 0, "likes": 0}
    
    async def _get_facebook_metrics(self, access_token: str) -> Dict:
        """Get Facebook page metrics."""
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            # Get page info
            response = await client.get(
                "https://graph.facebook.com/me?fields=fan_count,followers_count",
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "followers": data.get("fan_count", 0),
                    "following": 0,  # Not applicable for pages
                    "posts": 0,  # Would need separate call
                    "likes": data.get("followers_count", 0),
                }
            
            return {"followers": 0, "following": 0, "posts": 0, "likes": 0}
    
    async def _get_instagram_metrics(self, access_token: str) -> Dict:
        """Get Instagram metrics."""
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            # Get account info
            response = await client.get(
                "https://graph.instagram.com/me?fields=followers_count,follows_count,media_count",
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "followers": data.get("followers_count", 0),
                    "following": data.get("follows_count", 0),
                    "posts": data.get("media_count", 0),
                    "likes": 0,  # Would need separate call to get total likes
                }
            
            return {"followers": 0, "following": 0, "posts": 0, "likes": 0}
    
    async def _get_linkedin_metrics(self, access_token: str) -> Dict:
        """Get LinkedIn metrics."""
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # LinkedIn API is more complex for getting metrics
        # This is a simplified version
        return {"followers": 0, "following": 0, "posts": 0, "likes": 0}
    
    async def _get_youtube_metrics(self, access_token: str) -> Dict:
        """Get YouTube channel metrics."""
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            # Get channel statistics
            response = await client.get(
                "https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true",
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                if items:
                    stats = items[0].get("statistics", {})
                    return {
                        "followers": int(stats.get("subscriberCount", 0)),
                        "following": 0,  # Not applicable
                        "posts": int(stats.get("videoCount", 0)),
                        "likes": 0,  # Total view count instead
                        "views": int(stats.get("viewCount", 0)),
                    }
            
            return {"followers": 0, "following": 0, "posts": 0, "likes": 0, "views": 0}
    
    async def post_content(
        self, 
        account: SocialAccount, 
        content: str, 
        media_urls: List[str] = None
    ) -> Dict:
        """
        Post content to the social media platform.
        """
        platform = account.platform
        access_token = self.oauth_service.decrypt_token(
            account.access_token, 
            str(account.user_id)
        )
        
        if platform == "twitter":
            return await self._post_twitter(access_token, content, media_urls)
        elif platform == "facebook":
            return await self._post_facebook(access_token, content, media_urls)
        elif platform == "instagram":
            return await self._post_instagram(access_token, content, media_urls)
        elif platform == "linkedin":
            return await self._post_linkedin(access_token, content, media_urls)
        elif platform == "youtube":
            # YouTube posting is more complex (video uploads)
            raise NotImplementedError("YouTube posting not implemented yet")
        else:
            raise ValueError(f"Unsupported platform: {platform}")
    
    async def _post_twitter(
        self, 
        access_token: str, 
        content: str, 
        media_urls: List[str] = None
    ) -> Dict:
        """Post to Twitter."""
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        data = {"text": content}
        
        # Handle media uploads if provided
        if media_urls:
            # This would require uploading media first and getting media_ids
            # For now, we'll just post text
            pass
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.twitter.com/2/tweets",
                json=data,
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code not in [200, 201]:
                raise ValueError(f"Twitter post failed: {response.text}")
            
            return response.json()
    
    async def _post_facebook(
        self, 
        access_token: str, 
        content: str, 
        media_urls: List[str] = None
    ) -> Dict:
        """Post to Facebook page."""
        data = {"message": content, "access_token": access_token}
        
        if media_urls:
            # Handle photo/video uploads
            data["url"] = media_urls[0]  # Simplified for single image
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://graph.facebook.com/me/feed",
                data=data,
                timeout=30.0
            )
            
            if response.status_code not in [200, 201]:
                raise ValueError(f"Facebook post failed: {response.text}")
            
            return response.json()
    
    async def _post_instagram(
        self, 
        access_token: str, 
        content: str, 
        media_urls: List[str] = None
    ) -> Dict:
        """Post to Instagram."""
        # Instagram posting is complex and requires media
        if not media_urls:
            raise ValueError("Instagram posts require at least one image or video")
        
        # This is a simplified version - real implementation would be more complex
        raise NotImplementedError("Instagram posting requires media handling")
    
    async def _post_linkedin(
        self, 
        access_token: str, 
        content: str, 
        media_urls: List[str] = None
    ) -> Dict:
        """Post to LinkedIn."""
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        data = {
            "text": {"text": content},
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.linkedin.com/v2/shares",
                json=data,
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code not in [200, 201]:
                raise ValueError(f"LinkedIn post failed: {response.text}")
            
            return response.json()
    
    async def sync_analytics(self, account: SocialAccount, db: Session) -> None:
        """
        Sync analytics data for the account.
        """
        try:
            metrics = await self.get_account_metrics(account)
            now = datetime.utcnow()
            
            # Store metrics in analytics table
            for metric_type, value in metrics.items():
                # Get previous value to calculate change
                prev_metric = db.query(AnalyticsData).filter(
                    AnalyticsData.social_account_id == account.id,
                    AnalyticsData.metric_type == metric_type
                ).order_by(AnalyticsData.recorded_at.desc()).first()
                
                change = 0
                percentage_change = 0.0
                
                if prev_metric:
                    change = value - prev_metric.metric_value
                    if prev_metric.metric_value > 0:
                        percentage_change = (change / prev_metric.metric_value) * 100
                
                # Create new analytics record
                analytics = AnalyticsData(
                    social_account_id=account.id,
                    metric_type=metric_type,
                    metric_value=value,
                    metric_change=change,
                    metric_percentage_change=percentage_change,
                    recorded_at=now
                )
                
                db.add(analytics)
            
            # Update last sync time
            account.last_sync_at = now
            db.commit()
            
        except Exception as e:
            db.rollback()
            raise e