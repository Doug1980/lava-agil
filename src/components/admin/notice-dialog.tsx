'use client';

import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
};

/** Aviso informativo com um único botão "OK" — o usuário precisa fechar para prosseguir. */
export function NoticeDialog({ open, onOpenChange, title = 'Atenção', message }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
              <AlertTriangle className="size-5" aria-hidden />
            </span>
            <div>
              <DialogTitle className="font-heading uppercase tracking-wide">{title}</DialogTitle>
              <DialogDescription className="mt-1">{message}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="border-t-0 bg-transparent">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            OK, entendi
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
