'use client';

import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatLongDate, toDateKey } from '@/lib/format';
import { MAX_ADVANCE_DAYS } from '@/lib/constants';

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
        <Button variant="outline" className="w-full justify-start font-normal">
          <CalendarDays className="mr-2 size-4 text-muted-foreground" aria-hidden />
          {value ? (
            <span className="capitalize">{formatLongDate(value)}</span>
          ) : (
            <span className="text-muted-foreground">Escolha uma data</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
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