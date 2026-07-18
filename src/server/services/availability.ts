import { TZDate } from '@date-fns/tz';
import { addMinutes } from 'date-fns';
import {
  BUFFER_MINUTES,
  BUSINESS_HOURS,
  MIN_ADVANCE_MINUTES,
  SLOT_GRANULARITY_MINUTES,
  TIMEZONE,
} from '@/lib/constants';
import { BusinessRuleError } from './errors';

export type SlotReason = 'past' | 'closing' | 'occupied';

export type Slot = {
  time: string;
  available: boolean;
  reason?: SlotReason;
};

export type BookedRange = {
  startsAt: Date;
  endsAt: Date;
};

export type DayAvailability = {
  date: string;
  open: boolean;
  businessHours: { start: string; end: string } | null;
  slots: Slot[];
};

export type AvailabilityInput = {
  /** yyyy-MM-dd no fuso do estabelecimento */
  date: string;
  /** duração dos serviços, sem o buffer */
  durationMinutes: number;
  /** agendamentos não cancelados que intersectam o dia */
  bookings: BookedRange[];
  now: Date;
};

const MINUTE = 60_000;

/** Constrói um instante no fuso do estabelecimento, nunca no fuso do ambiente. */
export function zonedAt(date: string, time: string): TZDate {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return TZDate.tz(TIMEZONE, year, month - 1, day, hour, minute, 0, 0);
}

function formatTime(d: TZDate): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/** O intervalo que o box fica bloqueado: serviço + buffer operacional. */
export function computeEndsAt(startsAt: Date, serviceMinutes: number): Date {
  return new Date(startsAt.getTime() + (serviceMinutes + BUFFER_MINUTES) * MINUTE);
}

export function getDayAvailability({
  date,
  durationMinutes,
  bookings,
  now,
}: AvailabilityInput): DayAvailability {
  const dayOfWeek = zonedAt(date, '00:00').getDay();
  const hours = BUSINESS_HOURS[dayOfWeek];

  if (!hours) {
    return { date, open: false, businessHours: null, slots: [] };
  }

  const openAt = zonedAt(date, hours.start);
  const closeAt = zonedAt(date, hours.end).getTime();
  const earliest = now.getTime() + MIN_ADVANCE_MINUTES * MINUTE;

  const slots: Slot[] = [];

  for (
    let cursor = openAt;
    cursor.getTime() < closeAt;
    cursor = addMinutes(cursor, SLOT_GRANULARITY_MINUTES)
  ) {
    const time = formatTime(cursor);
    const start = cursor.getTime();
    const serviceEnd = start + durationMinutes * MINUTE;
    const blockEnd = serviceEnd + BUFFER_MINUTES * MINUTE;

    if (start < earliest) {
      slots.push({ time, available: false, reason: 'past' });
      continue;
    }

    if (serviceEnd > closeAt) {
      slots.push({ time, available: false, reason: 'closing' });
      continue;
    }

    const busy = bookings.some((b) =>
      overlaps(start, blockEnd, b.startsAt.getTime(), b.endsAt.getTime()),
    );

    if (busy) {
      slots.push({ time, available: false, reason: 'occupied' });
      continue;
    }

    slots.push({ time, available: true });
  }

  return { date, open: true, businessHours: hours, slots };
}

/** Validação server-side na criação. A grade é UX, isto é regra. */
export function assertBookable(input: AvailabilityInput & { startsAt: Date }): void {
  const { startsAt } = input;
  const day = getDayAvailability(input);

  if (!day.open) {
    throw new BusinessRuleError('CLOSED', 'O estabelecimento não abre nessa data.');
  }

  const time = formatTime(new TZDate(startsAt, TIMEZONE));
  const slot = day.slots.find((s) => s.time === time);

  if (!slot) {
    throw new BusinessRuleError('INVALID_SLOT', 'Horário fora da grade de atendimento.');
  }

  if (!slot.available) {
    const messages: Record<SlotReason, string> = {
      past: 'Esse horário já passou ou está dentro da antecedência mínima.',
      closing: 'O atendimento não caberia antes do fechamento.',
      occupied: 'Esse horário já está ocupado.',
    };
    throw new BusinessRuleError('SLOT_UNAVAILABLE', messages[slot.reason!]);
  }
}
