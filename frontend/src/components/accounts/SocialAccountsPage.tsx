'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { PlatformCard } from './PlatformCard';
import AccountManagementModal from './AccountManagementModal';
import useSocialAccounts from '@/hooks/useSocialAccounts';
import { SocialPlatform, ConnectedAccount } from '@/types';

export const SocialAccountsPage: React.FC = () => {
  const [showConnectionGuide, setShowConnectionGuide] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ConnectedAccount | null>(null);
  const [showManagementModal, setShowManagementModal] = useState(false);
  
  // Use the social accounts hook for real data
  const {
    connectedAccounts,
    loading,
    connecting,
    syncing,
    disconnecting,
    connectAccount,
    disconnectAccount,
    syncAccount,
    syncAllAccounts,
    error,
    clearError,
  } = useSocialAccounts();

  // Platform definitions based on your backend OAuth2 implementation
  const platforms: SocialPlatform[] = [
    {
      id: 'twitter',
      name: 'Twitter / X',
      description: 'Connect your Twitter account to share tweets and track engagement',
      brandColor: '#1DA1F2',
      features: [
        'Post tweets with media',
        'Schedule tweets for optimal times',
        'Track engagement metrics',
        'Monitor mentions and replies',
        'Analyze follower growth'
      ],
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      )
    },
    {
      id: 'facebook',
      name: 'Facebook',
      description: 'Connect your Facebook page to manage posts and track audience',
      brandColor: '#1877F2',
      features: [
        'Post to Facebook pages',
        'Schedule content publishing',
        'Track page insights',
        'Monitor comments and reactions',
        'Analyze audience demographics'
      ],
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    {
      id: 'instagram',
      name: 'Instagram',
      description: 'Connect your Instagram business account for visual content management',
      brandColor: '#E4405F',
      features: [
        'Post photos and videos',
        'Manage Instagram Stories',
        'Schedule visual content',
        'Track engagement rates',
        'Monitor hashtag performance'
      ],
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      description: 'Connect your LinkedIn profile or company page for professional networking',
      brandColor: '#0A66C2',
      features: [
        'Share professional updates',
        'Schedule LinkedIn posts',
        'Track professional engagement',
        'Monitor company page metrics',
        'Analyze connection growth'
      ],
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      description: 'Connect your TikTok account for short-form video content',
      brandColor: '#FE2C55',
      features: [
        'Upload TikTok videos',
        'Schedule video publishing',
        'Track video performance',
        'Monitor trending hashtags',
        'Analyze audience engagement'
      ],
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      )
    },
    {
      id: 'youtube',
      name: 'YouTube',
      description: 'Connect your YouTube channel to manage video content',
      brandColor: '#FF0000',
      features: [
        'Upload and schedule videos',
        'Manage video metadata',
        'Track channel analytics',
        'Monitor comments and engagement',
        'Analyze subscriber growth'
      ],
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    }
  ];

  // Handler functions using the hook
  const handleConnect = async (platformId: string) => {
    try {
      await connectAccount(platformId);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this account? You will lose access to posting and analytics for this platform.')) {
      return;
    }

    try {
      await disconnectAccount(accountId);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleManage = (accountId: string) => {
    const account = connectedAccounts.find(acc => acc.id === accountId);
    if (account) {
      setSelectedAccount(account);
      setShowManagementModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowManagementModal(false);
    setSelectedAccount(null);
  };

  const handleSyncAll = async () => {
    try {
      await syncAllAccounts();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const getAccountForPlatform = (platformId: string) => {
    return connectedAccounts.find(account => account.platformId === platformId) || null;
  };

  const connectedCount = connectedAccounts.length;
  const totalPlatforms = platforms.length;

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        <span className="ml-3 text-text-muted">Loading social accounts...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Error Display */}
      {error && (
        <Card className="border-error/20 bg-error/5">
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-error">{error}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearError}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </CardContent>
        </Card>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sm3d-text-h1">Social Media Accounts</h1>
          <p className="sm3d-text-body mt-1">
            Connect and manage your social media platforms for unified content management
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setShowConnectionGuide(!showConnectionGuide)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Connection Guide
          </Button>
          <Button 
            size="sm" 
            onClick={handleSyncAll}
            isLoading={syncing === 'all'}
            disabled={connectedAccounts.length === 0}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync All
          </Button>
        </div>
      </div>

      {/* Connection Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex items-center space-x-4">
            <div className="p-3 bg-success/10 rounded-full">
              <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{connectedCount}</p>
              <p className="text-sm text-text-muted">Connected Accounts</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center space-x-4">
            <div className="p-3 bg-info/10 rounded-full">
              <svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{totalPlatforms}</p>
              <p className="text-sm text-text-muted">Available Platforms</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center space-x-4">
            <div className="p-3 bg-accent/10 rounded-full">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {connectedAccounts.reduce((total, account) => total + account.followers, 0).toLocaleString()}
              </p>
              <p className="text-sm text-text-muted">Total Reach</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Guide */}
      {showConnectionGuide && (
        <Card className="border-info/20 bg-info/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>How to Connect Your Accounts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-text-primary">Connection Process</h3>
                <ol className="space-y-2 text-sm text-text-muted">
                  <li className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Click "Connect" on your desired platform</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>You'll be redirected to the platform's secure login page</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Authorize SM3D to manage your account</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <span>Start managing your content from SM3D</span>
                  </li>
                </ol>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-text-primary">Security & Privacy</h3>
                <ul className="space-y-2 text-sm text-text-muted">
                  <li className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>OAuth2 secure authentication</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>We never store your passwords</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Encrypted token storage</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>You can revoke access anytime</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {platforms.map((platform) => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            account={getAccountForPlatform(platform.id)}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onManage={handleManage}
            isLoading={connecting === platform.id}
            isDisconnecting={disconnecting}
            isSyncing={syncing}
          />
        ))}
      </div>

      {/* Account Management Modal */}
      {selectedAccount && (
        <AccountManagementModal
          account={selectedAccount}
          isOpen={showManagementModal}
          onClose={handleCloseModal}
          onSync={syncAccount}
          onDisconnect={disconnectAccount}
          isSyncing={syncing === selectedAccount.id}
          isDisconnecting={disconnecting === selectedAccount.id}
        />
      )}
    </div>
  );
};
