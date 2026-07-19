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
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/" className="flex items-center">
          <span className="inline-flex rounded-md p-0.5 dark:bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="LavaÁgil" className="h-9 w-auto" />
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden max-w-[45vw] truncate text-sm text-muted-foreground sm:inline">
            {label}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
