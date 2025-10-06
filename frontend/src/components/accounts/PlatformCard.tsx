'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface PlatformCardProps {
  platform: {
    name: string;
    id: string;
    description: string;
    brandColor: string;
    icon: React.ReactNode;
    features: string[];
  };
  account?: {
    id: string;
    username: string;
    displayName: string;
    followers: number;
    profileImageUrl?: string;
    lastSync: string;
    status: 'connected' | 'error' | 'syncing';
    permissions: string[];
  } | null;
  onConnect: (platformId: string) => void;
  onDisconnect: (accountId: string) => void;
  onManage: (accountId: string) => void;
  isLoading?: boolean;
}

export const PlatformCard: React.FC<PlatformCardProps> = ({
  platform,
  account,
  onConnect,
  onDisconnect,
  onManage,
  isLoading = false
}) => {
  const [showFeatures, setShowFeatures] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-success';
      case 'error': return 'text-error';
      case 'syncing': return 'text-warning';
      default: return 'text-text-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'error': return 'Connection Error';
      case 'syncing': return 'Syncing...';
      default: return 'Not Connected';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-success';
      case 'error': return 'bg-error';
      case 'syncing': return 'bg-warning';
      default: return 'bg-text-muted';
    }
  };

  return (
    <Card hover className="relative overflow-hidden">
      {/* Platform Brand Color Accent */}
      <div 
        className="absolute top-0 left-0 right-0 h-1" 
        style={{ backgroundColor: platform.brandColor }}
      />
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-surface border border-border">
              <div style={{ color: platform.brandColor }}>
                {platform.icon}
              </div>
            </div>
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>{platform.name}</span>
                {account && (
                  <span className={`w-2 h-2 rounded-full ${getStatusDot(account.status)}`} />
                )}
              </CardTitle>
              <p className="text-sm text-text-muted mt-1">
                {platform.description}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {account && (
              <span className={`text-xs px-2 py-1 rounded-full bg-surface border ${getStatusColor(account.status)}`}>
                {getStatusText(account.status)}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connected Account Info */}
        {account ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-background rounded-button">
              {account.profileImageUrl ? (
                <img 
                  src={account.profileImageUrl} 
                  alt={account.displayName}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                  <span className="text-accent font-semibold">
                    {account.displayName[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary truncate">
                  {account.displayName}
                </p>
                <p className="text-sm text-text-muted truncate">
                  @{account.username}
                </p>
                <p className="text-xs text-text-muted">
                  {account.followers.toLocaleString()} followers
                </p>
              </div>
            </div>

            {/* Account Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-2 bg-background rounded-button">
                <p className="text-sm font-medium text-text-primary">
                  {account.followers.toLocaleString()}
                </p>
                <p className="text-xs text-text-muted">Followers</p>
              </div>
              <div className="text-center p-2 bg-background rounded-button">
                <p className="text-sm font-medium text-text-primary">
                  {account.permissions.length}
                </p>
                <p className="text-xs text-text-muted">Permissions</p>
              </div>
            </div>

            {/* Last Sync */}
            <div className="text-center">
              <p className="text-xs text-text-muted">
                Last synced: {account.lastSync}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onManage(account.id)}
                className="flex-1"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDisconnect(account.id)}
                isLoading={isLoading}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          /* Not Connected State */
          <div className="space-y-4">
            {/* Platform Features */}
            <div className="space-y-2">
              <button
                onClick={() => setShowFeatures(!showFeatures)}
                className="flex items-center justify-between w-full text-left text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                <span>What you can do with {platform.name}</span>
                <svg 
                  className={`w-4 h-4 transform transition-transform ${showFeatures ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showFeatures && (
                <div className="space-y-1 pl-2 border-l-2 border-border">
                  {platform.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <svg className="w-3 h-3 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs text-text-muted">{feature}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Connect Button */}
            <Button
              onClick={() => onConnect(platform.id)}
              isLoading={isLoading}
              className="w-full"
              style={{ backgroundColor: platform.brandColor }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Connect {platform.name}
            </Button>

            {/* Security Note */}
            <div className="text-center">
              <p className="text-xs text-text-muted">
                🔒 Secure OAuth2 connection • We never store your passwords
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};