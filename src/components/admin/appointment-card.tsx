'use client';

import { Car, Clock, Loader2, Phone } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useToggleItem, useUpdateStatus } from '@/hooks/use-appointments';
import { ApiClientError } from '@/lib/api-client';
import { formatCurrency, formatDuration, formatTimeRange, maskPhone } from '@/lib/format';
import { nextTransitions } from '@/lib/status';
import { ACTION_LABEL, isDestructive, STATUS_BADGE } from '@/lib/status-ui';
import { cn } from '@/lib/utils';
import type { Appointment, AppointmentStatus } from '@/types/api';

type Props = {
  appointment: Appointment;
};

export function AppointmentCard({ appointment }: Props) {
  const updateStatus = useUpdateStatus();
  const toggleItem = useToggleItem();
  const [pendingTo, setPendingTo] = useState<AppointmentStatus | null>(null);

  const transitions = nextTransitions(appointment.status);

  function handleTransition(to: AppointmentStatus) {
    if (isDestructive(to)) {
      const ok = window.confirm(
        `Cancelar o agendamento de ${appointment.customer.name}? Essa ação libera o horário.`,
      );
      if (!ok) return;
    }

    setPendingTo(to);
    updateStatus.mutate(
      { id: appointment.id, status: to },
      {
        onError: (err) => {
          const msg =
            err instanceof ApiClientError ? err.message : 'Não foi possível mudar o status.';
          toast.error(msg);
        },
        onSettled: () => setPendingTo(null),
      },
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Clock className="size-4 text-muted-foreground" aria-hidden />
            <span className="tabular-nums">
              {formatTimeRange(appointment.startsAt, appointment.serviceMinutes)}
            </span>
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{appointment.customer.name}</p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
            STATUS_BADGE[appointment.status],
          )}
        >
          {appointment.statusLabel}
        </span>
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
                className="size-4 shrink-0"
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
        <span className="text-sm font-medium tabular-nums">
          {formatCurrency(appointment.totalPriceCents)}
        </span>

        {transitions.length > 0 && (
          <div className="flex gap-2">
            {transitions.map((to) => (
              <button
                key={to}
                type="button"
                disabled={updateStatus.isPending}
                onClick={() => handleTransition(to)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
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
          </div>
        )}
      </div>
    </div>
  );
}
