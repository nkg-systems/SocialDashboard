import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PostsPage } from '../../components/posts/PostsPage';

export default function PostsPageRoute() {
  return (
    <DashboardLayout>
      <PostsPage />
    </DashboardLayout>
  );
}