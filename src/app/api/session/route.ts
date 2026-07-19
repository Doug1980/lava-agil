import { cookies } from 'next/headers';
import { fail, json } from '@/lib/api';
import { adminAuth } from '@/lib/firebase/admin';

const SESSION_COOKIE = 'admin_session';
const EXPIRES_IN = 60 * 60 * 24 * 5 * 1000; // 5 dias em ms

export async function POST(request: Request) {
  try {
    const { token } = (await request.json()) as { token?: string };
    if (!token) return fail('NO_TOKEN', 'Token ausente.', 401);

    // Verifica o ID token antes de criar a sessão.
    await adminAuth.verifyIdToken(token);

    const sessionCookie = await adminAuth.createSessionCookie(token, {
      expiresIn: EXPIRES_IN,
    });

    const store = await cookies();
    store.set(SESSION_COOKIE, sessionCookie, {
      maxAge: EXPIRES_IN / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return json({ ok: true });
  } catch {
    return fail('AUTH_FAILED', 'Não foi possível autenticar.', 401);
  }
}

export async function DELETE() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return json({ ok: true });
}
