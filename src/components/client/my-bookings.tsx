'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarX, Car, Clock, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { formatDateTime, formatDuration } from '@/lib/format';
import { STATUS_BADGE } from '@/lib/status-ui';
import { cn } from '@/lib/utils';
import { useMyBookings } from '@/hooks/use-my-bookings';
import type { PublicAppointment } from '@/types/api';

export function MyBookings() {
  const { codes, addCode, removeCode } = useMyBookings();
  const [lookup, setLookup] = useState('');

  // Link do e-mail (`?code=LA-XXXXXX`): adiciona o código e funciona em qualquer
  // dispositivo, mesmo sem nada salvo neste navegador.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      addCode(code.toUpperCase());
      window.history.replaceState(null, '', '/meus-agendamentos');
    }
  }, [addCode]);

  const query = useQuery({
    queryKey: ['my-bookings', codes],
    queryFn: () =>
      apiFetch<PublicAppointment[]>(`/api/appointments/lookup?codes=${codes.join(',')}`),
    enabled: codes.length > 0,
    staleTime: 15_000,
  });

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const value = lookup.trim();
    if (value) addCode(value.toUpperCase());
    setLookup('');
  }

  const found = query.data ?? [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wide">Meus agendamentos</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe o status dos seus atendimentos. A lista fica salva neste navegador.
        </p>
      </header>

      <form onSubmit={handleLookup} className="mb-6 flex gap-2">
        <input
          value={lookup}
          onChange={(e) => setLookup(e.target.value)}
          placeholder="Consultar por código (ex: LA-ABC123)"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Consultar por código"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Search className="size-4" aria-hidden />
          Consultar
        </button>
      </form>

      {codes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center">
          <CalendarX className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Você ainda não tem agendamentos salvos aqui.
          </p>
        </div>
      ) : query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={`sk-${i}`} className="h-28 animate-pulse rounded-lg border bg-muted/40" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map((code) => {
            const appt = found.find((a) => a.code === code);

            if (!appt) {
              return (
                <div
                  key={code}
                  className="flex items-center justify-between rounded-lg border border-dashed p-4 text-sm text-muted-foreground"
                >
                  <span>
                    <span className="font-mono font-medium text-foreground">{code}</span> · não
                    encontrado
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCode(code)}
                    className="rounded-md p-1.5 hover:bg-muted"
                    aria-label="Remover"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              );
            }

            return (
              <article
                key={code}
                className="rounded-2xl border bg-card p-4 shadow-sm shadow-primary/5"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{appt.code}</p>
                    <p className="font-medium">{appt.customerName}</p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                      STATUS_BADGE[appt.status],
                    )}
                  >
                    {appt.statusLabel}
                  </span>
                </div>

                <p className="text-sm tabular-nums">{formatDateTime(appt.startsAt)}</p>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Car className="size-4" aria-hidden />
                    {appt.vehicleModel}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" aria-hidden />
                    {formatDuration(appt.serviceMinutes)}
                  </span>
                </div>

                <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">
                  {appt.items.map((i) => i.name).join(' · ')}
                </p>

                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeCode(code)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Esquecer
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
