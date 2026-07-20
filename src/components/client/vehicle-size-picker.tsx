'use client';

import { Car, Check, Truck } from 'lucide-react';
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
              'relative flex items-center gap-3 rounded-xl border p-4 text-left transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'border-primary bg-secondary shadow-sm shadow-primary/10'
                : 'border-border bg-card hover:border-primary/50',
            )}
          >
            {selected && (
              <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </span>
            )}
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg',
                selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-sm font-semibold uppercase tracking-wide">
                {label}
              </span>
              <span className="block truncate text-xs text-muted-foreground">{hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
