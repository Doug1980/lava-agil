'use client';

import { ArrowRight, CalendarClock, Clock, Sparkles, Wallet } from 'lucide-react';
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
      <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-xl shadow-primary/10 sm:p-5">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide">Resumo</h2>
          {empty ? (
            <div className="mt-3 flex flex-col items-center gap-2 rounded-xl bg-secondary/60 px-4 py-6 text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="size-5" aria-hidden />
              </span>
              <p className="text-sm text-muted-foreground">
                Monte seu atendimento para ver duração, valor e horários aqui.
              </p>
            </div>
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
          <div className="flex items-center justify-between rounded-xl bg-[#0e2148] px-4 py-3">
            <span className="flex items-center gap-1.5 text-sm text-blue-100">
              <Clock className="size-4" aria-hidden />
              <span className="font-semibold tabular-nums text-white">
                {formatDuration(durationMinutes)}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Wallet className="size-4 text-blue-200" aria-hidden />
              <span className="text-lg font-extrabold tabular-nums text-white">
                {formatCurrency(priceCents)}
              </span>
            </span>
          </div>
        )}

        <div className="border-t pt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide">
              <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
              Horários
            </h3>
            {hasDate && !empty && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fcbb05] px-2 py-0.5 text-[10px] font-bold text-[#7a4e00]">
                <Sparkles className="size-3" aria-hidden />
                ao vivo
              </span>
            )}
          </div>
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
            style={{ backgroundImage: 'linear-gradient(135deg, #1e5fd6, #3b8bee)' }}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Continuar para seus dados
            <ArrowRight className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </aside>
  );
}
