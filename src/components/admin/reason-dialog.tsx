'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  presets: readonly string[];
  confirmLabel: string;
  pending: boolean;
  onConfirm: (reason: string) => void;
};

/**
 * Diálogo escuro (grafite) de confirmação com motivo obrigatório: motivos
 * prontos + observação livre. Reutilizado no cancelar e no excluir.
 */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  presets,
  confirmLabel,
  pending,
  onConfirm,
}: Props) {
  const [preset, setPreset] = useState<string | null>(null);
  const [note, setNote] = useState('');

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
    const reason = preset === 'Outro' ? trimmed : trimmed ? `${preset} — ${trimmed}` : preset;
    onConfirm(reason);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark border-white/10 bg-[#101c30] sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" aria-hidden />
            </span>
            <div>
              <DialogTitle className="font-heading uppercase tracking-wide">{title}</DialogTitle>
              <DialogDescription className="mt-1">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => {
              const active = preset === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreset(p)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
                    active
                      ? 'border-destructive bg-destructive text-white shadow-sm shadow-destructive/30'
                      : 'border-white/15 bg-white/5 text-blue-100/70 hover:border-destructive/60 hover:text-white',
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
            placeholder={needsNote ? 'Descreva o motivo (obrigatório)' : 'Observação (opcional)'}
            className={cn(
              'w-full resize-none rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-blue-100/40',
              'focus-visible:border-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40',
            )}
          />
        </div>

        <DialogFooter className="border-t-0 bg-transparent">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!valid || pending}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition-colors',
              'hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
