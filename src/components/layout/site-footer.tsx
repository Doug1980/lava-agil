import { Clock, Mail, MessageSquareOff, Phone } from 'lucide-react';
import Link from 'next/link';

// Footer público compacto. Preencha telefone/e-mail/horário reais abaixo.
export function SiteFooter() {
  return (
    <footer className="mt-16 bg-[#0e2148] text-blue-100/80">
      <div className="mx-auto grid max-w-5xl gap-x-6 gap-y-5 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="font-heading text-base font-extrabold italic tracking-tight text-white">
            Lava<span className="text-[#3b8bee]">Ágil</span>
          </span>
          <p className="mt-0.5 text-xs text-blue-100/60">Agendou, lavou, brilhou.</p>
        </div>

        <div>
          <h3 className="font-heading text-[10px] font-semibold uppercase tracking-widest text-white">
            Navegação
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed">
            <Link href="/agendar" className="transition-colors hover:text-white">
              Agendar
            </Link>
            {' · '}
            <Link href="/meus-agendamentos" className="transition-colors hover:text-white">
              Meus agendamentos
            </Link>
            {' · '}
            <Link href="/entrar" className="transition-colors hover:text-white">
              Admin
            </Link>
          </p>
        </div>

        <div>
          <h3 className="font-heading text-[10px] font-semibold uppercase tracking-widest text-white">
            Contato
          </h3>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <a href="tel:+5500000000000" className="flex items-center gap-1.5 hover:text-white">
              <Phone className="size-3.5 text-[#3b8bee]" aria-hidden />
              (00) 90000-0000
            </a>
            <a
              href="mailto:contato.lavaagil@gmail.com"
              className="flex items-center gap-1.5 hover:text-white"
            >
              <Mail className="size-3.5 text-[#3b8bee]" aria-hidden />
              contato.lavaagil@gmail.com
            </a>
          </p>
        </div>

        <div>
          <h3 className="font-heading text-[10px] font-semibold uppercase tracking-widest text-white">
            Funcionamento
          </h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs">
            <Clock className="size-3.5 shrink-0 text-[#3b8bee]" aria-hidden />
            Ter–Sáb 08h–18h · Dom 08h–16h
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs">
            <MessageSquareOff className="size-3.5 shrink-0 text-[#3b8bee]" aria-hidden />
            Fechado as segundas-feiras
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-5xl px-5 py-2.5 text-center text-[11px] text-blue-100/60">
          © {new Date().getFullYear()} LavaÁgil. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
