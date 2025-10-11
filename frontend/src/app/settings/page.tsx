/**
 * Settings Page Route
 * Protected Next.js page component for the settings section
 */

'use client';

import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import SettingsPage from '@/components/settings/SettingsPage';
import { withAuth } from '../../contexts/AuthContext';

// Note: Metadata must be defined in a non-client component
// Move to layout.tsx if needed for SEO

const SettingsRoute: React.FC = () => {
  return (
    <DashboardLayout>
      <SettingsPage />
    </DashboardLayout>
  );
};

// Protect this route - requires authentication and write permission
export default withAuth(SettingsRoute, ['write']);
