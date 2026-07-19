import { ClientNav } from '@/components/client/client-nav';
import { MyBookings } from '@/components/client/my-bookings';

// Pública: o cliente acompanha os agendamentos salvos no navegador ou por código.
export default function MeusAgendamentosPage() {
  return (
    <>
      <ClientNav />
      <MyBookings />
    </>
  );
}
