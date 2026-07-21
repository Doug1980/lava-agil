'use client';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { Loader2, Lock, LogIn, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { auth } from '@/lib/firebase/client';
import { cn } from '@/lib/utils';

const fieldClass = cn(
  'flex items-center gap-2 rounded-lg border border-border bg-card px-3',
  'focus-within:border-primary focus-within:ring-2 focus-within:ring-ring',
);

export default function EntrarPage() {
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

      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) throw new Error('session');

      // Acesso administrativo. A página /admin revalida o papel no servidor.
      router.push('/admin');
      router.refresh();
    } catch {
      setError('E-mail ou senha inválidos.');
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border bg-card shadow-xl shadow-primary/15">
        <div
          className="relative overflow-hidden px-6 py-9 text-center"
          style={{ backgroundImage: 'linear-gradient(135deg, #0e2148, #1e5fd6)' }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -left-10 -top-10 size-32 rounded-full bg-white/10"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-12 right-4 size-28 rounded-full bg-white/10"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-10 top-6 size-10 rounded-full bg-white/10"
          />
          <span className="relative inline-flex rounded-3xl bg-white p-5 shadow-2xl shadow-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="LavaÁgil" className="h-28 w-auto sm:h-32" />
          </span>
          <p className="relative mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100">
            Acesso administrativo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">E-mail</span>
            <span className={fieldClass}>
              <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent py-2.5 text-sm focus-visible:outline-none"
                autoComplete="email"
                placeholder="voce@exemplo.com"
                required
              />
            </span>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Senha</span>
            <span className={fieldClass}>
              <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent py-2.5 text-sm focus-visible:outline-none"
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundImage: 'linear-gradient(135deg, #1e5fd6, #3b8bee)' }}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3',
              'text-sm font-bold text-white shadow-lg shadow-primary/30 transition-transform',
              'hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
      </div>
    </main>
  );
}
