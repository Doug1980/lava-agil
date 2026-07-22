'use client';

import { CalendarCheck, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { VehicleSize } from '@/types/api';

const SIZE_LABEL: Record<VehicleSize, string> = {
  hatch: 'Hatch',
  sedan: 'Sedan',
  suv: 'SUV / Picape',
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleSize: VehicleSize;
  items: { name: string; priceCents: number }[];
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  totalCents: number;
  pending: boolean;
  onConfirm: () => void;
};

export function BookingConfirmDialog({
  open,
  onOpenChange,
  vehicleSize,
  items,
  date,
  time,
  totalCents,
  pending,
  onConfirm,
}: Props) {
  const [, month, day] = date.split('-');
  const dateLabel = `${day}/${month} · ${time}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CalendarCheck className="size-5" aria-hidden />
            </span>
            <div>
              <DialogTitle className="font-heading uppercase tracking-wide">
                Confirmar agendamento?
              </DialogTitle>
              <DialogDescription className="mt-1">
                Revise os dados antes de finalizar.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm">
          <div className="flex items-center justify-between py-0.5">
            <span className="text-muted-foreground">Veículo</span>
            <span className="font-medium">{SIZE_LABEL[vehicleSize]}</span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="text-muted-foreground">Data e hora</span>
            <span className="font-medium tabular-nums">{dateLabel}</span>
          </div>

          <div className="mt-2 border-t border-dashed pt-2">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Serviços
            </p>
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate">{item.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatCurrency(item.priceCents)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-dashed pt-2">
            <span className="text-muted-foreground">Total</span>
            <span className="font-heading text-base font-bold tabular-nums text-primary">
              {formatCurrency(totalCents)}
            </span>
          </div>
        </div>

        <DialogFooter className="border-t-0 bg-transparent">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors',
              'hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Confirmar agendamento
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
