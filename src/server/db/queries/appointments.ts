import { and, asc, eq, gt, inArray, lt, ne, sql } from 'drizzle-orm';
import type { AppointmentStatus } from '@/lib/schemas/appointment';
import { getDb } from '@/server/db';
import { appointmentItems, appointments } from '@/server/db/schema';
import type { BookedRange } from '@/server/services/availability';
import { zonedAt } from '@/server/services/availability';

/** Agendamentos ativos que intersectam o dia. Cancelados ficam de fora. */
export async function findActiveBookings(date: string): Promise<BookedRange[]> {
  const db = getDb();

  const dayStart = zonedAt(date, '00:00');
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  return db
    .select({ startsAt: appointments.startsAt, endsAt: appointments.endsAt })
    .from(appointments)
    .where(
      and(
        ne(appointments.status, 'cancelled'),
        lt(appointments.startsAt, dayEnd),
        gt(appointments.endsAt, dayStart),
      ),
    );
}

/** Busca pública por códigos (consulta anônima do cliente). */
export async function findAppointmentsByCodes(codes: string[]) {
  const db = getDb();
  if (codes.length === 0) return [];

  return db.query.appointments.findMany({
    where: inArray(appointments.code, codes),
    with: { items: true },
    orderBy: [asc(appointments.startsAt)],
  });
}

export async function findAppointmentById(id: string) {
  const db = getDb();

  const appointment = await db.query.appointments.findFirst({
    where: eq(appointments.id, id),
    with: { items: true },
  });

  return appointment ?? null;
}

export async function listAppointments(filters: {
  date?: string;
  status?: AppointmentStatus;
  period?: 'day' | 'month';
}) {
  const db = getDb();
  const conditions = [];

  if (filters.date) {
    if (filters.period === 'month') {
      // Intervalo do mês da data informada (fuso do estabelecimento).
      const [year, month] = filters.date.split('-').map(Number);
      const pad = (n: number) => String(n).padStart(2, '0');
      const nextYear = month === 12 ? year + 1 : year;
      const nextMonth = month === 12 ? 1 : month + 1;
      const monthStart = zonedAt(`${year}-${pad(month)}-01`, '00:00');
      const monthEnd = zonedAt(`${nextYear}-${pad(nextMonth)}-01`, '00:00');
      conditions.push(lt(appointments.startsAt, monthEnd), gt(appointments.endsAt, monthStart));
    } else {
      const dayStart = zonedAt(filters.date, '00:00');
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      conditions.push(lt(appointments.startsAt, dayEnd), gt(appointments.endsAt, dayStart));
    }
  }

  if (filters.status) {
    conditions.push(eq(appointments.status, filters.status));
  }

  return db.query.appointments.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: { items: true },
    orderBy: [asc(appointments.startsAt)],
  });
}

export async function updateStatus(id: string, status: AppointmentStatus, reason?: string) {
  const db = getDb();
  // Cancelar registra o motivo; qualquer outra transição limpa um motivo antigo.
  const cancelReason = status === 'cancelled' ? (reason ?? null) : null;
  const [row] = await db
    .update(appointments)
    .set({ status, cancelReason })
    .where(eq(appointments.id, id))
    .returning();
  return row ?? null;
}

export async function deleteAppointment(id: string) {
  const db = getDb();
  const [row] = await db.delete(appointments).where(eq(appointments.id, id)).returning();
  return row ?? null;
}

export async function toggleItemCompleted(itemId: string, completed: boolean) {
  const db = getDb();
  const [row] = await db
    .update(appointmentItems)
    .set({ completedAt: completed ? sql`now()` : null })
    .where(eq(appointmentItems.id, itemId))
    .returning();
  return row ?? null;
}
