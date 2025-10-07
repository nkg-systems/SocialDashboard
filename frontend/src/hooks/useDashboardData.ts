/**
 * React hooks for dashboard data and analytics
 */

import { useState, useEffect, useCallback } from 'react';
import { DashboardMetrics, PlatformMetrics, TimeSeriesData, AnalyticsResponse } from '@/types';
import { apiClient, ApiError } from '@/lib/apiClient';

interface UseDashboardMetricsReturn {
  data: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardMetrics(): UseDashboardMetricsReturn {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const metrics = await apiClient.get<DashboardMetrics>('/analytics/dashboard');
      setData(metrics);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch dashboard metrics';
      setError(errorMessage);
      console.error('Dashboard metrics error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    data,
    loading,
    error,
    refetch: fetchMetrics,
  };
}

interface UsePlatformMetricsReturn {
  data: PlatformMetrics[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePlatformMetrics(): UsePlatformMetricsReturn {
  const [data, setData] = useState<PlatformMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const metrics = await apiClient.get<{ platforms: PlatformMetrics[] }>('/analytics/platforms');
      setData(metrics.platforms || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch platform metrics';
      setError(errorMessage);
      console.error('Platform metrics error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    data,
    loading,
    error,
    refetch: fetchMetrics,
  };
}

interface UseAnalyticsTimeSeriesOptions {
  platform?: string;
  metric: string;
  timeRange: '7d' | '30d' | '90d' | '1y';
}

interface UseAnalyticsTimeSeriesReturn {
  data: TimeSeriesData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAnalyticsTimeSeries(
  options: UseAnalyticsTimeSeriesOptions
): UseAnalyticsTimeSeriesReturn {
  const [data, setData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { platform, metric, timeRange } = options;

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      const params = new URLSearchParams({
        metric,
        time_range: timeRange,
      });
      
      if (platform) {
        params.append('platform', platform);
      }

      const response = await apiClient.get<AnalyticsResponse>(
        `/analytics/time-series?${params.toString()}`
      );
      
      setData(response.time_series || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch analytics data';
      setError(errorMessage);
      console.error('Analytics time series error:', err);
    } finally {
      setLoading(false);
    }
  }, [platform, metric, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

interface UseRecentActivityReturn {
  data: Array<{
    id: string;
    type: 'post' | 'connect' | 'sync' | 'error';
    message: string;
    timestamp: string;
    platform?: string;
    details?: any;
  }>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRecentActivity(limit: number = 10): UseRecentActivityReturn {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await apiClient.get<{ activities: any[] }>(
        `/analytics/activity?limit=${limit}`
      );
      
      setData(response.activities || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch recent activity';
      setError(errorMessage);
      console.error('Recent activity error:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return {
    data,
    loading,
    error,
    refetch: fetchActivity,
  };
}

// Hook for checking if user is authenticated
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const userData = await apiClient.get('/auth/me');
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      
      // Try to refresh token if it's a 401
      if (err instanceof ApiError && err.status === 401) {
        try {
          await apiClient.refreshToken();
          // Try again after refresh
          const userData = await apiClient.get('/auth/me');
          setUser(userData);
          setIsAuthenticated(true);
        } catch {
          // Refresh failed, user is not authenticated
          setIsAuthenticated(false);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await apiClient.post('/auth/login', { email, password });
      await checkAuth(); // Refresh user data after login
      return true;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    checkAuth,
  };
}