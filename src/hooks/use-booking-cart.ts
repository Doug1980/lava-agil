'use client';

import { useCallback, useMemo, useState } from 'react';
import type { CatalogEntry, VehicleSize } from '@/types/api';

export type CartState = {
  vehicleSize: VehicleSize | null;
  base: CatalogEntry | null;
  addons: CatalogEntry[];
};

export function useBookingCart() {
  const [vehicleSize, setVehicleSizeState] = useState<VehicleSize | null>(null);
  const [base, setBase] = useState<CatalogEntry | null>(null);
  const [addons, setAddons] = useState<CatalogEntry[]>([]);
  // "Não desejo nenhum adicional" selecionado explicitamente.
  const [noAddons, setNoAddons] = useState(false);
  // Latch: o passo de adicionais foi resolvido (escolheu ≥1 ou "nenhum").
  // Fica true para a Data não sumir se o usuário mexer depois.
  const [addonsResolved, setAddonsResolved] = useState(false);

  /** Trocar o porte invalida a seleção: os variantIds pertencem ao porte anterior. */
  const setVehicleSize = useCallback((size: VehicleSize) => {
    setVehicleSizeState((current) => {
      if (current !== size) {
        setBase(null);
        setAddons([]);
        setNoAddons(false);
        setAddonsResolved(false);
      }
      return size;
    });
  }, []);

  const toggleAddon = useCallback((entry: CatalogEntry) => {
    // Marcar um adicional exclui o "não desejo" e resolve o passo.
    setNoAddons(false);
    setAddonsResolved(true);
    setAddons((current) =>
      current.some((a) => a.variantId === entry.variantId)
        ? current.filter((a) => a.variantId !== entry.variantId)
        : [...current, entry],
    );
  }, []);

  /** "Não desejo nenhum adicional": limpa adicionais e resolve o passo. */
  const chooseNoAddons = useCallback(() => {
    setAddons([]);
    setNoAddons(true);
    setAddonsResolved(true);
  }, []);

  const clear = useCallback(() => {
    setBase(null);
    setAddons([]);
    setNoAddons(false);
    setAddonsResolved(false);
  }, []);

  const items = useMemo(() => (base ? [base, ...addons] : addons), [base, addons]);

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => ({
          durationMinutes: acc.durationMinutes + item.durationMinutes,
          priceCents: acc.priceCents + item.priceCents,
        }),
        { durationMinutes: 0, priceCents: 0 },
      ),
    [items],
  );

  const isAddonSelected = useCallback(
    (variantId: string) => addons.some((a) => a.variantId === variantId),
    [addons],
  );

  return {
    vehicleSize,
    base,
    addons,
    noAddons,
    addonsResolved,
    items,
    totals,
    setVehicleSize,
    setBase,
    toggleAddon,
    chooseNoAddons,
    isAddonSelected,
    clear,
    variantIds: items.map((i) => i.variantId),
    isValid: base !== null,
  };
}
