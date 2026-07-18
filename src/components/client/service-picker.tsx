'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDuration } from '@/lib/format';
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
              'flex items-start justify-between gap-4 rounded-lg border p-4 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/40',
            )}
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium">{service.name}</span>
              {service.description && (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {service.description}
                </span>
              )}
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-sm font-medium tabular-nums">
                {formatCurrency(service.priceCents)}
              </span>
              <span className="block text-xs text-muted-foreground tabular-nums">
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
              'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              checked
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/40',
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