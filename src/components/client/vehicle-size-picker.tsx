'use client';

import { Car, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VehicleSize } from '@/types/api';

const OPTIONS: { value: VehicleSize; label: string; hint: string; icon: typeof Car }[] = [
  { value: 'hatch', label: 'Hatch', hint: 'Argo, Onix, HB20', icon: Car },
  { value: 'sedan', label: 'Sedan', hint: 'Corolla, Civic, Virtus', icon: Car },
  { value: 'suv', label: 'SUV / Picape', hint: 'Compass, Hilux, Creta', icon: Truck },
];

type Props = {
  value: VehicleSize | null;
  onChange: (size: VehicleSize) => void;
};

export function VehicleSizePicker({ value, onChange }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Porte do veículo">
      {OPTIONS.map(({ value: size, label, hint, icon: Icon }) => {
        const selected = value === size;
        return (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(size)}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-4 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/40',
            )}
          >
            <Icon
              className={cn('size-5 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')}
              aria-hidden
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{label}</span>
              <span className="block truncate text-xs text-muted-foreground">{hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}