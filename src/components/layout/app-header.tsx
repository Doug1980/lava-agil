import Link from 'next/link';
import { LogoutButton } from '@/components/auth/logout-button';

type Props = {
  name?: string | null;
  email?: string | null;
};

/** Barra superior com identidade do usuário logado e ação de sair. */
export function AppHeader({ name, email }: Props) {
  const label = name || email || 'Minha conta';

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0e2148]/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/" className="flex items-center">
          <span className="inline-flex rounded-lg bg-white p-1.5 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="LavaÁgil" className="h-11 w-auto" />
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden max-w-[45vw] truncate text-sm text-blue-100/80 sm:inline">
            {label}
          </span>
          <LogoutButton className="text-blue-100/80 hover:bg-white/10 hover:text-white" />
        </div>
      </div>
    </header>
  );
}
