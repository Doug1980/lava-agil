import { describe, expect, it } from 'vitest';
import { TZDate } from '@date-fns/tz';
import {
  computeEndsAt,
  getDayAvailability,
  zonedAt,
  type BookedRange,
} from '@/server/services/availability';
import { TIMEZONE } from '@/lib/constants';

/** Quinta, 23/07/2026, 08:00. Todas as datas de teste são posteriores. */
const NOW = TZDate.tz(TIMEZONE, 2026, 6, 23, 8, 0, 0, 0);

const FRIDAY = '2026-07-24';
const SATURDAY = '2026-07-25';
const SUNDAY = '2026-07-26';

function availability(
  date: string,
  durationMinutes: number,
  bookings: BookedRange[] = [],
  now: Date = NOW,
) {
  return getDayAvailability({ date, durationMinutes, bookings, now });
}

function slotAt(date: string, duration: number, time: string, bookings: BookedRange[] = []) {
  return availability(date, duration, bookings).slots.find((s) => s.time === time);
}

describe('jornada de trabalho', () => {
  it('domingo retorna fechado e sem slots', () => {
    const day = availability(SUNDAY, 30);
    expect(day.open).toBe(false);
    expect(day.slots).toHaveLength(0);
  });

  it('sexta abre 09:00 e fecha 18:00', () => {
    const day = availability(FRIDAY, 30);
    expect(day.open).toBe(true);
    expect(day.businessHours).toEqual({ start: '09:00', end: '18:00' });
    expect(day.slots[0].time).toBe('09:00');
    expect(day.slots.at(-1)?.time).toBe('17:45');
  });

  it('sábado usa jornada reduzida até 13:00', () => {
    const day = availability(SATURDAY, 30);
    expect(day.businessHours).toEqual({ start: '09:00', end: '13:00' });
    expect(day.slots.at(-1)?.time).toBe('12:45');
  });

  it('gera a grade de 15 em 15 minutos', () => {
    const times = availability(FRIDAY, 30).slots.slice(0, 4).map((s) => s.time);
    expect(times).toEqual(['09:00', '09:15', '09:30', '09:45']);
  });
});

describe('antecedência', () => {
  it('bloqueia horário que já passou', () => {
    const now = TZDate.tz(TIMEZONE, 2026, 6, 24, 14, 0, 0, 0);
    const slot = availability(FRIDAY, 30, [], now).slots.find((s) => s.time === '10:00');
    expect(slot).toMatchObject({ available: false, reason: 'past' });
  });

  it('bloqueia horário dentro da antecedência mínima de 60min', () => {
    const now = TZDate.tz(TIMEZONE, 2026, 6, 24, 10, 0, 0, 0);
    const day = availability(FRIDAY, 30, [], now);

    expect(day.slots.find((s) => s.time === '10:45')).toMatchObject({ reason: 'past' });
    expect(day.slots.find((s) => s.time === '11:00')).toMatchObject({ available: true });
  });
});

describe('fechamento', () => {
  it('aceita o atendimento que termina exatamente no fechamento', () => {
    // 16:00 + 115min = 17:55
    expect(slotAt(FRIDAY, 115, '16:00')).toMatchObject({ available: true });
  });

  it('bloqueia o atendimento que ultrapassaria o fechamento', () => {
    // 16:15 + 115min = 18:10
    expect(slotAt(FRIDAY, 115, '16:15')).toMatchObject({
      available: false,
      reason: 'closing',
    });
  });

  it('duração maior reduz o número de horários disponíveis', () => {
    const curta = availability(FRIDAY, 20).slots.filter((s) => s.available).length;
    const longa = availability(FRIDAY, 110).slots.filter((s) => s.available).length;
    expect(longa).toBeLessThan(curta);
  });
});

describe('ocupação', () => {
  const booking: BookedRange = {
    startsAt: zonedAt(FRIDAY, '14:00'),
    endsAt: computeEndsAt(zonedAt(FRIDAY, '14:00'), 115), // 14:00 → 16:05 com buffer
  };

  it('bloqueia horário sobreposto a um agendamento', () => {
    expect(slotAt(FRIDAY, 30, '15:00', [booking])).toMatchObject({
      available: false,
      reason: 'occupied',
    });
  });

  it('bloqueia horário cujo fim invade um agendamento', () => {
    // 13:45 + 30min + 10min buffer = 14:25, invade o início às 14:00
    expect(slotAt(FRIDAY, 30, '13:45', [booking])).toMatchObject({
      available: false,
      reason: 'occupied',
    });
  });

  it('respeita o buffer de 10min após o serviço', () => {
    // O box fica bloqueado até 16:05, então 16:00 ainda colide
    expect(slotAt(FRIDAY, 25, '16:00', [booking])).toMatchObject({
      available: false,
      reason: 'occupied',
    });
    expect(slotAt(FRIDAY, 25, '16:15', [booking])).toMatchObject({ available: true });
  });

  it('libera todos os horários que cabem quando não há agendamentos ativos', () => {
    // Cancelados são filtrados na consulta e nunca chegam aqui
    const day = availability(FRIDAY, 30, []);
    const bloqueados = day.slots.filter((s) => !s.available);

    expect(bloqueados.every((s) => s.reason === 'closing')).toBe(true);
    expect(day.slots.find((s) => s.time === '14:00')).toMatchObject({ available: true });
  });
});