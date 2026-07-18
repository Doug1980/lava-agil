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

/** Garante que há uma sessão de admin válida. Lança UnauthorizedError se não. */
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
