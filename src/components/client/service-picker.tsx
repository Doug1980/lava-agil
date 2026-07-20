'use client';

import { Check, Droplet } from 'lucide-react';
import { formatCurrency, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { CatalogEntry } from '@/types/api';

type BaseProps = {
  services: CatalogEntry[];
  selected: CatalogEntry | null;
  onSelect: (entry: CatalogEntry) => void;
};

export function BaseServicePicker({ services, selected, onSelect }: BaseProps) {
  return (
    <div className="grid gap-3" role="radiogroup" aria-label="Serviço principal">
      {services.map((service) => {
        const isSelected = selected?.variantId === service.variantId;
        return (
          <button
            key={service.variantId}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(service)}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-4 text-left transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isSelected
                ? 'border-primary bg-secondary shadow-sm shadow-primary/10'
                : 'border-border bg-card hover:border-primary/50',
            )}
          >
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <Droplet className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-heading text-sm font-semibold uppercase tracking-wide">
                {service.name}
              </span>
              {service.description && (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {service.description}
                </span>
              )}
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-sm font-bold tabular-nums text-primary">
                {formatCurrency(service.priceCents)}
              </span>
              <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                {formatDuration(service.durationMinutes)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

type AddonProps = {
  services: CatalogEntry[];
  isSelected: (variantId: string) => boolean;
  onToggle: (entry: CatalogEntry) => void;
};

export function AddonPicker({ services, isSelected, onToggle }: AddonProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {services.map((service) => {
        const checked = isSelected(service.variantId);
        return (
          <button
            key={service.variantId}
            type="button"
            role="checkbox"
            aria-checked={checked}
            onClick={() => onToggle(service)}
            className={cn(
              'flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              checked
                ? 'border-primary bg-secondary shadow-sm shadow-primary/10'
                : 'border-border bg-card hover:border-primary/50',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border',
                checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
              )}
              aria-hidden
            >
              {checked && <Check className="size-3" strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{service.name}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">
                +{formatDuration(service.durationMinutes)} · {formatCurrency(service.priceCents)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
