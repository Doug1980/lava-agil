import { ClientNav } from '@/components/client/client-nav';
import { MyBookings } from '@/components/client/my-bookings';
import { SiteFooter } from '@/components/layout/site-footer';

// Pública: o cliente acompanha os agendamentos salvos no navegador ou por código.
export default function MeusAgendamentosPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ClientNav />
      <div className="flex-1">
        <MyBookings />
      </div>
      <SiteFooter />
    </div>
  );
}
