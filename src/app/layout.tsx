import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'LavaÁgil · Agendamento',
  description: 'Seu carro limpo na hora certa. Agende lavagem e estética automotiva.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}