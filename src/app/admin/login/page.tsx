import { redirect } from 'next/navigation';

// Rota mantida por compatibilidade. O login foi unificado em /entrar,
// que roteia admin e cliente conforme o papel após autenticar.
export default function AdminLoginRedirect() {
  redirect('/entrar');
}
