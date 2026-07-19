import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.18.5'],
  // Nodemailer é um pacote Node puro: mantê-lo fora do bundle evita erros
  // de empacotamento nas rotas de API (Vercel/serverless).
  serverExternalPackages: ['nodemailer'],
};

export default nextConfig;
