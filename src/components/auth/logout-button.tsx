'use client';

import { signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { auth } from '@/lib/firebase/client';
import { cn } from '@/lib/utils';

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      // Limpa o cookie de sessão no servidor.
      await fetch('/api/session', { method: 'DELETE' });
      // Encerra a sessão do Firebase no cliente.
      await signOut(auth);
    } finally {
      router.push('/entrar');
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium',
        'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        'disabled:pointer-events-none disabled:opacity-60',
        className,
      )}
    >
      <LogOut className="size-4" aria-hidden />
      {loading ? 'Saindo...' : 'Sair'}
    </button>
  );
}
