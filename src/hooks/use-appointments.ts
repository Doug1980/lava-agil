'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { Appointment, AppointmentStatus } from '@/types/api';

type Filters = {
  date?: string;
  status?: AppointmentStatus;
};

function buildQuery(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.date) params.set('date', filters.date);
  if (filters.status) params.set('status', filters.status);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useAppointments(filters: Filters) {
  return useQuery({
    queryKey: ['appointments', filters.date ?? null, filters.status ?? null],
    queryFn: () => apiFetch<Appointment[]>(`/api/appointments${buildQuery(filters)}`),
    staleTime: 15_000,
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      apiFetch<Appointment>(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
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
    mutationFn: (id: string) => apiFetch<void>(`/api/appointments/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}
