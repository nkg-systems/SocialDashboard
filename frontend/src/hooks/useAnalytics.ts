/**
 * React hooks for analytics data management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient, ApiError } from '@/lib/apiClient';
import { 
  AnalyticsResponse, 
  TimeSeriesData, 
  PostAnalytics, 
  TrendingContent,
  DashboardMetrics,
  PlatformMetrics 
} from '@/types';

interface UseAnalyticsOptions {
  dateRange?: '7d' | '30d' | '90d' | '1y';
  platform?: string;
  metricType?: string;
  refreshInterval?: number; // in milliseconds
}

interface UseAnalyticsReturn {
  data: AnalyticsResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { dateRange = '30d', platform = 'all', metricType = 'engagement', refreshInterval } = options;

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const params = new URLSearchParams({
        date_range: dateRange,
        metric_type: metricType,
      });

      if (platform && platform !== 'all') {
        params.append('platform', platform);
      }

      const response = await apiClient.get<AnalyticsResponse>(
        `/analytics/dashboard?${params.toString()}`
      );

      setData(response);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, platform, metricType]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!refreshInterval || refreshInterval < 30000) return; // Minimum 30 seconds

    const interval = setInterval(fetchAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAnalytics, refreshInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
    lastUpdated,
  };
}

interface UseTimeSeriesDataReturn {
  data: TimeSeriesData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTimeSeriesData(
  platform: string,
  metricType: string,
  dateRange: string = '30d'
): UseTimeSeriesDataReturn {
  const [data, setData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeSeriesData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const params = new URLSearchParams({
        platform,
        metric_type: metricType,
        date_range: dateRange,
      });

      const response = await apiClient.get<{ time_series: TimeSeriesData[] }>(
        `/analytics/time-series?${params.toString()}`
      );

      setData(response.time_series || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch time series data';
      setError(errorMessage);
      console.error('Time series data error:', err);
    } finally {
      setLoading(false);
    }
  }, [platform, metricType, dateRange]);

  useEffect(() => {
    fetchTimeSeriesData();
  }, [fetchTimeSeriesData]);

  return {
    data,
    loading,
    error,
    refetch: fetchTimeSeriesData,
  };
}

interface UsePlatformAnalyticsReturn {
  data: PlatformMetrics[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePlatformAnalytics(dateRange: string = '30d'): UsePlatformAnalyticsReturn {
  const [data, setData] = useState<PlatformMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlatformAnalytics = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const params = new URLSearchParams({ date_range: dateRange });
      const response = await apiClient.get<{ platforms: PlatformMetrics[] }>(
        `/analytics/platforms?${params.toString()}`
      );

      setData(response.platforms || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch platform analytics';
      setError(errorMessage);
      console.error('Platform analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchPlatformAnalytics();
  }, [fetchPlatformAnalytics]);

  return {
    data,
    loading,
    error,
    refetch: fetchPlatformAnalytics,
  };
}

interface UsePostAnalyticsReturn {
  data: PostAnalytics[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePostAnalytics(
  limit: number = 10,
  dateRange: string = '30d',
  platform?: string
): UsePostAnalyticsReturn {
  const [data, setData] = useState<PostAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPostAnalytics = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const params = new URLSearchParams({
        limit: limit.toString(),
        date_range: dateRange,
      });

      if (platform && platform !== 'all') {
        params.append('platform', platform);
      }

      const response = await apiClient.get<{ posts: PostAnalytics[] }>(
        `/analytics/posts?${params.toString()}`
      );

      setData(response.posts || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch post analytics';
      setError(errorMessage);
      console.error('Post analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, dateRange, platform]);

  useEffect(() => {
    fetchPostAnalytics();
  }, [fetchPostAnalytics]);

  return {
    data,
    loading,
    error,
    refetch: fetchPostAnalytics,
  };
}

interface UseTrendingContentReturn {
  data: TrendingContent | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTrendingContent(
  period: string = '7d',
  platform?: string
): UseTrendingContentReturn {
  const [data, setData] = useState<TrendingContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrendingContent = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const params = new URLSearchParams({ period });

      if (platform && platform !== 'all') {
        params.append('platform', platform);
      }

      const response = await apiClient.get<TrendingContent>(
        `/analytics/trending?${params.toString()}`
      );

      setData(response);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch trending content';
      setError(errorMessage);
      console.error('Trending content error:', err);
    } finally {
      setLoading(false);
    }
  }, [period, platform]);

  useEffect(() => {
    fetchTrendingContent();
  }, [fetchTrendingContent]);

  return {
    data,
    loading,
    error,
    refetch: fetchTrendingContent,
  };
}

interface UseEngagementRatesReturn {
  data: Array<{ platform: string; rate: number; change: number }>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEngagementRates(dateRange: string = '30d'): UseEngagementRatesReturn {
  const [data, setData] = useState<Array<{ platform: string; rate: number; change: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEngagementRates = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const params = new URLSearchParams({ date_range: dateRange });
      const response = await apiClient.get<{ engagement_rates: Array<{ platform: string; rate: number; change: number }> }>(
        `/analytics/engagement-rates?${params.toString()}`
      );

      setData(response.engagement_rates || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch engagement rates';
      setError(errorMessage);
      console.error('Engagement rates error:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchEngagementRates();
  }, [fetchEngagementRates]);

  return {
    data,
    loading,
    error,
    refetch: fetchEngagementRates,
  };
}

// Utility hook for formatted analytics data
export function useFormattedAnalytics(
  platform?: string,
  dateRange: string = '30d'
) {
  const { data: platformData, loading: platformLoading } = usePlatformAnalytics(dateRange);
  const { data: timeSeriesData, loading: timeSeriesLoading } = useTimeSeriesData(
    platform || 'all',
    'followers',
    dateRange
  );
  const { data: engagementData, loading: engagementLoading } = useEngagementRates(dateRange);

  const chartData = useMemo(() => {
    if (!timeSeriesData.length) return [];

    return timeSeriesData.map(item => ({
      date: item.date,
      value: item.value,
      change: item.change || 0,
    }));
  }, [timeSeriesData]);

  const platformChartData = useMemo(() => {
    if (!platformData.length) return [];

    return platformData.map(platform => ({
      name: platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1),
      followers: platform.followers,
      engagement: platform.engagement_rate,
      posts: platform.posts,
    }));
  }, [platformData]);

  const engagementChartData = useMemo(() => {
    if (!engagementData.length) return [];

    return engagementData.map(item => ({
      name: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
      value: item.rate,
      change: item.change,
    }));
  }, [engagementData]);

  const loading = platformLoading || timeSeriesLoading || engagementLoading;

  return {
    chartData,
    platformChartData,
    engagementChartData,
    loading,
  };
}