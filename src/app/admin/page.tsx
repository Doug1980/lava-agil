import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { getSessionUser } from '@/lib/firebase/session';

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/admin/login');

  return <AdminDashboard />;
}
