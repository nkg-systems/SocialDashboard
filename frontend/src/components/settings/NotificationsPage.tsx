/**
 * Notification Preferences Page
 * Allows users to manage email, push, and in-app notification settings
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface NotificationSettings {
  email: {
    postPublished: boolean;
    scheduledPosts: boolean;
    analyticsReports: boolean;
    securityAlerts: boolean;
    accountUpdates: boolean;
    marketing: boolean;
  };
  push: {
    postPublished: boolean;
    scheduledPosts: boolean;
    engagementAlerts: boolean;
    securityAlerts: boolean;
    mentions: boolean;
  };
  inApp: {
    postPublished: boolean;
    scheduledPosts: boolean;
    engagementAlerts: boolean;
    systemUpdates: boolean;
    mentions: boolean;
    comments: boolean;
  };
}

export const NotificationsPage: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      postPublished: true,
      scheduledPosts: true,
      analyticsReports: false,
      securityAlerts: true,
      accountUpdates: true,
      marketing: false,
    },
    push: {
      postPublished: false,
      scheduledPosts: true,
      engagementAlerts: true,
      securityAlerts: true,
      mentions: true,
    },
    inApp: {
      postPublished: true,
      scheduledPosts: true,
      engagementAlerts: true,
      systemUpdates: true,
      mentions: true,
      comments: true,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Handle notification setting toggle
  const handleToggle = useCallback((
    category: keyof NotificationSettings,
    setting: string
  ) => {
    // Security: Validate category and setting exist
    if (!category || !setting) return;
    if (!(category in settings)) return;
    if (!(setting in settings[category])) return;
    
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting as keyof typeof prev[category]]
      }
    }));
    setHasChanges(true);
  }, [settings]);

  // Handle save settings
  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
      console.log('Notification settings saved successfully');
      // TODO: Show success notification
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      // TODO: Show error notification
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle reset to defaults
  const handleReset = useCallback(() => {
    const confirmed = confirm(
      'Reset all notification settings to default values?\n\n' +
      'This will overwrite your current preferences.'
    );

    if (!confirmed) return;

    setSettings({
      email: {
        postPublished: true,
        scheduledPosts: true,
        analyticsReports: false,
        securityAlerts: true,
        accountUpdates: true,
        marketing: false,
      },
      push: {
        postPublished: false,
        scheduledPosts: true,
        engagementAlerts: true,
        securityAlerts: true,
        mentions: true,
      },
      inApp: {
        postPublished: true,
        scheduledPosts: true,
        engagementAlerts: true,
        systemUpdates: true,
        mentions: true,
        comments: true,
      },
    });
    setHasChanges(true);
  }, []);

  // Toggle switch component
  const ToggleSwitch: React.FC<{
    enabled: boolean;
    onToggle: () => void;
    disabled?: boolean;
  }> = ({ enabled, onToggle, disabled = false }) => (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
        enabled ? 'bg-accent' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  // Notification category component
  const NotificationCategory: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    settings: Record<string, boolean>;
    category: keyof NotificationSettings;
    options: Array<{
      key: string;
      label: string;
      description: string;
      required?: boolean;
    }>;
  }> = ({ title, description, icon, settings, category, options }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {icon}
          <div>
            <h3>{title}</h3>
            <p className="text-sm font-normal text-text-muted">{description}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {options.map((option) => (
          <div key={option.key} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <p className="font-medium">{option.label}</p>
                {option.required && (
                  <span className="px-2 py-1 text-xs bg-accent/10 text-accent rounded-full">
                    Required
                  </span>
                )}
              </div>
              <p className="text-sm text-text-muted">{option.description}</p>
            </div>
            <ToggleSwitch
              enabled={settings[option.key]}
              onToggle={() => handleToggle(category, option.key)}
              disabled={option.required}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sm3d-text-h1">Notification Preferences</h1>
          <p className="sm3d-text-body mt-1">
            Control how and when you receive notifications
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="ghost"
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isLoading}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Email Notifications */}
      <NotificationCategory
        title="Email Notifications"
        description="Receive notifications via email"
        icon={
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
        settings={settings.email}
        category="email"
        options={[
          {
            key: 'postPublished',
            label: 'Post Published',
            description: 'When your scheduled posts are published'
          },
          {
            key: 'scheduledPosts',
            label: 'Scheduled Post Reminders',
            description: 'Reminders about upcoming scheduled posts'
          },
          {
            key: 'analyticsReports',
            label: 'Analytics Reports',
            description: 'Weekly and monthly performance reports'
          },
          {
            key: 'securityAlerts',
            label: 'Security Alerts',
            description: 'Important security notifications and login alerts',
            required: true
          },
          {
            key: 'accountUpdates',
            label: 'Account Updates',
            description: 'Changes to your account and connected platforms'
          },
          {
            key: 'marketing',
            label: 'Marketing Communications',
            description: 'Product updates, tips, and promotional content'
          }
        ]}
      />

      {/* Push Notifications */}
      <NotificationCategory
        title="Push Notifications"
        description="Receive notifications on your devices"
        icon={
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        }
        settings={settings.push}
        category="push"
        options={[
          {
            key: 'postPublished',
            label: 'Post Published',
            description: 'When your scheduled posts go live'
          },
          {
            key: 'scheduledPosts',
            label: 'Scheduled Post Reminders',
            description: 'Upcoming posts ready for review'
          },
          {
            key: 'engagementAlerts',
            label: 'High Engagement',
            description: 'When your posts receive significant engagement'
          },
          {
            key: 'securityAlerts',
            label: 'Security Alerts',
            description: 'Critical security notifications',
            required: true
          },
          {
            key: 'mentions',
            label: 'Mentions & Tags',
            description: 'When you are mentioned or tagged'
          }
        ]}
      />

      {/* In-App Notifications */}
      <NotificationCategory
        title="In-App Notifications"
        description="Notifications shown within the application"
        icon={
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 3H5a2 2 0 00-2 2v14a2 2 0 002 2h6m5-6V9a2 2 0 00-2-2m0 0V3a2 2 0 00-2-2H9v4h3V3z" />
          </svg>
        }
        settings={settings.inApp}
        category="inApp"
        options={[
          {
            key: 'postPublished',
            label: 'Post Published',
            description: 'Success notifications for published posts'
          },
          {
            key: 'scheduledPosts',
            label: 'Scheduled Posts',
            description: 'Updates about scheduled post status'
          },
          {
            key: 'engagementAlerts',
            label: 'Engagement Notifications',
            description: 'Real-time engagement updates'
          },
          {
            key: 'systemUpdates',
            label: 'System Updates',
            description: 'Platform updates and maintenance notifications'
          },
          {
            key: 'mentions',
            label: 'Mentions & Tags',
            description: 'When you are mentioned across platforms'
          },
          {
            key: 'comments',
            label: 'Comments & Replies',
            description: 'New comments and replies on your posts'
          }
        ]}
      />

      {/* Notification Tips */}
      <Card className="border-info/20 bg-info/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Notification Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-text-muted">
            <li className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Security alerts cannot be disabled for your safety</span>
            </li>
            <li className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Push notifications require browser or device permissions</span>
            </li>
            <li className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Email notifications respect your timezone settings</span>
            </li>
            <li className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>You can unsubscribe from marketing emails at any time</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;