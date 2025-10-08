'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import {
  LineChartComponent,
  AreaChartComponent,
  BarChartComponent,
  PieChartComponent,
  MetricCard
} from './Charts';
import {
  useAnalytics,
  useFormattedAnalytics,
  usePlatformAnalytics,
  usePostAnalytics,
  useTrendingContent,
  useEngagementRates
} from '@/hooks/useAnalytics';

type DateRange = '7d' | '30d' | '90d' | '1y';
type Platform = 'all' | 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube';

interface AnalyticsFilters {
  dateRange: DateRange;
  platform: Platform;
  metricType: 'followers' | 'engagement' | 'reach' | 'impressions';
}

export const AnalyticsPage: React.FC = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: '30d',
    platform: 'all',
    metricType: 'engagement'
  });

  const [refreshing, setRefreshing] = useState(false);

  // Fetch analytics data
  const {
    chartData,
    platformChartData,
    engagementChartData,
    loading: formatLoading
  } = useFormattedAnalytics(filters.platform === 'all' ? undefined : filters.platform, filters.dateRange);

  const {
    data: platformData,
    loading: platformLoading,
    refetch: refetchPlatforms
  } = usePlatformAnalytics(filters.dateRange);

  const {
    data: postAnalytics,
    loading: postLoading,
    refetch: refetchPosts
  } = usePostAnalytics(10, filters.dateRange, filters.platform === 'all' ? undefined : filters.platform);

  const {
    data: trendingData,
    loading: trendingLoading,
    refetch: refetchTrending
  } = useTrendingContent('7d', filters.platform === 'all' ? undefined : filters.platform);

  const {
    data: engagementRates,
    loading: engagementLoading,
    refetch: refetchEngagement
  } = useEngagementRates(filters.dateRange);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof AnalyticsFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Refresh all data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchPlatforms(),
        refetchPosts(),
        refetchTrending(),
        refetchEngagement()
      ]);
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchPlatforms, refetchPosts, refetchTrending, refetchEngagement]);

  // Calculate aggregate metrics
  const totalFollowers = platformData.reduce((sum, platform) => sum + platform.followers, 0);
  const totalPosts = platformData.reduce((sum, platform) => sum + platform.posts, 0);
  const averageEngagement = platformData.length > 0 
    ? platformData.reduce((sum, platform) => sum + platform.engagement_rate, 0) / platformData.length
    : 0;

  const isLoading = formatLoading || platformLoading || postLoading || trendingLoading || engagementLoading;

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="sm3d-text-h1">Analytics Dashboard</h1>
            <p className="sm3d-text-body mt-1">
              Track your social media performance and engagement metrics
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="secondary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value as DateRange)}
                className="sm3d-input w-full"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Platform
              </label>
              <select
                value={filters.platform}
                onChange={(e) => handleFilterChange('platform', e.target.value as Platform)}
                className="sm3d-input w-full"
              >
                <option value="all">All Platforms</option>
                <option value="twitter">Twitter</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Metric Type
              </label>
              <select
                value={filters.metricType}
                onChange={(e) => handleFilterChange('metricType', e.target.value as AnalyticsFilters['metricType'])}
                className="sm3d-input w-full"
              >
                <option value="engagement">Engagement</option>
                <option value="followers">Followers</option>
                <option value="reach">Reach</option>
                <option value="impressions">Impressions</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => setFilters({ dateRange: '30d', platform: 'all', metricType: 'engagement' })}
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Followers"
            value={totalFollowers}
            change={platformData.length > 0 ? platformData[0].growth_rate : undefined}
            changeLabel="vs last period"
            color="info"
            loading={isLoading}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />

          <MetricCard
            title="Total Posts"
            value={totalPosts}
            color="success"
            loading={isLoading}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />

          <MetricCard
            title="Avg. Engagement Rate"
            value={`${averageEngagement.toFixed(1)}%`}
            color="warning"
            loading={isLoading}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
          />

          <MetricCard
            title="Active Platforms"
            value={platformData.length}
            color="default"
            loading={isLoading}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            }
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Follower Growth Trend */}
          <LineChartComponent
            data={chartData}
            xKey="date"
            yKeys={['value']}
            title="Follower Growth Over Time"
            height={350}
            formatter={(value) => value.toLocaleString()}
          />

          {/* Engagement by Platform */}
          <BarChartComponent
            data={engagementChartData}
            xKey="name"
            yKeys={['value']}
            title="Engagement Rate by Platform"
            height={350}
            formatter={(value) => `${value.toFixed(1)}%`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Platform Distribution */}
          <div className="lg:col-span-2">
            <AreaChartComponent
              data={platformChartData}
              xKey="name"
              yKeys={['followers', 'posts']}
              title="Platform Performance Comparison"
              height={400}
              colors={['#E50914', '#10B981']}
              formatter={(value, name) => 
                name === 'followers' ? value.toLocaleString() : `${value} posts`
              }
            />
          </div>

          {/* Top Performing Content */}
          <Card>
            <h3 className="sm3d-text-h2 mb-4">Top Performing Posts</h3>
            <div className="space-y-4">
              {postLoading ? (
                Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-border rounded w-full mb-2"></div>
                    <div className="h-3 bg-border rounded w-3/4"></div>
                  </div>
                ))
              ) : postAnalytics.length > 0 ? (
                postAnalytics.slice(0, 5).map((post, index) => (
                  <div key={post.post_id} className="border-b border-border pb-3 last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {post.content_preview}
                        </p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-text-muted">
                          <span>❤️ {post.engagement_summary.total_likes}</span>
                          <span>💬 {post.engagement_summary.total_comments}</span>
                          <span>🔄 {post.engagement_summary.total_shares}</span>
                        </div>
                      </div>
                      <span className="text-xs text-accent font-medium">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-text-muted text-sm text-center py-4">
                  No post analytics available
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Trending Hashtags */}
        {trendingData && trendingData.top_hashtags.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="sm3d-text-h2 mb-4">Trending Hashtags</h3>
              <div className="space-y-3">
                {trendingData.top_hashtags.slice(0, 10).map((hashtag, index) => (
                  <div key={hashtag.hashtag} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-accent font-medium">#{hashtag.hashtag}</span>
                      <span className="text-xs text-text-muted">
                        {hashtag.usage_count} uses
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-primary">
                        {hashtag.avg_engagement.toFixed(1)} avg engagement
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="sm3d-text-h2 mb-4">Platform Distribution</h3>
              <PieChartComponent
                data={platformChartData.map(platform => ({
                  name: platform.name,
                  value: platform.followers
                }))}
                height={300}
                formatter={(value) => value.toLocaleString()}
              />
            </Card>
          </div>
        )}

        {/* Data Export */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="sm3d-text-h2 mb-2">Export Analytics Data</h3>
              <p className="text-text-secondary text-sm">
                Download your analytics data for external analysis
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary" size="sm">
                Export CSV
              </Button>
              <Button variant="secondary" size="sm">
                Export PDF Report
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </ErrorBoundary>
  );
};