import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { isAdminEmail } from '@/lib/firebase/roles';
import { getSessionUser } from '@/lib/firebase/session';

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/entrar');
  if (!isAdminEmail(user.email)) redirect('/agendar');

  return <AdminDashboard />;
}
