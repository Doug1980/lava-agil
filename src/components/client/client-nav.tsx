'use client';

import { CalendarCheck, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMyBookings } from '@/hooks/use-my-bookings';
import { cn } from '@/lib/utils';

export function ClientNav() {
  const pathname = usePathname();
  const { codes } = useMyBookings();

  const linkClass = (active: boolean) =>
    cn(
      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
      active
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    );

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/agendar" className="flex items-center">
          <span className="inline-flex rounded-md p-0.5 dark:bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="LavaÁgil" className="h-9 w-auto" />
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/agendar" className={linkClass(pathname === '/agendar')}>
            <Plus className="size-4" aria-hidden />
            Agendar
          </Link>
          <Link
            href="/meus-agendamentos"
            className={linkClass(pathname === '/meus-agendamentos')}
          >
            <CalendarCheck className="size-4" aria-hidden />
            Meus agendamentos
            {codes.length > 0 && (
              <span className="ml-0.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                {codes.length}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
