/**
 * Scheduler Page Route
 * Next.js page component for the post scheduling section
 */

import { Metadata } from 'next';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import SchedulingPage from '@/components/scheduling/SchedulingPage';

export const metadata: Metadata = {
  title: 'Post Scheduler - SM3D',
  description: 'Schedule and manage your social media posts across platforms',
};

export default function Scheduler() {
  return (
    <DashboardLayout>
      <SchedulingPage />
    </DashboardLayout>
  );
}