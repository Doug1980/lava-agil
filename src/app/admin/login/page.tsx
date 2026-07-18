'use client';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { auth } from '@/lib/firebase/client';
import { cn } from '@/lib/utils';

const inputClass = cn(
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();

      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) throw new Error('session');

      router.push('/admin');
      router.refresh();
    } catch {
      setError('E-mail ou senha inválidos.');
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">LavaÁgil</h1>
        <p className="text-sm text-muted-foreground">Acesso administrativo</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <label className="block space-y-1">
          <span className="text-sm font-medium">E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            autoComplete="email"
            required
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5',
            'text-sm font-medium text-primary-foreground transition-colors',
            'hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:pointer-events-none disabled:opacity-60',
          )}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <LogIn className="size-4" aria-hidden />
          )}
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
