import { z } from 'zod';
import { fail, handleError, json } from '@/lib/api';
import { deleteAppointment, findAppointmentById } from '@/server/db/queries/appointments';
import { toAppointmentResponse } from '@/server/services/mapper';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = z.object({ id: z.uuid() }).parse(await params);
    const row = await findAppointmentById(id);

    if (!row) return fail('NOT_FOUND', 'Agendamento não encontrado.', 404);
    return json(toAppointmentResponse(row));
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = z.object({ id: z.uuid() }).parse(await params);
    const row = await deleteAppointment(id);

    if (!row) return fail('NOT_FOUND', 'Agendamento não encontrado.', 404);
    return new Response(null, { status: 204 });
  } catch (err) {
    return handleError(err);
  }
}
