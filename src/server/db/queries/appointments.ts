import { and, asc, desc, eq, gt, inArray, isNotNull, isNull, lt, ne, sql } from 'drizzle-orm';
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
        isNull(appointments.deletedAt),
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
    where: and(inArray(appointments.code, codes), isNull(appointments.deletedAt)),
    with: { items: true },
    orderBy: [asc(appointments.startsAt)],
  });
}

export async function findAppointmentById(id: string) {
  const db = getDb();

  const appointment = await db.query.appointments.findFirst({
    where: and(eq(appointments.id, id), isNull(appointments.deletedAt)),
    with: { items: true },
  });

  return appointment ?? null;
}

export async function listAppointments(filters: {
  date?: string;
  status?: AppointmentStatus;
  period?: 'day' | 'month';
  scope?: 'active' | 'deleted' | 'all';
}) {
  const db = getDb();
  const scope = filters.scope ?? 'active';
  // active esconde excluídos · deleted mostra só a lixeira · all traz ambos.
  const conditions = [];
  if (scope === 'active') conditions.push(isNull(appointments.deletedAt));
  else if (scope === 'deleted') conditions.push(isNotNull(appointments.deletedAt));

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

  if (scope !== 'deleted' && filters.status) {
    conditions.push(eq(appointments.status, filters.status));
  }

  return db.query.appointments.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: { items: true },
    // Na lixeira, os mais recentemente excluídos primeiro; caso contrário, por horário.
    orderBy: scope === 'deleted' ? [desc(appointments.deletedAt)] : [asc(appointments.startsAt)],
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

/**
 * Exclusão "suave": marca o registro como excluído e guarda o motivo.
 * A linha some das listas mas continua no banco (recuperável) e libera o
 * horário — a constraint de exclusão temporal ignora `deleted_at IS NOT NULL`.
 */
export async function deleteAppointment(id: string, reason: string) {
  const db = getDb();
  const [row] = await db
    .update(appointments)
    .set({ deletedAt: sql`now()`, deleteReason: reason })
    .where(and(eq(appointments.id, id), isNull(appointments.deletedAt)))
    .returning();
  return row ?? null;
}

/** Código de erro do Postgres para violação de constraint de exclusão (overlap). */
export const OVERLAP_ERROR_CODE = '23P01';

/**
 * Restaura um agendamento excluído (zera deleted_at/motivo). Pode falhar com
 * OVERLAP_ERROR_CODE se o horário já tiver sido reservado por outro no meio-tempo
 * — nesse caso a constraint de agenda barra e o chamador deve tratar.
 */
export async function restoreAppointment(id: string) {
  const db = getDb();
  const [row] = await db
    .update(appointments)
    .set({ deletedAt: null, deleteReason: null })
    .where(and(eq(appointments.id, id), isNotNull(appointments.deletedAt)))
    .returning();
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
