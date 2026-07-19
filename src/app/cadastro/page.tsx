'use client';

import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { auth } from '@/lib/firebase/client';
import { cn } from '@/lib/utils';

const inputClass = cn(
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
);

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Informe seu nome.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name.trim() });

      const token = await credential.user.getIdToken();

      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) throw new Error('session');

      router.push('/agendar');
      router.refresh();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado. Faça login.');
      } else if (code === 'auth/invalid-email') {
        setError('E-mail inválido.');
      } else {
        setError('Não foi possível criar a conta.');
      }
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">LavaÁgil</h1>
        <p className="text-sm text-muted-foreground">Crie sua conta para agendar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Nome</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            autoComplete="name"
            required
          />
        </label>

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
            autoComplete="new-password"
            required
          />
          <span className="text-xs text-muted-foreground">Mínimo de 6 caracteres.</span>
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
            <UserPlus className="size-4" aria-hidden />
          )}
          {loading ? 'Criando...' : 'Criar conta'}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link href="/entrar" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </main>
  );
}
