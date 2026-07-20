'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DayAvailability, SlotReason } from '@/types/api';

const REASON_LABEL: Record<SlotReason, string> = {
  past: 'Horário indisponível',
  closing: 'Não cabe antes do fechamento',
  occupied: 'Horário já ocupado',
};

type Props = {
  data: DayAvailability | undefined;
  isLoading: boolean;
  selected: string | null;
  onSelect: (time: string) => void;
};

export function SlotGrid({ data, isLoading, selected, onSelect }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {Array.from({ length: 24 }).map((_, i) => (
          <Skeleton key={i} className="h-9" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  if (!data.open) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Não abrimos nesta data. Escolha outro dia.
      </p>
    );
  }

  const hasAvailable = data.slots.some((s) => s.available);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Horário">
        {data.slots.map((slot) => {
          const isSelected = selected === slot.time;
          return (
            <button
              key={slot.time}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={!slot.available}
              title={slot.reason ? REASON_LABEL[slot.reason] : undefined}
              onClick={() => onSelect(slot.time)}
              style={
                isSelected
                  ? { backgroundImage: 'linear-gradient(135deg, #0352d8, #1993e5)' }
                  : undefined
              }
              className={cn(
                'h-9 rounded-lg border text-sm font-semibold tabular-nums transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected && 'border-transparent text-white shadow-md shadow-primary/30',
                !isSelected &&
                  slot.available &&
                  'border-transparent bg-secondary text-primary hover:bg-primary/15',
                !slot.available &&
                  'cursor-not-allowed border border-dashed border-border text-muted-foreground/40',
              )}
            >
              {slot.time}
            </button>
          );
        })}
      </div>

      {!hasAvailable && (
        <p className="text-center text-sm text-muted-foreground">
          Nenhum horário comporta esse atendimento nesta data.
        </p>
      )}
    </div>
  );
}
