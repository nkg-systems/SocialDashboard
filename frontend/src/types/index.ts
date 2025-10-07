// User types
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_superuser: boolean;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Social Media types
export interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  display_name?: string;
  profile_image_url?: string;
  is_active: boolean;
  last_sync_at?: string;
  sync_enabled: boolean;
  created_at: string;
}

export interface Platform {
  name: string;
  display_name: string;
  icon: string;
}

export interface ConnectResponse {
  auth_url: string;
  state: string;
  platform: string;
}

export interface SocialAccountMetrics {
  platform: string;
  username: string;
  metrics: {
    followers: number;
    following: number;
    posts: number;
    likes: number;
    views?: number;
  };
  last_sync?: string;
}

export interface ConnectedAccount {
  id: string;
  platformId: string;
  username: string;
  displayName: string;
  followers: number;
  profileImageUrl?: string;
  lastSync: string;
  status: 'connected' | 'error' | 'syncing';
  permissions: string[];
}

export interface SocialPlatform {
  id: string;
  name: string;
  description: string;
  brandColor: string;
  icon: React.ReactNode;
  features: string[];
}

// Post types
export interface Post {
  id: string;
  content: string;
  media_urls: string[];
  hashtags: string[];
  mentions: string[];
  scheduled_at?: string;
  published_at?: string;
  status: PostStatus;
  platform_post_id?: string;
  ai_generated: boolean;
  engagement_metrics?: EngagementMetrics;
  social_account_id?: string;
  created_at: string;
  updated_at: string;
}

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'publishing';

export interface PostCreate {
  content: string;
  media_urls?: string[];
  hashtags?: string[];
  mentions?: string[];
  scheduled_at?: string;
  social_account_ids?: string[];
}

export interface PostUpdate {
  content?: string;
  media_urls?: string[];
  hashtags?: string[];
  mentions?: string[];
  scheduled_at?: string;
}

// Analytics types
export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  views?: number;
  clicks?: number;
  saves?: number;
}

export interface DashboardMetrics {
  total_followers: number;
  total_posts: number;
  total_engagement: number;
  active_platforms: number;
  recent_growth: Record<string, number>;
}

export interface PlatformMetrics {
  platform: string;
  followers: number;
  following: number;
  posts: number;
  engagement_rate: number;
  growth_rate: number;
  last_sync?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  change?: number;
}

export interface AnalyticsResponse {
  platform: string;
  metric_type: string;
  current_value: number;
  previous_value: number;
  change: number;
  percentage_change: number;
  time_series: TimeSeriesData[];
}

export interface PostAnalytics {
  post_id: string;
  platform: string;
  content_preview: string;
  published_at?: string;
  metrics: Record<string, {
    value: number;
    change: number;
    recorded_at: string;
  }>;
  engagement_summary: {
    total_likes: number;
    total_comments: number;
    total_shares: number;
    total_views: number;
  };
}

export interface TrendingContent {
  period: string;
  platform: string;
  top_hashtags: Array<{
    hashtag: string;
    usage_count: number;
    avg_engagement: number;
  }>;
  top_posts: Array<{
    id: string;
    content_preview: string;
    platform: string;
    engagement_score: number;
    published_at: string;
  }>;
  total_posts_analyzed: number;
}

// UI Component types
export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: 'default' | 'success' | 'warning' | 'error' | 'info';
  loading?: boolean;
}

export interface ChartData {
  name: string;
  value: number;
  change?: number;
  date?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Hook types
export interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  enabled?: boolean;
}

export interface UsePaginationOptions {
  initialPage?: number;
  initialSize?: number;
}

// Theme types
export type Theme = 'dark' | 'light';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Navigation types
export interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  count?: number;
}

// Form types
export interface FormFieldError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: FormFieldError[];
  loading: boolean;
  success: boolean;
}

// Platform specific types
export interface TwitterMetrics extends EngagementMetrics {
  retweets: number;
  replies: number;
  impressions: number;
}

export interface InstagramMetrics extends EngagementMetrics {
  reach: number;
  story_views?: number;
  profile_visits?: number;
}

export interface FacebookMetrics extends EngagementMetrics {
  reactions: number;
  page_views?: number;
  post_reach: number;
}

export interface LinkedInMetrics extends EngagementMetrics {
  clicks: number;
  impressions: number;
  reactions: number;
}

export interface YouTubeMetrics extends EngagementMetrics {
  subscribers: number;
  watch_time: number;
  average_view_duration: number;
}