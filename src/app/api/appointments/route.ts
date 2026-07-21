import { handleError, json } from '@/lib/api';
import { requireAdmin } from '@/lib/firebase/require-admin';
import { createAppointmentSchema, listAppointmentsQuerySchema } from '@/lib/schemas/appointment';
import { listAppointments } from '@/server/db/queries/appointments';
import { createAppointment } from '@/server/services/booking';
import { sendBookingConfirmation } from '@/server/services/mailer';
import { toAppointmentResponse } from '@/server/services/mapper';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const filters = listAppointmentsQuerySchema.parse({
      date: searchParams.get('date') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      period: searchParams.get('period') ?? undefined,
      deleted: searchParams.get('deleted') ?? undefined,
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
    const response = toAppointmentResponse(appointment);

    // Comprovante por e-mail (opcional). Falha aqui não invalida o agendamento.
    if (response.customer.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
      try {
        await sendBookingConfirmation({
          to: response.customer.email,
          customerName: response.customer.name,
          code: response.code,
          startsAt: response.startsAt,
          serviceMinutes: response.serviceMinutes,
          totalPriceCents: response.totalPriceCents,
          items: response.items.map((i) => ({ name: i.name })),
          appUrl,
        });
      } catch (mailErr) {
        console.error('[api] e-mail de confirmação falhou:', mailErr);
      }
    }

    return json(response, 201);
  } catch (err) {
    return handleError(err);
  }
}
