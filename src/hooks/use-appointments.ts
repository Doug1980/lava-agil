'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { Appointment, AppointmentStatus } from '@/types/api';

type Filters = {
  date?: string;
  status?: AppointmentStatus;
  period?: 'day' | 'month';
  scope?: 'active' | 'deleted' | 'all';
};

function buildQuery(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.date) params.set('date', filters.date);
  if (filters.status) params.set('status', filters.status);
  if (filters.period) params.set('period', filters.period);
  if (filters.scope && filters.scope !== 'active') params.set('scope', filters.scope);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useAppointments(filters: Filters) {
  return useQuery({
    queryKey: [
      'appointments',
      filters.date ?? null,
      filters.status ?? null,
      filters.period ?? 'day',
      filters.scope ?? 'active',
    ],
    queryFn: () => apiFetch<Appointment[]>(`/api/appointments${buildQuery(filters)}`),
    staleTime: 10_000,
    // Atualização automática: reflete novos agendamentos e mudanças sem recarregar.
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

export function useRestoreAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<Appointment>(`/api/appointments/${id}/restore`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: AppointmentStatus;
      reason?: string;
    }) =>
      apiFetch<Appointment>(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useToggleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      appointmentId,
      itemId,
      completed,
    }: {
      appointmentId: string;
      itemId: string;
      completed: boolean;
    }) =>
      apiFetch<{ id: string; completed: boolean }>(
        `/api/appointments/${appointmentId}/items/${itemId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ completed }),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiFetch<void>(`/api/appointments/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}
