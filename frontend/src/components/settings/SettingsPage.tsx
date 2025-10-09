/**
 * Main Settings Page
 * Navigation hub for all settings sections with tabbed interface
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ProfilePage from './ProfilePage';
import SecurityPage from './SecurityPage';
import NotificationsPage from './NotificationsPage';

type SettingsTab = 'profile' | 'security' | 'notifications';

interface SettingsTabConfig {
  key: SettingsTab;
  label: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType;
}

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Tab configurations
  const tabs: SettingsTabConfig[] = [
    {
      key: 'profile',
      label: 'Profile',
      description: 'Personal information and preferences',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      component: ProfilePage
    },
    {
      key: 'security',
      label: 'Security',
      description: 'Password, 2FA, and account security',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      component: SecurityPage
    },
    {
      key: 'notifications',
      label: 'Notifications',
      description: 'Email, push, and app notifications',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 3H5a2 2 0 00-2 2v14a2 2 0 002 2h6m5-6V9a2 2 0 00-2-2m0 0V3a2 2 0 00-2-2H9v4h3V3z" />
        </svg>
      ),
      component: NotificationsPage
    }
  ];

  // Handle tab change
  const handleTabChange = useCallback((tabKey: SettingsTab) => {
    setActiveTab(tabKey);
  }, []);

  // Get current tab configuration
  const getCurrentTab = useCallback(() => {
    return tabs.find(tab => tab.key === activeTab) || tabs[0];
  }, [activeTab, tabs]);

  const currentTab = getCurrentTab();
  const CurrentComponent = currentTab.component;

  return (
    <div className="bg-background">
      {/* Settings Navigation */}
      <div className="border-b border-border bg-card">
        <div className="p-6">
          <h1 className="sm3d-text-h1 mb-6">Settings</h1>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-background text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-primary hover:bg-background/50'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile Tab Description */}
          <div className="sm:hidden mt-4">
            <Card>
              <CardContent className="flex items-center space-x-3 py-3">
                <div className="text-accent">
                  {currentTab.icon}
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">{currentTab.label}</h3>
                  <p className="text-sm text-text-muted">{currentTab.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="max-w-4xl mx-auto">
        <CurrentComponent />
      </div>

      {/* Settings Footer */}
      <div className="border-t border-border bg-card mt-8">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-text-muted">
              Need help with your settings? Check our{' '}
              <a 
                href="#" 
                className="text-accent hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  // TODO: Open help documentation
                }}
              >
                documentation
              </a>
              {' '}or{' '}
              <a 
                href="#" 
                className="text-accent hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  // TODO: Open support chat
                }}
              >
                contact support
              </a>
            </p>
            <p className="text-xs text-text-muted">
              Changes are saved automatically. Your data is encrypted and secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;