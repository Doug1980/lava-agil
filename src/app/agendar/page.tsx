import { redirect } from 'next/navigation';
import { BookingFlow } from '@/components/client/booking-flow';
import { getSessionUser } from '@/lib/firebase/session';

export default async function AgendarPage() {
  const user = await getSessionUser();
  if (!user) redirect('/entrar');

  return <BookingFlow />;
}
