export const TIMEZONE = 'America/Sao_Paulo';

export const SLOT_GRANULARITY_MINUTES = 15;

export const BUFFER_MINUTES = 10;

export const MIN_ADVANCE_MINUTES = 60;

export const MAX_ADVANCE_DAYS = 60;

type BusinessHours = { start: string; end: string } | null;

/** 0 = domingo, 6 = sábado */
export const BUSINESS_HOURS: Record<number, BusinessHours> = {
  0: { start: '09:00', end: '18:00' },
  1: null,
  2: { start: '09:00', end: '18:00' },
  3: { start: '09:00', end: '18:00' },
  4: { start: '09:00', end: '18:00' },
  5: { start: '09:00', end: '18:00' },
  6: { start: '09:00', end: '13:00' },
};

export const VEHICLE_SIZE_LABELS = {
  hatch: 'Hatch',
  sedan: 'Sedan',
  suv: 'SUV / Picape',
} as const;

export const STATUS_LABELS = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
} as const;