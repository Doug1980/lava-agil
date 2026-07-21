'use client';

import {
  Ban,
  Car,
  Check,
  ChevronDown,
  CircleCheck,
  Clock,
  Loader2,
  Mail,
  Phone,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { NoticeDialog } from '@/components/admin/notice-dialog';
import { ReasonDialog } from '@/components/admin/reason-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  useDeleteAppointment,
  useRestoreAppointment,
  useToggleItem,
  useUpdateStatus,
} from '@/hooks/use-appointments';
import { ApiClientError } from '@/lib/api-client';
import { STATUS_LABELS, TIMEZONE } from '@/lib/constants';
import { formatCurrency, formatDuration, formatTimeRange, maskPhone } from '@/lib/format';
import { nextTransitions } from '@/lib/status';
import { STATUS_BADGE } from '@/lib/status-ui';
import { cn } from '@/lib/utils';
import type { Appointment, AppointmentStatus } from '@/types/api';

const CANCEL_PRESETS = [
  'Cliente desistiu',
  'Não compareceu',
  'Remarcado',
  'Clima',
  'Outro',
] as const;
const DELETE_PRESETS = [
  'Duplicado',
  'Lançamento de teste',
  'Engano',
  'A pedido do cliente',
  'Outro',
] as const;

type Props = {
  appointment: Appointment;
  /** Mostra a data no card (útil na visão de mês, com dias variados). */
  showDate?: boolean;
  /** Modo lixeira: exibe o motivo da exclusão e o botão Restaurar. */
  trashView?: boolean;
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

/** Data + hora "21/07 14:30" para o registro de exclusão. */
function formatDeletedAt(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  });
}

/** Texto do diálogo de confirmação por status de destino (não destrutivo). */
const CONFIRM_COPY: Partial<Record<AppointmentStatus, { title: string; label: string }>> = {
  confirmed: { title: 'Confirmar agendamento?', label: 'Confirmar' },
  completed: { title: 'Concluir atendimento?', label: 'Concluir' },
};

/** Ordem do fluxo mostrada no dropdown. */
const STATUS_FLOW: AppointmentStatus[] = ['scheduled', 'confirmed', 'completed', 'cancelled'];

const STATUS_MENU_ICON: Record<AppointmentStatus, typeof Clock> = {
  scheduled: Clock,
  confirmed: CircleCheck,
  completed: Check,
  cancelled: Ban,
};

/**
 * Valida a troca respeitando o fluxo. Retorna null se permitida, ou a mensagem
 * de orientação a exibir quando o usuário tenta pular etapas.
 */
function transitionGuard(from: AppointmentStatus, to: AppointmentStatus): string | null {
  if (nextTransitions(from).includes(to)) return null;
  if (from === 'scheduled' && to === 'completed') {
    return 'É necessário confirmar primeiro o agendamento para seguir com o status "Concluído".';
  }
  if (to === 'scheduled') return 'Não é possível voltar para o status "Agendado".';
  if (from === 'completed') return 'O atendimento já foi concluído.';
  if (from === 'cancelled') return 'O agendamento está cancelado.';
  return 'Essa mudança de status não é permitida.';
}

