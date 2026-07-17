import {
  createAppointmentSchema,
  listAppointmentsQuerySchema,
} from '@/lib/schemas/appointment';
import { createAppointment } from '@/server/services/booking';
import { listAppointments } from '@/server/db/queries/appointments';
import { toAppointmentResponse } from '@/server/services/mapper';
import { handleError, json } from '@/lib/api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = listAppointmentsQuerySchema.parse({
      date: searchParams.get('date') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    });

    const rows = await listAppointments(filters);
    return json(rows.map(toAppointmentResponse));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const input = createAppointmentSchema.parse(await request.json());
    const appointment = await createAppointment(input);
    return json(toAppointmentResponse(appointment), 201);
  } catch (err) {
    return handleError(err);
  }
}