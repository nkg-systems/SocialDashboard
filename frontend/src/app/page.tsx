import { DashboardLayout } from '../components/layout/DashboardLayout';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';

export default function HomePage() {
  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  );
}
