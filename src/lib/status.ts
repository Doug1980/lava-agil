import type { AppointmentStatus } from '@/types/api';

/**
 * Espelho client-safe da máquina de transições do servidor.
 * O servidor (status.ts) valida de verdade; este lado só desenha os botões.
 * Se as regras mudarem, os dois arquivos mudam juntos. Duplicação de propósito.
 */
const TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  scheduled: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function nextTransitions(from: AppointmentStatus): readonly AppointmentStatus[] {
  return TRANSITIONS[from];
}
