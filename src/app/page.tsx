import { redirect } from 'next/navigation';
import { isAdminEmail } from '@/lib/firebase/roles';
import { getSessionUser } from '@/lib/firebase/session';

export default async function HomePage() {
  const user = await getSessionUser();

  // Admin logado vai para o painel; todos os demais (inclusive anônimos)
  // vão direto ao agendamento, que é público. Ver enunciado: cliente não cadastra.
  if (user && isAdminEmail(user.email)) redirect('/admin');
  redirect('/agendar');
}
