import { BookingFlow } from '@/components/client/booking-flow';
import { ClientNav } from '@/components/client/client-nav';

// Página pública. O cliente agenda sem cadastro nem login (conforme o enunciado).
export default function AgendarPage() {
  return (
    <>
      <ClientNav />
      <BookingFlow />
    </>
  );
}
