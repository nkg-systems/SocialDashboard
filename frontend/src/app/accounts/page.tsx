import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { SocialAccountsPage } from '../../components/accounts/SocialAccountsPage';

export default function AccountsPage() {
  return (
    <DashboardLayout>
      <SocialAccountsPage />
    </DashboardLayout>
  );
}