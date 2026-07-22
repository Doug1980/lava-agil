'use client';

import { CircleCheck } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  email: string | null;
  onNewBooking: () => void;
};

export function BookingSuccessDialog({ open, onOpenChange, code, email, onNewBooking }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center sm:max-w-md">
        <DialogHeader className="items-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CircleCheck className="size-9" aria-hidden />
          </span>
          <DialogTitle className="mt-3 font-heading text-xl uppercase tracking-wide">
            Agendamento realizado!
          </DialogTitle>
          <DialogDescription className="mt-1">
            {email ? (
              <>
                Enviamos o código do seu agendamento para o e-mail{' '}
                <span className="font-medium text-foreground">{email}</span>.
              </>
            ) : (
              'Guarde o código do seu agendamento abaixo.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-dashed border-primary/40 bg-secondary/40 py-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Seu código
          </p>
          <p className="font-heading text-2xl font-bold tracking-[0.15em] text-primary">{code}</p>
        </div>

        <div className="mt-1 flex flex-col gap-2">
          <Link
            href="/meus-agendamentos"
            className="w-full rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ver meus agendamentos
          </Link>
          <button
            type="button"
            onClick={onNewBooking}
            className="w-full rounded-xl px-4 py-2 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Fazer novo agendamento
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
