import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { AdminFooter } from '@/components/layout/admin-footer';
import { AppHeader } from '@/components/layout/app-header';
import { isAdminEmail } from '@/lib/firebase/roles';
import { getSessionUser } from '@/lib/firebase/session';

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/entrar');
  if (!isAdminEmail(user.email)) redirect('/agendar');

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader name={user.name} email={user.email} />
      <div className="flex-1">
        <AdminDashboard />
      </div>
      <AdminFooter />
    </div>
  );
}
