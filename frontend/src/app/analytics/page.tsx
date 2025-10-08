import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { AnalyticsPage } from '../../components/analytics/AnalyticsPage';

export default function AnalyticsPageRoute() {
  return (
    <DashboardLayout>
      <AnalyticsPage />
    </DashboardLayout>
  );
}