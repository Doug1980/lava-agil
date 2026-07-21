import { z } from 'zod';
import { fail, handleError, json } from '@/lib/api';
import { requireAdmin } from '@/lib/firebase/require-admin';
import {
  findAppointmentById,
  OVERLAP_ERROR_CODE,
  restoreAppointment,
} from '@/server/db/queries/appointments';
import { toAppointmentResponse } from '@/server/services/mapper';

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = z.object({ id: z.uuid() }).parse(await params);

    try {
      const row = await restoreAppointment(id);
      if (!row) return fail('NOT_FOUND', 'Agendamento excluído não encontrado.', 404);
    } catch (dbErr) {
      // Constraint de agenda: o horário já foi reservado por outro no meio-tempo.
      const code =
        dbErr && typeof dbErr === 'object' && 'code' in dbErr ? String(dbErr.code) : '';
      const message = dbErr instanceof Error ? dbErr.message : '';
      if (code === OVERLAP_ERROR_CODE || message.includes('appointments_no_overlap')) {
        return fail(
          'SLOT_TAKEN',
          'O horário já foi reservado por outro agendamento. Não é possível restaurar.',
          409,
        );
      }
      throw dbErr;
    }

    const restored = await findAppointmentById(id);
    return json(toAppointmentResponse(restored!));
  } catch (err) {
    return handleError(err);
  }
}
