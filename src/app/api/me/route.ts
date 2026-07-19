import { fail, json } from '@/lib/api';
import { isAdminEmail } from '@/lib/firebase/roles';
import { getSessionUser } from '@/lib/firebase/session';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail('UNAUTHORIZED', 'Sessão inválida.', 401);

  return json({
    email: user.email,
    isAdmin: isAdminEmail(user.email),
  });
}
