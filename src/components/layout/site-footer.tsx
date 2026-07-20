import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

// Footer público. Preencha os dados de contato/horário reais nos arrays abaixo.
const HOURS = [
  { days: 'Seg – Sex', time: '08h – 18h' },
  { days: 'Sábado', time: '08h – 14h' },
  { days: 'Domingo', time: 'Fechado' },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-[#0e2148] text-blue-100/80">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <span className="font-heading text-xl font-extrabold italic tracking-tight text-white">
            Lava<span className="text-[#3b8bee]">Ágil</span>
          </span>
          <p className="mt-2 text-sm">Agendou, lavou, brilhou.</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed">
            Agende sua lavagem em minutos e acompanhe tudo pelo código, sem cadastro.
          </p>
        </div>

        <div>
          <h3 className="font-heading text-xs font-semibold uppercase tracking-widest text-white">
            Navegação
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/agendar" className="transition-colors hover:text-white">
                Agendar
              </Link>
            </li>
            <li>
              <Link href="/meus-agendamentos" className="transition-colors hover:text-white">
                Meus agendamentos
              </Link>
            </li>
            <li>
              <Link href="/entrar" className="transition-colors hover:text-white">
                Área do administrador
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-xs font-semibold uppercase tracking-widest text-white">
            Contato
          </h3>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="size-4 shrink-0 text-[#3b8bee]" aria-hidden />
              <a href="tel:+5500000000000" className="transition-colors hover:text-white">
                (00) 90000-0000
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 shrink-0 text-[#3b8bee]" aria-hidden />
              <a
                href="mailto:contato.lavaagil@gmail.com"
                className="transition-colors hover:text-white"
              >
                contato.lavaagil@gmail.com
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[#3b8bee]" aria-hidden />
              <span>Rua Exemplo, 123 — Centro, Cidade/UF</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-xs font-semibold uppercase tracking-widest text-white">
            Funcionamento
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {HOURS.map((h) => (
              <li key={h.days} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0 text-[#3b8bee]" aria-hidden />
                  {h.days}
                </span>
                <span className="tabular-nums text-blue-100/60">{h.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-blue-100/60 sm:flex-row">
          <span>© {new Date().getFullYear()} LavaÁgil. Todos os direitos reservados.</span>
          <span>Feito para deixar seu carro brilhando.</span>
        </div>
      </div>
    </footer>
  );
}
