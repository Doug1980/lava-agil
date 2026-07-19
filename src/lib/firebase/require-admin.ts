import { isAdminEmail } from './roles';
import { getSessionUser } from './session';

export class UnauthorizedError extends Error {
  constructor() {
    super('Não autorizado.');
    this.name = 'UnauthorizedError';
  }
}

export function isUnauthorizedError(err: unknown): err is UnauthorizedError {
  return err instanceof UnauthorizedError;
}

/** Garante sessão de admin (logado E com email admin). */
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || !isAdminEmail(user.email)) throw new UnauthorizedError();
  return user;
}
