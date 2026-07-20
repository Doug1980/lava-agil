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
        ? 'bg-white/15 text-white'
        : 'text-blue-100/80 hover:bg-white/10 hover:text-white',
    );

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0e2148]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/agendar" className="flex items-center">
          <span className="inline-flex rounded-lg bg-white p-1.5 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="LavaÁgil" className="h-11 w-auto" />
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
              <span className="ml-0.5 flex min-w-5 items-center justify-center rounded-full bg-[#3b8bee] px-1.5 text-xs font-medium text-white">
                {codes.length}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
