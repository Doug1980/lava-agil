import { z } from 'zod';
import { updateStatusSchema } from '@/lib/schemas/appointment';
import { findAppointmentById, updateStatus } from '@/server/db/queries/appointments';
import { assertTransition } from '@/server/services/status';
import { toAppointmentResponse } from '@/server/services/mapper';
import { fail, handleError, json } from '@/lib/api';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = z.object({ id: z.uuid() }).parse(await params);
    const { status } = updateStatusSchema.parse(await request.json());

    const current = await findAppointmentById(id);
    if (!current) return fail('NOT_FOUND', 'Agendamento não encontrado.', 404);

    assertTransition(current.status, status);
    await updateStatus(id, status);

    const updated = await findAppointmentById(id);
    return json(toAppointmentResponse(updated!));
  } catch (err) {
    return handleError(err);
  }
}