export function AppointmentCard({ appointment, showDate = false, trashView = false }: Props) {
  const updateStatus = useUpdateStatus();
  const toggleItem = useToggleItem();
  const deleteAppointment = useDeleteAppointment();
  const restoreAppointment = useRestoreAppointment();
  const [pendingTo, setPendingTo] = useState<AppointmentStatus | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Status de destino aguardando confirmação (não destrutivo).
  const [confirmTo, setConfirmTo] = useState<AppointmentStatus | null>(null);
  // Mensagem de aviso (fluxo pulado) exibida num modal com botão OK.
  const [notice, setNotice] = useState<string | null>(null);

  const transitions = nextTransitions(appointment.status);

  // "A cobrar" = soma só dos itens marcados (feitos). Item desmarcado não entra.
  const chargedCents = appointment.items.reduce(
    (acc, item) => acc + (item.completed ? item.priceCents : 0),
    0,
  );

  // Concluído: mostra só os itens feitos (os desistidos somem). Em andamento, todos.
  const visibleItems =
    appointment.status === 'completed'
      ? appointment.items.filter((item) => item.completed)
      : appointment.items;

  // Itens só são editáveis enquanto o atendimento está em andamento.
  const readOnlyItems =
    trashView || appointment.status === 'completed' || appointment.status === 'cancelled';

  // Ao escolher um status no menu: valida o fluxo; se pular etapa, orienta com mensagem.
  function handlePickStatus(to: AppointmentStatus) {
    setMenuOpen(false);
    if (to === appointment.status) return;

    const guard = transitionGuard(appointment.status, to);
    if (guard) {
      setNotice(guard);
      return;
    }

    if (to === 'cancelled') {
      setCancelOpen(true);
    } else {
      setConfirmTo(to);
    }
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
          } else {
            toast.success('Status atualizado.');
            setConfirmTo(null);
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

  function runDelete(reason: string) {
    deleteAppointment.mutate(
      { id: appointment.id, reason },
      {
        onSuccess: () => {
          toast.success('Agendamento excluído.');
          setDeleteOpen(false);
        },
        onError: (err) => {
          const msg =
            err instanceof ApiClientError ? err.message : 'Não foi possível excluir o agendamento.';
          toast.error(msg);
        },
      },
    );
  }

  function handleRestore() {
    restoreAppointment.mutate(appointment.id, {
      onSuccess: () => toast.success('Agendamento restaurado.'),
      onError: (err) => {
        // A API devolve mensagem clara se o horário já tiver sido reservado.
        const msg =
          err instanceof ApiClientError ? err.message : 'Não foi possível restaurar o agendamento.';
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
            <p className="mt-1 truncate text-xl font-medium text-foreground">
              {appointment.customer.name}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {!trashView && transitions.length > 0 ? (
              <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    title="Alterar status"
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80',
                      STATUS_BADGE[appointment.status],
                    )}
                  >
                    {appointment.statusLabel}
                    <ChevronDown className="size-3" aria-hidden />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 p-1">
                  <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Fluxo do atendimento
                  </p>
                  {STATUS_FLOW.map((s) => {
                    const isCurrent = s === appointment.status;
                    const Icon = STATUS_MENU_ICON[s];
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={isCurrent}
                        onClick={() => handlePickStatus(s)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                          isCurrent
                            ? 'text-muted-foreground'
                            : s === 'cancelled'
                              ? 'text-destructive hover:bg-destructive/10'
                              : 'hover:bg-muted',
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                        {STATUS_LABELS[s]}
                        {isCurrent && (
                          <span className="ml-auto text-[10px] font-medium uppercase tracking-wide">
                            atual
                          </span>
                        )}
                      </button>
                    );
                  })}
                </PopoverContent>
              </Popover>
            ) : (
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xl font-medium',
                  STATUS_BADGE[appointment.status],
                )}
              >
                {appointment.statusLabel}
              </span>
            )}
            <span className="font-mono text-[22px] tracking-wide text-muted-foreground">
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
          {appointment.customer.email && (
            <p className="flex items-center gap-2">
              <Mail className="size-4" aria-hidden />
              <span className="truncate">{appointment.customer.email}</span>
            </p>
          )}
        </div>

        {!trashView && appointment.status === 'cancelled' && appointment.cancelReason && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <Ban className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <span className="font-medium">Motivo:</span> {appointment.cancelReason}
            </span>
          </div>
        )}

        {trashView && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <Trash2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <span className="font-medium">Excluído</span>
              {appointment.deletedAt && ` em ${formatDeletedAt(appointment.deletedAt)}`}
              {appointment.deleteReason && ` — ${appointment.deleteReason}`}
            </span>
          </div>
        )}

        <ul className="space-y-1 border-t pt-3">
          {visibleItems.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <label className="flex min-w-0 items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.completed}
                  disabled={toggleItem.isPending || readOnlyItems}
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
                  className={cn(
                    'truncate',
                    item.completed ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
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
          {trashView ? (
            <span className="text-base font-bold tabular-nums text-primary">
              {formatCurrency(appointment.totalPriceCents)}
            </span>
          ) : (
            <div className="leading-tight">
              <p className="text-[11px] text-muted-foreground">
                Agendado:{' '}
                <span className="tabular-nums">{formatCurrency(appointment.totalPriceCents)}</span>
              </p>
              <p className="flex items-baseline gap-1.5">
                <span className="text-xs text-muted-foreground">A cobrar</span>
                <span className="text-lg font-bold tabular-nums text-primary">
                  {formatCurrency(chargedCents)}
                </span>
              </p>
            </div>
          )}

          {trashView ? (
            <button
              type="button"
              onClick={handleRestore}
              disabled={restoreAppointment.isPending}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border border-primary/40 px-3 py-1.5 text-sm font-medium text-primary transition-colors',
                'hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:pointer-events-none disabled:opacity-60',
              )}
            >
              {restoreAppointment.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <RotateCcw className="size-4" aria-hidden />
              )}
              Restaurar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
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
          )}
        </div>
      </div>

      <ReasonDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancelar agendamento?"
        description={
          <>
            O horário de{' '}
            <span className="font-medium text-foreground">{appointment.customer.name}</span> será
            liberado. Informe o motivo — ele fica registrado no histórico.
          </>
        }
        presets={CANCEL_PRESETS}
        confirmLabel="Sim, cancelar"
        pending={pendingTo === 'cancelled'}
        onConfirm={(reason) => runTransition('cancelled', reason)}
      />

      <ReasonDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir agendamento?"
        description={
          <>
            O agendamento <span className="font-medium text-foreground">{appointment.code}</span> de{' '}
            <span className="font-medium text-foreground">{appointment.customer.name}</span> sairá
            das listas. Ele fica guardado e pode ser recuperado. Informe o motivo.
          </>
        }
        presets={DELETE_PRESETS}
        confirmLabel="Sim, excluir"
        pending={deleteAppointment.isPending}
        onConfirm={(reason) => runDelete(reason)}
      />

      <ConfirmDialog
        open={confirmTo !== null}
        onOpenChange={(o) => {
          if (!o) setConfirmTo(null);
        }}
        title={(confirmTo && CONFIRM_COPY[confirmTo]?.title) || 'Alterar status?'}
        description={
          <>
            O atendimento de{' '}
            <span className="font-medium text-foreground">{appointment.customer.name}</span> será
            marcado como{' '}
            <span className="font-medium text-foreground">
              {confirmTo ? STATUS_LABELS[confirmTo].toLowerCase() : ''}
            </span>
            .
          </>
        }
        confirmLabel={(confirmTo && CONFIRM_COPY[confirmTo]?.label) || 'Confirmar'}
        icon={
          confirmTo === 'completed' ? (
            <Check className="size-5" aria-hidden />
          ) : (
            <CircleCheck className="size-5" aria-hidden />
          )
        }
        pending={pendingTo === confirmTo}
        onConfirm={() => confirmTo && runTransition(confirmTo)}
      />

      <NoticeDialog
        open={notice !== null}
        onOpenChange={(o) => {
          if (!o) setNotice(null);
        }}
        message={notice ?? ''}
      />
    </>
  );
}
