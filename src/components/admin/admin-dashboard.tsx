'use client';

import {
  CalendarDays,
  CheckCircle2,
  Inbox,
  Search,
  Trash2,
  TriangleAlert,
  Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppointmentCard } from '@/components/admin/appointment-card';
import { useAppointments } from '@/hooks/use-appointments';
import { formatCurrency, formatLongDate, toDateKey } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AppointmentStatus } from '@/types/api';

type StatusFilter = AppointmentStatus | 'all' | 'deleted';

const STATUS_OPTIONS: StatusFilter[] = [
  'all',
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'deleted',
];

const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  all: 'Todos',
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  deleted: 'Excluídos',
};

/** Rótulo "Mês de Ano" a partir da data (ex.: "Julho de 2026"). */
function monthLabel(dateKey: string): string {
  const label = new Date(`${dateKey}T12:00:00`).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function AdminDashboard() {
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [status, setStatus] = useState<StatusFilter>('all');
  const [period, setPeriod] = useState<'day' | 'month'>('day');
  const [search, setSearch] = useState('');

  const isTrash = status === 'deleted';
  // "Todos" traz ativos + excluídos; a lixeira só excluídos; status específico só ativos.
  const scope = status === 'all' ? 'all' : status === 'deleted' ? 'deleted' : 'active';

  const query = useAppointments({
    date,
    status: status === 'all' || status === 'deleted' ? undefined : status,
    period,
    scope,
  });

  // Contador de novos agendamentos pendentes (status "Agendado") no período atual.
  const scheduledQuery = useAppointments({ date, status: 'scheduled', period, scope: 'active' });
  const newCount = scheduledQuery.data?.length ?? 0;

  // Busca client-side por nome do cliente ou código.
  const list = useMemo(() => {
    const rows = query.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (a) =>
        a.customer.name.toLowerCase().includes(term) || a.code.toLowerCase().includes(term),
    );
  }, [query.data, search]);

  // Resumo (só ativos; ignora excluídos sempre e cancelados no faturamento).
  const summary = useMemo(() => {
    const rows = (query.data ?? []).filter((a) => !a.deletedAt);
    const billable = rows.filter((a) => a.status !== 'cancelled');
    return {
      total: rows.length,
      revenueCents: billable.reduce((acc, a) => acc + a.totalPriceCents, 0),
      completed: rows.filter((a) => a.status === 'completed').length,
    };
  }, [query.data]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wide">Agendamentos</h1>
        <p className="text-sm text-muted-foreground">
          {period === 'month' ? monthLabel(date) : formatLongDate(date)}
        </p>
      </header>

      {!isTrash && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border bg-card p-4 shadow-md shadow-primary/5">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="size-3.5 text-primary" aria-hidden />
              Total
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{summary.total}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-md shadow-primary/5">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Wallet className="size-3.5 text-primary" aria-hidden />
              Faturamento
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatCurrency(summary.revenueCents)}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-md shadow-primary/5">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-primary" aria-hidden />
              Concluídos
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{summary.completed}</p>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex rounded-lg border bg-card p-0.5 shadow-sm">
          {(['day', 'month'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                period === p
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p === 'day' ? 'Dia' : 'Mês'}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-sm focus-visible:outline-none"
          />
        </label>

        <label className="flex flex-1 items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-sm focus-within:ring-2 focus-within:ring-ring">
          <Search className="size-4 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou código"
            className="w-full bg-transparent text-sm focus-visible:outline-none"
          />
        </label>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-1.5">
        {STATUS_OPTIONS.map((opt) => {
          const active = status === opt;
          const trash = opt === 'deleted';
          return (
            <div key={opt} className={cn('flex items-center gap-1.5', trash && 'ml-auto')}>
              {trash && <span className="mx-1 h-4 w-px bg-border" aria-hidden />}
              <button
                type="button"
                onClick={() => setStatus(opt)}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all',
                  active && trash
                    ? 'border-destructive bg-destructive text-white shadow-sm shadow-destructive/30'
                    : active
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                      : trash
                        ? 'border-border bg-card text-muted-foreground hover:border-destructive/50 hover:text-destructive'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
                )}
              >
                {trash && <Trash2 className="size-3.5" aria-hidden />}
                {STATUS_FILTER_LABEL[opt]}
                {opt === 'scheduled' && newCount > 0 && (
                  <span
                    className={cn(
                      'ml-1 flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none',
                      active ? 'bg-white text-primary' : 'bg-amber-500 text-white',
                    )}
                    title={`${newCount} agendamento(s) aguardando`}
                  >
                    {newCount}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className="h-40 animate-pulse rounded-xl border bg-card shadow-md shadow-primary/5"
            />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card/60 py-12 text-center">
          <TriangleAlert className="size-6 text-destructive" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar os agendamentos.
          </p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:border-primary/50"
          >
            Tentar de novo
          </button>
        </div>
      ) : list.length > 0 ? (
        <div className="space-y-3">
          {list.map((appointment, i) => (
            <div
              key={appointment.id}
              className="animate-rise"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <AppointmentCard
                appointment={appointment}
                showDate={period === 'month'}
                trashView={Boolean(appointment.deletedAt)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card/60 py-12 text-center">
          <Inbox className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            {search.trim()
              ? 'Nenhum agendamento corresponde à busca.'
              : isTrash
                ? 'A lixeira está vazia.'
                : 'Nenhum agendamento para este filtro.'}
          </p>
        </div>
      )}
    </main>
  );
}
