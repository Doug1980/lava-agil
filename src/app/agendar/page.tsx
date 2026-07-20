import { BookingFlow } from '@/components/client/booking-flow';
import { ClientNav } from '@/components/client/client-nav';
import { SiteFooter } from '@/components/layout/site-footer';

// Página pública. O cliente agenda sem cadastro nem login (conforme o enunciado).
export default function AgendarPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ClientNav />
      <div className="flex-1">
        <BookingFlow />
      </div>
      <SiteFooter />
    </div>
  );
}
