/**
 * Settings Page Route
 * Next.js page component for the settings section
 */

import { Metadata } from 'next';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import SettingsPage from '@/components/settings/SettingsPage';

export const metadata: Metadata = {
  title: 'Settings - SM3D',
  description: 'Manage your profile, security, and notification preferences',
};

export default function Settings() {
  return (
    <DashboardLayout>
      <SettingsPage />
    </DashboardLayout>
  );
}
