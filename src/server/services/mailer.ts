import nodemailer from 'nodemailer';
import { formatCurrency, formatDateTime, formatDuration } from '@/lib/format';

export type BookingEmailData = {
  to: string;
  customerName: string;
  code: string;
  startsAt: string;
  serviceMinutes: number;
  totalPriceCents: number;
  items: Array<{ name: string }>;
  appUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHtml(data: BookingEmailData): string {
  const when = formatDateTime(data.startsAt);
  const services = data.items.map((i) => escapeHtml(i.name)).join(' · ');
  const totals = `${formatDuration(data.serviceMinutes)} · ${formatCurrency(data.totalPriceCents)}`;
  const trackUrl = `${data.appUrl}/meus-agendamentos?code=${encodeURIComponent(data.code)}`;

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #111827;">
    <img src="${data.appUrl}/logo-email.png" alt="LavaÁgil" width="160" style="display: block; height: auto; margin: 0 0 20px;" />
    <p style="font-size: 15px;">Olá, ${escapeHtml(data.customerName)}! Seu agendamento está confirmado.</p>
    <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 16px 0;">
      <p style="font-size: 12px; color: #6b7280; margin: 0 0 2px;">Código do agendamento</p>
      <p style="font-size: 26px; font-weight: bold; letter-spacing: 2px; margin: 0 0 12px;">${escapeHtml(data.code)}</p>
      <p style="font-size: 16px; font-weight: bold; margin: 0 0 4px;">${when}</p>
      <p style="font-size: 14px; color: #374151; margin: 0;">${services}</p>
      <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0;">${totals}</p>
    </div>
    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 16px; margin: 0 0 16px;">
      <p style="font-size: 15px; font-weight: bold; color: #b45309; margin: 0 0 6px; letter-spacing: 0.3px;">ATENÇÃO! 🚨</p>
      <p style="font-size: 14px; color: #78350f; margin: 0; line-height: 1.6;">Pedimos, por gentileza, que chegue no horário. Em caso de atraso superior a <b>15 minutos</b>, o agendamento poderá ser adiado automaticamente. Agradecemos pela preferência!</p>
    </div>
    <a href="${trackUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 11px 18px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: bold;">Acompanhar meu agendamento</a>
    <p style="font-size: 12px; color: #374151; margin: 24px 0 0;">Guarde este código: com ele você consulta seu agendamento a qualquer momento, em qualquer dispositivo.</p>
  </div>`;
}

/**
 * Envia o comprovante de agendamento. Melhor-esforço: se as variáveis de
 * ambiente não estiverem configuradas, retorna em silêncio sem quebrar o fluxo.
 */
export async function sendBookingConfirmation(data: BookingEmailData): Promise<void> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  // E-mail desativado se não configurado: não quebra o agendamento.
  if (!user || !pass) return;

  const from = process.env.MAIL_FROM || `LavaÁgil <${user}>`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: data.to,
    subject: `Agendamento confirmado · ${data.code}`,
    html: renderHtml(data),
  });
}
