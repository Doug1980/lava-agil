'use client';

import { CalendarDays } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MAX_ADVANCE_DAYS } from '@/lib/constants';
import { formatLongDate, toDateKey } from '@/lib/format';
import { cn } from '@/lib/utils';

type Props = {
  value: string | null;
  onChange: (dateKey: string) => void;
};

export function DatePicker({ value, onChange }: Props) {
  const today = new Date();
  const maxDate = new Date(today.getTime() + MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000);
  const selected = value ? new Date(`${value}T12:00:00`) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value
              ? 'animate-card-select scale-[1.02] border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/40'
              : 'border-border bg-card shadow-md shadow-primary/5 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/15 active:scale-[0.99]',
          )}
        >
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors',
              value ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground',
            )}
          >
            <CalendarDays className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">
              {value ? formatLongDate(value) : 'Escolha uma data'}
            </span>
            <span
              className={cn(
                'mt-0.5 block text-xs',
                value ? 'text-primary-foreground/70' : 'text-muted-foreground',
              )}
            >
              {value ? 'Toque para alterar' : 'Selecione o dia do atendimento'}
            </span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" collisionPadding={16}>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => date && onChange(toDateKey(date))}
          disabled={{ before: today, after: maxDate }}
          weekStartsOn={0}
        />
      </PopoverContent>
    </Popover>
  );
}
