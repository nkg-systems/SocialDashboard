/**
 * Admin Page Route
 * Protected route that requires admin role
 */

'use client';

import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { withAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';

const AdminPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Admin Panel</h1>
          <p className="text-text-muted mt-1">
            Administrative tools and system management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-muted">
                Manage user accounts, roles, and permissions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-muted">
                Configure system-wide settings and preferences
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-muted">
                View system metrics and usage statistics
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-muted">
                Review security events and user activities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Moderation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-muted">
                Review and moderate user-generated content
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-muted">
                Security settings and threat monitoring
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Welcome message */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Welcome, {user?.name || 'Admin'}!
            </h2>
            <p className="text-text-muted">
              You are signed in as an administrator with full system access.
              This page demonstrates role-based route protection using the{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">withAuth</code> HOC
              with admin role requirement.
            </p>
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-green-800">
                  Admin Access Verified
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

// Protect this route - requires admin role
export default withAuth(AdminPage, [], 'admin');