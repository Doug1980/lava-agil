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
              'relative flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'animate-card-select scale-[1.02] border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/40'
                : 'border-border bg-card shadow-md shadow-primary/5 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/15 active:scale-[0.99]',
            )}
          >
            {selected && (
              <span className="animate-pop absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-white text-primary shadow">
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </span>
            )}
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                selected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-sm font-semibold uppercase tracking-wide">
                {label}
              </span>
              <span
                className={cn(
                  'block truncate text-xs',
                  selected ? 'text-primary-foreground/70' : 'text-muted-foreground',
                )}
              >
                {hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
