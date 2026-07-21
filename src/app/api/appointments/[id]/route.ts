import { z } from 'zod';
import { fail, handleError, json } from '@/lib/api';
import { requireAdmin } from '@/lib/firebase/require-admin';
import { deleteAppointmentSchema } from '@/lib/schemas/appointment';
import { deleteAppointment, findAppointmentById } from '@/server/db/queries/appointments';
import { toAppointmentResponse } from '@/server/services/mapper';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = z.object({ id: z.uuid() }).parse(await params);
    const row = await findAppointmentById(id);

    if (!row) return fail('NOT_FOUND', 'Agendamento não encontrado.', 404);
    return json(toAppointmentResponse(row));
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = z.object({ id: z.uuid() }).parse(await params);
    const { reason } = deleteAppointmentSchema.parse(await request.json());
    const row = await deleteAppointment(id, reason);

    if (!row) return fail('NOT_FOUND', 'Agendamento não encontrado.', 404);
    return new Response(null, { status: 204 });
  } catch (err) {
    return handleError(err);
  }
}
