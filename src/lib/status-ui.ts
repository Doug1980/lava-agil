import type { AppointmentStatus } from '@/types/api';

/** Rótulo do botão de ação para cada transição de destino. */
export const ACTION_LABEL: Record<AppointmentStatus, string> = {
  confirmed: 'Confirmar',
  completed: 'Concluir',
  cancelled: 'Cancelar',
  scheduled: 'Reagendar',
};

/** Classe do badge de status. Cores por estado. */
export const STATUS_BADGE: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  confirmed: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  completed: 'bg-green-500/10 text-green-600 dark:text-green-400',
  cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

/** Ações destrutivas pedem confirmação antes de executar. */
export function isDestructive(to: AppointmentStatus): boolean {
  return to === 'cancelled';
}
