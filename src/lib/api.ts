import { ZodError } from 'zod';
import { isBusinessRuleError } from '@/server/services/errors';
import { isExclusionViolation } from '@/server/db/errors';

export function json<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

export function fail(code: string, message: string, status: number) {
  return Response.json({ error: code, message }, { status });
}

/** Traduz exceções de domínio e de infraestrutura em respostas HTTP. */
export function handleError(err: unknown): Response {
  if (err instanceof ZodError) {
    return Response.json(
      { error: 'VALIDATION_ERROR', message: 'Dados inválidos.', issues: err.issues },
      { status: 400 },
    );
  }

  if (isExclusionViolation(err)) {
    return fail('SLOT_TAKEN', 'Esse horário acabou de ser preenchido.', 409);
  }

  if (isBusinessRuleError(err)) {
    return fail(err.rule, err.message, 422);
  }

  console.error('[api] erro não tratado:', err);
  return fail('INTERNAL_ERROR', 'Erro interno. Tente novamente.', 500);
}