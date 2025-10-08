/**
 * Security Settings Page
 * Allows users to manage password, two-factor authentication, active sessions, and security preferences
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validatePassword, sanitizeHtml } from '@/utils/validation';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  passwordLastChanged: string;
  lastPasswordChangeDate: Date;
  activeSessions: ActiveSession[];
  loginNotifications: boolean;
  suspiciousActivityAlerts: boolean;
}

interface ActiveSession {
  id: string;
  deviceName: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  current: boolean;
  browser: string;
  os: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  submit?: string;
}

export const SecurityPage: React.FC = () => {
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    passwordLastChanged: '2024-01-15T00:00:00Z',
    lastPasswordChangeDate: new Date('2024-01-15T00:00:00Z'),
    loginNotifications: true,
    suspiciousActivityAlerts: true,
    activeSessions: [
      {
        id: '1',
        deviceName: 'MacBook Pro',
        location: 'New York, NY',
        ipAddress: '192.168.1.1',
        lastActive: '2024-01-20T10:30:00Z',
        current: true,
        browser: 'Chrome 120',
        os: 'macOS 14.2'
      },
      {
        id: '2',
        deviceName: 'iPhone 15',
        location: 'New York, NY',
        ipAddress: '192.168.1.100',
        lastActive: '2024-01-19T15:45:00Z',
        current: false,
        browser: 'Safari 17',
        os: 'iOS 17.2'
      },
      {
        id: '3',
        deviceName: 'Unknown Device',
        location: 'London, UK',
        ipAddress: '45.123.45.67',
        lastActive: '2024-01-18T08:22:00Z',
        current: false,
        browser: 'Firefox 121',
        os: 'Windows 11'
      }
    ]
  });

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);

  // Handle password form changes
  const handlePasswordChange = useCallback((field: keyof PasswordFormData, value: string) => {
    const sanitizedValue = sanitizeHtml(value);
    
    setPasswordForm(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));

    // Clear field error on change
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, [passwordErrors]);

  // Validate password form
  const validatePasswordForm = useCallback((): boolean => {
    const errors: PasswordErrors = {};

    // Validate current password
    if (!passwordForm.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required';
    }

    // Validate new password
    if (!validatePassword(passwordForm.newPassword)) {
      errors.newPassword = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }

    // Validate password confirmation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Check if new password is different from current
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  }, [passwordForm]);

  // Handle password change submission
  const handlePasswordSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setIsPasswordLoading(true);
    setPasswordErrors({});

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update password change date
      setSecuritySettings(prev => ({
        ...prev,
        passwordLastChanged: new Date().toISOString(),
        lastPasswordChangeDate: new Date()
      }));

      // Clear form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // TODO: Show success notification
      console.log('Password changed successfully');

    } catch (error) {
      setPasswordErrors({
        submit: 'Failed to change password. Please try again.'
      });
    } finally {
      setIsPasswordLoading(false);
    }
  }, [passwordForm, validatePasswordForm]);

  // Handle two-factor authentication toggle
  const handleTwoFactorToggle = useCallback(async () => {
    if (securitySettings.twoFactorEnabled) {
      // Disable 2FA
      const confirmed = confirm(
        'Are you sure you want to disable two-factor authentication?\n\n' +
        'This will make your account less secure.'
      );
      
      if (!confirmed) return;

      setIsSettingsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSecuritySettings(prev => ({
          ...prev,
          twoFactorEnabled: false
        }));

        console.log('Two-factor authentication disabled');
      } catch (error) {
        console.error('Failed to disable 2FA');
      } finally {
        setIsSettingsLoading(false);
      }
    } else {
      // Enable 2FA - show setup modal
      setShowTwoFactorSetup(true);
    }
  }, [securitySettings.twoFactorEnabled]);

  // Handle notification settings change
  const handleNotificationToggle = useCallback(async (setting: 'loginNotifications' | 'suspiciousActivityAlerts') => {
    setIsSettingsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSecuritySettings(prev => ({
        ...prev,
        [setting]: !prev[setting]
      }));
    } catch (error) {
      console.error(`Failed to update ${setting}`);
    } finally {
      setIsSettingsLoading(false);
    }
  }, []);

  // Handle session termination
  const handleTerminateSession = useCallback(async (sessionId: string) => {
    const session = securitySettings.activeSessions.find(s => s.id === sessionId);
    if (!session) return;

    const confirmed = confirm(
      `Terminate session on ${session.deviceName}?\n\n` +
      `Location: ${session.location}\n` +
      `This will log out the device immediately.`
    );

    if (!confirmed) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSecuritySettings(prev => ({
        ...prev,
        activeSessions: prev.activeSessions.filter(s => s.id !== sessionId)
      }));

      console.log('Session terminated successfully');
    } catch (error) {
      console.error('Failed to terminate session');
    }
  }, [securitySettings.activeSessions]);

  // Handle terminate all other sessions
  const handleTerminateAllOtherSessions = useCallback(async () => {
    const otherSessions = securitySettings.activeSessions.filter(s => !s.current);
    
    if (otherSessions.length === 0) return;

    const confirmed = confirm(
      `Terminate ${otherSessions.length} other session(s)?\n\n` +
      'This will log out all other devices immediately.'
    );

    if (!confirmed) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSecuritySettings(prev => ({
        ...prev,
        activeSessions: prev.activeSessions.filter(s => s.current)
      }));

      console.log('All other sessions terminated');
    } catch (error) {
      console.error('Failed to terminate sessions');
    }
  }, [securitySettings.activeSessions]);

  const getDeviceIcon = (os: string) => {
    if (os.includes('iOS') || os.includes('iPhone')) {
      return (
        <svg className="w-5 h-5 text-text-muted" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
      );
    } else if (os.includes('Android')) {
      return (
        <svg className="w-5 h-5 text-text-muted" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.523 15.341c-.569 0-.841-.447-.841-1.062 0-.615.272-1.062.841-1.062s.841.447.841 1.062c0 .615-.272 1.062-.841 1.062zm-11.046 0c-.569 0-.841-.447-.841-1.062 0-.615.272-1.062.841-1.062s.841.447.841 1.062c0 .615-.272 1.062-.841 1.062zm14.439-2.761c.569 0 .841.447.841 1.062s-.272 1.062-.841 1.062V15c-2.89 0-5.73 1.15-7.84 3.09C10.96 16.15 8.12 15 5.23 15v-.358c-.569 0-.841-.447-.841-1.062s.272-1.062.841-1.062c3.34 0 6.46 1.37 8.77 3.63 2.31-2.26 5.43-3.63 8.77-3.63V4.5c0-1.38-1.12-2.5-2.5-2.5h-15C4.12 2 3 3.12 3 4.5V19c0 1.38 1.12 2.5 2.5 2.5h15c1.38 0 2.5-1.12 2.5-2.5v-6.42z"/>
        </svg>
      );
    } else if (os.includes('macOS') || os.includes('Mac')) {
      return (
        <svg className="w-5 h-5 text-text-muted" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H3V4h18v10z"/>
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-text-muted" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
      </svg>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="sm3d-text-h1">Security Settings</h1>
        <p className="sm3d-text-body mt-1">
          Manage your account security and privacy settings
        </p>
      </div>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="text-sm text-text-muted mb-4">
              Last changed: {securitySettings.lastPasswordChangeDate.toLocaleDateString()}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password *</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                autoComplete="current-password"
                required
              />
              {passwordErrors.currentPassword && (
                <p className="text-sm text-error">{passwordErrors.currentPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                autoComplete="new-password"
                required
              />
              {passwordErrors.newPassword && (
                <p className="text-sm text-error">{passwordErrors.newPassword}</p>
              )}
              <p className="text-xs text-text-muted">
                Must contain at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                autoComplete="new-password"
                required
              />
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-error">{passwordErrors.confirmPassword}</p>
              )}
            </div>

            {passwordErrors.submit && (
              <div className="flex items-center space-x-2 text-error text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>{passwordErrors.submit}</span>
              </div>
            )}

            <Button
              type="submit"
              isLoading={isPasswordLoading}
              disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            >
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Two-Factor Authentication is {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-sm text-text-muted">
                {securitySettings.twoFactorEnabled 
                  ? 'Your account is protected with an additional security layer'
                  : 'Add an extra layer of security to your account'
                }
              </p>
            </div>
            <Button
              variant={securitySettings.twoFactorEnabled ? "destructive" : "default"}
              onClick={handleTwoFactorToggle}
              isLoading={isSettingsLoading}
            >
              {securitySettings.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
            </Button>
          </div>
          
          {securitySettings.twoFactorEnabled && (
            <div className="flex items-center space-x-2 text-success text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Your account is secured with 2FA</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Security Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Login Notifications</p>
              <p className="text-sm text-text-muted">
                Get notified when someone logs into your account
              </p>
            </div>
            <button
              onClick={() => handleNotificationToggle('loginNotifications')}
              disabled={isSettingsLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                securitySettings.loginNotifications ? 'bg-accent' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  securitySettings.loginNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Suspicious Activity Alerts</p>
              <p className="text-sm text-text-muted">
                Get notified about potential security threats
              </p>
            </div>
            <button
              onClick={() => handleNotificationToggle('suspiciousActivityAlerts')}
              disabled={isSettingsLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                securitySettings.suspiciousActivityAlerts ? 'bg-accent' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  securitySettings.suspiciousActivityAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Sessions</CardTitle>
            {securitySettings.activeSessions.filter(s => !s.current).length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleTerminateAllOtherSessions}
              >
                Terminate All Others
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {securitySettings.activeSessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {getDeviceIcon(session.os)}
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{session.deviceName}</p>
                    {session.current && (
                      <span className="px-2 py-1 text-xs bg-success/10 text-success rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-muted">
                    {session.browser} on {session.os}
                  </p>
                  <p className="text-sm text-text-muted">
                    {session.location} • Last active {new Date(session.lastActive).toLocaleString()}
                  </p>
                </div>
              </div>
              {!session.current && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleTerminateSession(session.id)}
                >
                  Terminate
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card className="border-info/20 bg-info/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Security Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-text-muted">
            <li className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Use a unique, strong password for your account</span>
            </li>
            <li className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Enable two-factor authentication for extra security</span>
            </li>
            <li className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Regularly review your active sessions</span>
            </li>
            <li className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Log out from public or shared devices</span>
            </li>
            <li className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Keep your contact information up to date for security alerts</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityPage;