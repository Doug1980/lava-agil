'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { Catalog, DayAvailability, VehicleSize } from '@/types/api';

export function useCatalog(vehicleSize: VehicleSize | null) {
  return useQuery({
    queryKey: ['catalog', vehicleSize],
    queryFn: () => apiFetch<Catalog>(`/api/services?vehicleSize=${vehicleSize}`),
    enabled: vehicleSize !== null,
    staleTime: 5 * 60_000,
  });
}

export function useAvailability(date: string | null, durationMinutes: number) {
  return useQuery({
    queryKey: ['availability', date, durationMinutes],
    queryFn: () =>
      apiFetch<DayAvailability>(
        `/api/availability?date=${date}&durationMinutes=${durationMinutes}`,
      ),
    enabled: date !== null && durationMinutes > 0,
    staleTime: 15_000,
  });
}
