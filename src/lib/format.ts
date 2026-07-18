import { TZDate } from '@date-fns/tz';
import { TIMEZONE } from './constants';

export function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

/** Sempre no fuso do estabelecimento, nunca no do navegador. Ver ADR-007. */
export function formatDateTime(iso: string): string {
  const d = new TZDate(iso, TIMEZONE);
  const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  return `${date} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatTimeRange(startIso: string, minutes: number): string {
  const start = new TZDate(startIso, TIMEZONE);
  const end = new Date(start.getTime() + minutes * 60_000);
  const endZoned = new TZDate(end, TIMEZONE);
  return `${pad(start.getHours())}:${pad(start.getMinutes())} às ${pad(endZoned.getHours())}:${pad(endZoned.getMinutes())}`;
}

/** yyyy-MM-dd no fuso do estabelecimento */
export function toDateKey(date: Date): string {
  const d = new TZDate(date, TIMEZONE);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatLongDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function maskPlate(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 7);
}

export function unmaskDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
