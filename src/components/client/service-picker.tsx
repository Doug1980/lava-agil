'use client';

import { Ban, Check, Droplet } from 'lucide-react';
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
      {services.map((service, i) => {
        const isSelected = selected?.variantId === service.variantId;
        return (
          <div
            key={service.variantId}
            className="animate-rise"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(service)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                  ? 'animate-card-select scale-[1.02] border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/40'
                  : 'border-border bg-card shadow-md shadow-primary/5 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/15 active:scale-[0.99]',
              )}
            >
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                  isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground',
                )}
              >
                <Droplet className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-sm font-semibold uppercase tracking-wide">
                  {service.name}
                </span>
                {service.description && (
                  <span
                    className={cn(
                      'mt-0.5 block text-xs',
                      isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground',
                    )}
                  >
                    {service.description}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-right">
                <span
                  className={cn(
                    'block text-sm font-bold tabular-nums',
                    isSelected ? 'text-white' : 'text-primary',
                  )}
                >
                  {formatCurrency(service.priceCents)}
                </span>
                <span
                  className={cn(
                    'mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums',
                    isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {formatDuration(service.durationMinutes)}
                </span>
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

type AddonProps = {
  services: CatalogEntry[];
  isSelected: (variantId: string) => boolean;
  onToggle: (entry: CatalogEntry) => void;
  noAddonsSelected: boolean;
  onChooseNoAddons: () => void;
};

export function AddonPicker({
  services,
  isSelected,
  onToggle,
  noAddonsSelected,
  onChooseNoAddons,
}: AddonProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {services.map((service, i) => {
        const checked = isSelected(service.variantId);
        return (
          <div
            key={service.variantId}
            className="animate-rise"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <button
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => onToggle(service)}
              className={cn(
                'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                checked
                  ? 'animate-card-select scale-[1.02] border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/40'
                  : 'border-border bg-card shadow-md shadow-primary/5 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/15 active:scale-[0.99]',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
                  checked ? 'border-white bg-white text-primary' : 'border-border',
                )}
                aria-hidden
              >
                {checked && <Check className="animate-pop size-3" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{service.name}</span>
                <span
                  className={cn(
                    'mt-0.5 block text-xs tabular-nums',
                    checked ? 'text-primary-foreground/70' : 'text-muted-foreground',
                  )}
                >
                  +{formatDuration(service.durationMinutes)} · {formatCurrency(service.priceCents)}
                </span>
              </span>
            </button>
          </div>
        );
      })}

      <div
        className="animate-rise sm:col-span-2"
        style={{ animationDelay: `${services.length * 70}ms` }}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={noAddonsSelected}
          onClick={onChooseNoAddons}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl border border-dashed p-4 text-left transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            noAddonsSelected
              ? 'animate-card-select scale-[1.01] border-solid border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/40'
              : 'border-border bg-card/60 shadow-sm shadow-primary/5 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 active:scale-[0.99]',
          )}
        >
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
              noAddonsSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground',
            )}
          >
            <Ban className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Não desejo nenhum adicional</span>
            <span
              className={cn(
                'mt-0.5 block text-xs',
                noAddonsSelected ? 'text-primary-foreground/70' : 'text-muted-foreground',
              )}
            >
              Seguir apenas com o serviço escolhido
            </span>
          </span>
          {noAddonsSelected && (
            <span className="animate-pop flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow">
              <Check className="size-3" strokeWidth={3} aria-hidden />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
