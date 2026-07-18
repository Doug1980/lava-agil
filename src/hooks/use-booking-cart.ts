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

  /** Trocar o porte invalida a seleção: os variantIds pertencem ao porte anterior. */
  const setVehicleSize = useCallback((size: VehicleSize) => {
    setVehicleSizeState((current) => {
      if (current !== size) {
        setBase(null);
        setAddons([]);
      }
      return size;
    });
  }, []);

  const toggleAddon = useCallback((entry: CatalogEntry) => {
    setAddons((current) =>
      current.some((a) => a.variantId === entry.variantId)
        ? current.filter((a) => a.variantId !== entry.variantId)
        : [...current, entry],
    );
  }, []);

  const clear = useCallback(() => {
    setBase(null);
    setAddons([]);
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
    items,
    totals,
    setVehicleSize,
    setBase,
    toggleAddon,
    isAddonSelected,
    clear,
    variantIds: items.map((i) => i.variantId),
    isValid: base !== null,
  };
}