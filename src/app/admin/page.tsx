'use client';

import { CalendarDays, Inbox, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { AppointmentCard } from '@/components/admin/appointment-card';
import { useAppointments } from '@/hooks/use-appointments';
import { STATUS_LABELS } from '@/lib/constants';
import { formatLongDate, toDateKey } from '@/lib/format';
import type { AppointmentStatus } from '@/types/api';

const STATUS_OPTIONS: (AppointmentStatus | 'all')[] = [
  'all',
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
];

export default function AdminPage() {
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [status, setStatus] = useState<AppointmentStatus | 'all'>('all');

  const query = useAppointments({
    date,
    status: status === 'all' ? undefined : status,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Agendamentos</h1>
        <p className="text-sm capitalize text-muted-foreground">{formatLongDate(date)}</p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((opt) => {
            const active = status === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setStatus(opt)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-muted-foreground/40'
                }`}
              >
                {opt === 'all' ? 'Todos' : STATUS_LABELS[opt]}
              </button>
            );
          })}
        </div>
      </div>

      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`sk-${i}`} className="h-40 animate-pulse rounded-lg border bg-muted/40" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center">
          <TriangleAlert className="size-6 text-destructive" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar os agendamentos.
          </p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Tentar de novo
          </button>
        </div>
      ) : query.data && query.data.length > 0 ? (
        <div className="space-y-3">
          {query.data.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center">
          <Inbox className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Nenhum agendamento para este filtro.</p>
        </div>
      )}
    </main>
  );
}
