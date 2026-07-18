'use client';

import { Clock, Wallet } from 'lucide-react';
import { formatCurrency, formatDuration } from '@/lib/format';
import type { CatalogEntry } from '@/types/api';

type Props = {
  items: CatalogEntry[];
  durationMinutes: number;
  priceCents: number;
};

export function CartSummary({ items, durationMinutes, priceCents }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
      <ul className="mb-2 hidden space-y-1 sm:block">
        {items.map((item) => (
          <li key={item.variantId} className="flex justify-between gap-4 text-xs">
            <span className="truncate text-muted-foreground">{item.name}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatDuration(item.durationMinutes)} · {formatCurrency(item.priceCents)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-4 sm:border-t sm:pt-2">
        <span className="flex items-center gap-1.5 text-sm">
          <Clock className="size-4 text-muted-foreground" aria-hidden />
          <span className="font-medium tabular-nums">{formatDuration(durationMinutes)}</span>
        </span>
        <span className="flex items-center gap-1.5 text-sm">
          <Wallet className="size-4 text-muted-foreground" aria-hidden />
          <span className="font-medium tabular-nums">{formatCurrency(priceCents)}</span>
        </span>
      </div>
    </div>
  );
}