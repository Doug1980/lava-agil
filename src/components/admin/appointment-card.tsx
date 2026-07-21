'use client';

import { Ban, Car, Clock, Loader2, Phone, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CancelDialog } from '@/components/admin/cancel-dialog';
import { useDeleteAppointment, useToggleItem, useUpdateStatus } from '@/hooks/use-appointments';
import { ApiClientError } from '@/lib/api-client';
import { TIMEZONE } from '@/lib/constants';
import { formatCurrency, formatDuration, formatTimeRange, maskPhone } from '@/lib/format';
import { nextTransitions } from '@/lib/status';
import { ACTION_LABEL, isDestructive, STATUS_BADGE } from '@/lib/status-ui';
import { cn } from '@/lib/utils';
import type { Appointment, AppointmentStatus } from '@/types/api';

type Props = {
  appointment: Appointment;
  /** Mostra a data no card (útil na visão de mês, com dias variados). */
  showDate?: boolean;
};

/** Data curta "21/07 · ter" no fuso do estabelecimento. */
function formatCardDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    weekday: 'short',
    timeZone: TIMEZONE,
  });
}

export function AppointmentCard({ appointment, showDate = false }: Props) {
  const updateStatus = useUpdateStatus();
  const toggleItem = useToggleItem();
  const deleteAppointment = useDeleteAppointment();
  const [pendingTo, setPendingTo] = useState<AppointmentStatus | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const transitions = nextTransitions(appointment.status);

  function handleTransition(to: AppointmentStatus) {
    // Cancelar abre o diálogo com motivo; demais transições vão direto.
    if (isDestructive(to)) {
      setCancelOpen(true);
      return;
    }
    runTransition(to);
  }

  function runTransition(to: AppointmentStatus, reason?: string) {
    setPendingTo(to);
    updateStatus.mutate(
      { id: appointment.id, status: to, reason },
      {
        onSuccess: () => {
          if (to === 'cancelled') {
            toast.success('Agendamento cancelado.');
            setCancelOpen(false);
          }
        },
        onError: (err) => {
          const msg =
            err instanceof ApiClientError ? err.message : 'Não foi possível mudar o status.';
          toast.error(msg);
        },
        onSettled: () => setPendingTo(null),
      },
    );
  }

  function handleDelete() {
    const ok = window.confirm(
      `Excluir permanentemente o agendamento ${appointment.code} de ${appointment.customer.name}? Esta ação não pode ser desfeita.`,
    );
    if (!ok) return;

    deleteAppointment.mutate(appointment.id, {
      onSuccess: () => toast.success('Agendamento excluído.'),
      onError: (err) => {
        const msg =
          err instanceof ApiClientError ? err.message : 'Não foi possível excluir o agendamento.';
        toast.error(msg);
      },
    });
  }

  return (
    <>
    <div className="space-y-3 rounded-xl border bg-card p-4 shadow-md shadow-primary/5 transition-shadow hover:shadow-lg hover:shadow-primary/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {showDate && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {formatCardDate(appointment.startsAt)}
            </p>
          )}
          <p className="flex items-center gap-2 text-sm font-medium">
            <Clock className="size-4 text-primary" aria-hidden />
            <span className="tabular-nums">
              {formatTimeRange(appointment.startsAt, appointment.serviceMinutes)}
            </span>
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {appointment.customer.name}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              STATUS_BADGE[appointment.status],
            )}
          >
            {appointment.statusLabel}
          </span>
          <span className="font-mono text-[11px] tracking-wide text-muted-foreground">
            {appointment.code}
          </span>
        </div>
      </div>

      <div className="space-y-1 border-t pt-3 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Car className="size-4" aria-hidden />
          {appointment.vehicle.model} · {appointment.vehicle.plate}
        </p>
        <p className="flex items-center gap-2">
          <Phone className="size-4" aria-hidden />
          {maskPhone(appointment.customer.phone)}
        </p>
      </div>

      {appointment.status === 'cancelled' && appointment.cancelReason && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <Ban className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <span className="font-medium">Motivo:</span> {appointment.cancelReason}
          </span>
        </div>
      )}

      <ul className="space-y-1 border-t pt-3">
        {appointment.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
            <label className="flex min-w-0 items-center gap-2">
              <input
                type="checkbox"
                checked={item.completed}
                disabled={toggleItem.isPending}
                onChange={(e) =>
                  toggleItem.mutate({
                    appointmentId: appointment.id,
                    itemId: item.id,
                    completed: e.target.checked,
                  })
                }
                className="size-4 shrink-0 accent-primary"
              />
              <span
                className={cn('truncate', item.completed && 'text-muted-foreground line-through')}
              >
                {item.name}
              </span>
            </label>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatDuration(item.durationMinutes)} · {formatCurrency(item.priceCents)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t pt-3">
        <span className="text-base font-bold tabular-nums text-primary">
          {formatCurrency(appointment.totalPriceCents)}
        </span>

        <div className="flex items-center gap-2">
          {transitions.map((to) => (
            <button
              key={to}
              type="button"
              disabled={updateStatus.isPending}
              onClick={() => handleTransition(to)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:pointer-events-none disabled:opacity-60',
                isDestructive(to)
                  ? 'border-destructive/40 text-destructive hover:bg-destructive/10'
                  : 'border-primary/40 text-primary hover:bg-primary/10',
              )}
            >
              {pendingTo === to && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              {ACTION_LABEL[to]}
            </button>
          ))}

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteAppointment.isPending}
            aria-label={`Excluir agendamento ${appointment.code}`}
            title="Excluir"
            className={cn(
              'flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors',
              'hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:pointer-events-none disabled:opacity-60',
            )}
          >
            {deleteAppointment.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </div>

    <CancelDialog
      open={cancelOpen}
      onOpenChange={setCancelOpen}
      customerName={appointment.customer.name}
      pending={pendingTo === 'cancelled'}
      onConfirm={(reason) => runTransition('cancelled', reason)}
    />
    </>
  );
}
