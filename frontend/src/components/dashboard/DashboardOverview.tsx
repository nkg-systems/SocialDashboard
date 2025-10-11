'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useDashboardMetrics, usePlatformMetrics, useRecentActivity } from '@/hooks/useDashboardData';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { ContentLibraryWidget } from '@/components/content-library/ContentLibraryWidget';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon
}) => {
  const changeColorClass = {
    positive: 'text-success',
    negative: 'text-error',
    neutral: 'text-text-muted'
  }[changeType];

  const changeIcon = {
    positive: '↗️',
    negative: '↘️',
    neutral: '➡️'
  }[changeType];

  return (
    <Card hover className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-muted text-sm font-medium">{title}</p>
          <div className="mt-2">
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            <p className={`text-sm mt-1 ${changeColorClass}`}>
              {changeIcon} {change}
            </p>
          </div>
        </div>
        <div className="text-accent/70">
          {icon}
        </div>
      </div>
    </Card>
  );
};

interface SocialAccountCardProps {
  platform: string;
  username: string;
  followers: number;
  status: 'connected' | 'error' | 'disconnected' | 'syncing';
  icon: React.ReactNode;
  brandColor: string;
}

const SocialAccountCard: React.FC<SocialAccountCardProps> = ({
  platform,
  username,
  followers,
  status,
  icon,
  brandColor
}) => {
  const statusColors = {
    connected: 'bg-success',
    error: 'bg-error',
    disconnected: 'bg-text-muted',
    syncing: 'bg-accent'
  };

  const statusText = {
    connected: 'Connected',
    error: 'Error',
    disconnected: 'Not Connected',
    syncing: 'Syncing'
  };

  return (
    <Card hover className="animate-slide-up">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0" style={{ color: brandColor }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-primary truncate">
              {platform}
            </p>
            <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
          </div>
          <p className="text-sm text-text-muted truncate">
            @{username}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {followers.toLocaleString()} followers
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className={`text-xs px-2 py-1 rounded-full ${{ 
            connected: 'bg-success/10 text-success',
            error: 'bg-error/10 text-error',
            disconnected: 'bg-text-muted/10 text-text-muted',
            syncing: 'bg-accent/10 text-accent'
          }[status]}`}>
            {statusText[status]}
          </span>
        </div>
      </div>
    </Card>
  );
};

