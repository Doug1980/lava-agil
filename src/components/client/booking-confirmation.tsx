'use client';

import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Car, CheckCircle2, Clock, Wallet } from 'lucide-react';
import Link from 'next/link';
import { TIMEZONE } from '@/lib/constants';
import { formatCurrency, formatDuration } from '@/lib/format';
import type { Appointment, VehicleSize } from '@/types/api';

const SIZE_LABEL: Record<VehicleSize, string> = {
  hatch: 'Hatch',
  sedan: 'Sedan',
  suv: 'SUV / Picape',
};

// Formatação local de data/hora. Se o format.ts já expõe um formatador
// no fuso do estabelecimento (ADR-007), troque estas linhas por ele.
const zoned = (iso: string) => new TZDate(new Date(iso), TIMEZONE);

type Props = {
  appointment: Appointment;
  onReset: () => void;
};

export function BookingConfirmation({ appointment, onReset }: Props) {
  const start = zoned(appointment.startsAt);
  const rawDay = format(start, "EEEE, d 'de' MMMM", { locale: ptBR });
  const day = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
  const startTime = format(start, 'HH:mm');
  const endTime = format(zoned(appointment.endsAt), 'HH:mm');

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span
          className="flex size-16 items-center justify-center rounded-full text-white shadow-lg shadow-primary/30"
          style={{ backgroundImage: 'linear-gradient(135deg, #0352d8, #1993e5)' }}
        >
          <CheckCircle2 className="size-9" aria-hidden />
        </span>
        <h2 className="text-2xl font-bold">Agendamento confirmado</h2>
        <p className="text-sm text-muted-foreground">
          Guarde o código{' '}
          <span className="font-mono font-semibold tracking-wide text-foreground">
            {appointment.code}
          </span>
        </p>
      </div>

      <div className="space-y-4 rounded-lg border p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm">{day}</span>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {appointment.statusLabel}
          </span>
        </div>

        <p className="text-2xl font-semibold tabular-nums">
          {startTime}{' '}
          <span className="text-base font-normal text-muted-foreground">às {endTime}</span>
        </p>

        <div className="flex items-center gap-2 border-t pt-3 text-sm">
          <Car className="size-4 text-muted-foreground" aria-hidden />
          <span>
            {appointment.vehicle.model} · {appointment.vehicle.plate} ·{' '}
            {SIZE_LABEL[appointment.vehicle.size]}
          </span>
        </div>

        <ul className="space-y-1 border-t pt-3">
          {appointment.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{item.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatDuration(item.durationMinutes)} · {formatCurrency(item.priceCents)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="flex items-center gap-1.5 text-sm">
            <Clock className="size-4 text-muted-foreground" aria-hidden />
            <span className="font-medium tabular-nums">
              {formatDuration(appointment.serviceMinutes)}
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <Wallet className="size-4 text-muted-foreground" aria-hidden />
            <span className="font-medium tabular-nums">
              {formatCurrency(appointment.totalPriceCents)}
            </span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/meus-agendamentos"
          className="flex-1 rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Ver meus agendamentos
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="flex-1 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Novo agendamento
        </button>
      </div>
    </div>
  );
}
