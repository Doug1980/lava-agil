'use client';

import { ArrowRight, CalendarClock, Clock, Wallet } from 'lucide-react';
import { SlotGrid } from '@/components/client/slot-grid';
import { formatCurrency, formatDuration } from '@/lib/format';
import type { CatalogEntry, DayAvailability } from '@/types/api';

type Props = {
  items: CatalogEntry[];
  durationMinutes: number;
  priceCents: number;
  hasDate: boolean;
  availability: DayAvailability | undefined;
  isLoadingSlots: boolean;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  canContinue: boolean;
  onContinue: () => void;
};

/**
 * Painel de resumo vivo. Fica fixo (sticky) ao lado do formulário no desktop e
 * empilha abaixo dos serviços no mobile. A grade de horários só aparece quando
 * há serviço e data, então nunca oferecemos um horário sem saber a duração.
 */
export function BookingPanel({
  items,
  durationMinutes,
  priceCents,
  hasDate,
  availability,
  isLoadingSlots,
  selectedTime,
  onSelectTime,
  canContinue,
  onContinue,
}: Props) {
  const empty = items.length === 0;

  return (
    <aside id="horarios" className="lg:sticky lg:top-6 lg:self-start">
      <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
        <div>
          <h2 className="text-sm font-semibold">Resumo</h2>
          {empty ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Monte seu atendimento para ver duração, valor e horários.
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {items.map((item) => (
                <li key={item.variantId} className="flex justify-between gap-4 text-sm">
                  <span className="truncate text-muted-foreground">{item.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatDuration(item.durationMinutes)} · {formatCurrency(item.priceCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!empty && (
          <div className="flex items-center justify-between border-t pt-3">
            <span className="flex items-center gap-1.5 text-sm">
              <Clock className="size-4 text-muted-foreground" aria-hidden />
              <span className="font-medium tabular-nums">{formatDuration(durationMinutes)}</span>
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              <Wallet className="size-4 text-muted-foreground" aria-hidden />
              <span className="font-medium tabular-nums">{formatCurrency(priceCents)}</span>
            </span>
          </div>
        )}

        <div className="border-t pt-3">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
            Horários
          </h3>
          {empty ? (
            <p className="text-sm text-muted-foreground">Escolha um serviço primeiro.</p>
          ) : !hasDate ? (
            <p className="text-sm text-muted-foreground">
              Escolha uma data para ver os horários disponíveis.
            </p>
          ) : (
            <SlotGrid
              data={availability}
              isLoading={isLoadingSlots}
              selected={selectedTime}
              onSelect={onSelectTime}
            />
          )}
        </div>

        {canContinue && (
          <button
            type="button"
            onClick={onContinue}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Continuar para seus dados
            <ArrowRight className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </aside>
  );
}
