import { cookies } from 'next/headers';
import { adminAuth } from './admin';

const SESSION_COOKIE = 'admin_session';

/** Lê e valida o session cookie. Retorna o usuário ou null. */
export async function getSessionUser() {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;

  if (!session) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return null;
  }
}
