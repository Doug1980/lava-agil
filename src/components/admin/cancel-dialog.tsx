'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const PRESETS = [
  'Cliente desistiu',
  'Não compareceu',
  'Remarcado',
  'Clima',
  'Outro',
] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  pending: boolean;
  onConfirm: (reason: string) => void;
};

export function CancelDialog({ open, onOpenChange, customerName, pending, onConfirm }: Props) {
  const [preset, setPreset] = useState<string | null>(null);
  const [note, setNote] = useState('');

  // Zera o formulário sempre que o diálogo abre.
  useEffect(() => {
    if (open) {
      setPreset(null);
      setNote('');
    }
  }, [open]);

  const needsNote = preset === 'Outro';
  const valid = preset !== null && (!needsNote || note.trim().length > 0);

  function handleConfirm() {
    if (!valid || !preset) return;
    const trimmed = note.trim();
    const reason =
      preset === 'Outro' ? trimmed : trimmed ? `${preset} — ${trimmed}` : preset;
    onConfirm(reason);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" aria-hidden />
            </span>
            <div>
              <DialogTitle className="font-heading uppercase tracking-wide">
                Cancelar agendamento?
              </DialogTitle>
              <DialogDescription className="mt-1">
                O horário de <span className="font-medium text-foreground">{customerName}</span> será
                liberado. Informe o motivo — ele fica registrado no histórico.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const active = preset === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreset(p)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
                    active
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={
              needsNote ? 'Descreva o motivo (obrigatório)' : 'Observação (opcional)'
            }
            className={cn(
              'w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          />
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!valid || pending}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition-colors',
              'hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Sim, cancelar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