export const DashboardOverview: React.FC = () => {
  const router = useRouter();
  
  // Fetch real data from API
  const { data: dashboardMetrics, loading: metricsLoading, error: metricsError } = useDashboardMetrics();
  const { data: platformMetrics, loading: platformLoading } = usePlatformMetrics();
  const { data: recentActivity, loading: activityLoading } = useRecentActivity(5);
  const { connectedAccounts, loading: accountsLoading } = useSocialAccounts();

  // Create metrics array from API data with fallback to mock data
  const metrics = dashboardMetrics ? [
    {
      title: 'Total Followers',
      value: dashboardMetrics.total_followers?.toLocaleString() || '0',
      change: dashboardMetrics.recent_growth?.followers 
        ? `${dashboardMetrics.recent_growth.followers > 0 ? '+' : ''}${dashboardMetrics.recent_growth.followers}% from last month`
        : 'No change data',
      changeType: (dashboardMetrics.recent_growth?.followers || 0) >= 0 ? 'positive' as const : 'negative' as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: 'Total Engagement',
      value: dashboardMetrics.total_engagement?.toLocaleString() || '0',
      change: dashboardMetrics.recent_growth?.engagement
        ? `${dashboardMetrics.recent_growth.engagement > 0 ? '+' : ''}${dashboardMetrics.recent_growth.engagement}% from last week`
        : 'No change data',
      changeType: (dashboardMetrics.recent_growth?.engagement || 0) >= 0 ? 'positive' as const : 'negative' as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    },
    {
      title: 'Posts This Month',
      value: dashboardMetrics.total_posts?.toString() || '0',
      change: dashboardMetrics.recent_growth?.posts
        ? `${dashboardMetrics.recent_growth.posts > 0 ? '+' : ''}${dashboardMetrics.recent_growth.posts} from last month`
        : 'No change data',
      changeType: (dashboardMetrics.recent_growth?.posts || 0) >= 0 ? 'positive' as const : 'negative' as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: 'Active Platforms',
      value: dashboardMetrics.active_platforms?.toString() || '0',
      change: `${connectedAccounts.length} connected`,
      changeType: 'neutral' as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    }
  ] : [
    // Fallback mock metrics when API data is not available
    {
      title: 'Total Followers',
      value: '24.8K',
      change: '+12% from last month',
      changeType: 'positive' as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: 'Engagement Rate',
      value: '4.2%',
      change: '+0.8% from last week',
      changeType: 'positive' as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    },
    {
      title: 'Posts This Month',
      value: '47',
      change: '+15 from last month',
      changeType: 'positive' as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 712-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: 'Reach',
      value: '156K',
      change: '-3% from last week',
      changeType: 'negative' as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )
    }
  ];

  // Platform icon mapping
  const getPlatformIcon = (platform: string) => {
    const iconClass = "w-6 h-6";
    switch (platform.toLowerCase()) {
      case 'twitter':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
        );
      case 'instagram':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        );
      case 'linkedin':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        );
      case 'facebook':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'tiktok':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
          </svg>
        );
      case 'youtube':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter': return '#1DA1F2';
      case 'instagram': return '#E4405F';
      case 'linkedin': return '#0A66C2';
      case 'facebook': return '#1877F2';
      case 'tiktok': return '#000000';
      case 'youtube': return '#FF0000';
      default: return '#6366F1';
    }
  };

  // Mock social accounts for fallback
  const mockSocialAccounts = [
    {
      platform: 'Twitter',
      username: 'myhandle',
      followers: 12500,
      status: 'connected' as const,
      brandColor: '#1DA1F2',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      )
    },
    {
      platform: 'Instagram',
      username: 'myhandle',
      followers: 8300,
      status: 'connected' as const,
      brandColor: '#E4405F',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    },
    {
      platform: 'LinkedIn',
      username: 'company',
      followers: 2100,
      status: 'connected' as const,
      brandColor: '#0A66C2',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    },
    {
      platform: 'Facebook',
      username: 'mypage',
      followers: 0,
      status: 'disconnected' as const,
      brandColor: '#1877F2',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sm3d-text-h1">Dashboard Overview</h1>
          <p className="sm3d-text-body mt-1">
            Monitor your social media performance across all platforms
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </Button>
          <Button size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Connect Platform
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }, (_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-border rounded w-24 mb-2"></div>
                  <div className="h-8 bg-border rounded w-16 mb-1"></div>
                  <div className="h-3 bg-border rounded w-32"></div>
                </div>
                <div className="w-8 h-8 bg-border rounded"></div>
              </div>
            </Card>
          ))
        ) : metricsError ? (
          <Card className="col-span-4">
            <div className="text-center py-8">
              <p className="text-error mb-2">Failed to load metrics</p>
              <p className="text-text-muted text-sm">{metricsError}</p>
            </div>
          </Card>
        ) : (
          metrics.map((metric, index) => (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              changeType={metric.changeType}
              icon={metric.icon}
            />
          ))
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Content Library Widget */}
        <ContentLibraryWidget 
          onOpenLibrary={() => router.push('/content-library')}
          showStats={true}
          compact={false}
        />
        
        {/* Social Accounts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Connected Accounts</CardTitle>
              <Button variant="ghost" size="sm">
                Manage
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {accountsLoading ? (
              Array.from({ length: 3 }, (_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-6 h-6 bg-border rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-border rounded w-24 mb-2"></div>
                      <div className="h-3 bg-border rounded w-20 mb-1"></div>
                      <div className="h-3 bg-border rounded w-16"></div>
                    </div>
                    <div className="w-16 h-6 bg-border rounded"></div>
                  </div>
                </Card>
              ))
            ) : connectedAccounts && connectedAccounts.length > 0 ? (
              connectedAccounts.map((account) => (
                <SocialAccountCard
                  key={account.id}
                  platform={account.platformId}
                  username={account.username}
                  followers={account.followers}
                  status={account.status}
                  icon={getPlatformIcon(account.platformId)}
                  brandColor={getPlatformColor(account.platformId)}
                />
              ))
            ) : (
              // Fallback to mock data when no real accounts are available
              mockSocialAccounts.map((account, index) => (
                <SocialAccountCard
                  key={index}
                  platform={account.platform}
                  username={account.username}
                  followers={account.followers}
                  status={account.status}
                  icon={account.icon}
                  brandColor={account.brandColor}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityLoading ? (
              Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex items-center space-x-4 p-3 bg-background rounded-button animate-pulse">
                  <div className="w-8 h-8 bg-border rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-border rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-border rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const getActivityIcon = (type: string) => {
                  switch (type) {
                    case 'post':
                      return (
                        <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      );
                    case 'connect':
                      return (
                        <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      );
                    case 'sync':
                      return (
                        <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      );
                    case 'error':
                      return (
                        <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      );
                    default:
                      return (
                        <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      );
                  }
                };

                return (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 bg-background rounded-button">
                    <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary">
                        {activity.message}
                      </p>
                      <p className="text-xs text-text-muted">
                        {new Date(activity.timestamp).toLocaleString()} 
                        {activity.platform && ` • ${activity.platform}`}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback to mock data or empty state
              [1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center space-x-4 p-3 bg-background rounded-button">
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">
                      Posted "New product launch announcement" to Twitter
                    </p>
                    <p className="text-xs text-text-muted">
                      2 hours ago • 24 likes, 12 retweets
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="secondary" className="h-16 flex-col">
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Post
            </Button>
            <Button variant="secondary" className="h-16 flex-col">
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Schedule Post
            </Button>
            <Button variant="secondary" className="h-16 flex-col">
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Analytics
            </Button>
            <Button variant="secondary" className="h-16 flex-col">
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Connect Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};