/**
 * Regenera o logo embutido no e-mail (base64) a partir de uma imagem fonte.
 *
 * Uso:
 *   pnpm email:logo                 # usa public/logo.svg
 *   pnpm email:logo public/logo.png # usa outra fonte
 *
 * Requer o sharp (uma vez):  pnpm add -D sharp
 *
 * O e-mail não renderiza SVG, então geramos um PNG achatado sobre branco e o
 * embutimos como base64 em src/server/services/email-logo.ts, que o mailer
 * anexa inline via CID. Assim o logo aparece em qualquer cliente de e-mail.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const SRC = process.argv[2] ?? 'public/logo.svg';
const OUT = 'src/server/services/email-logo.ts';
const SIZE = 360; // px — exibido a ~140px no e-mail, com folga para telas retina.

async function main() {
  const input = readFileSync(SRC);

  const png = await sharp(input, { density: 300 })
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const b64 = png.toString('base64');
  const contents =
    '// Logo do LavaÁgil embutido (base64) para anexar inline no e-mail via CID.\n' +
    '// GERADO por scripts/gen-email-logo.ts — não edite à mão (rode `pnpm email:logo`).\n' +
    `// Fonte: ${SRC} · ${SIZE}px · ${png.length} bytes.\n` +
    'export const EMAIL_LOGO_BASE64 =\n' +
    `  '${b64}';\n`;

  writeFileSync(OUT, contents);
  console.log(`Logo do e-mail atualizado a partir de ${SRC} (${png.length} bytes) → ${OUT}`);
}

main().catch((err) => {
  console.error('Falha ao gerar o logo do e-mail:', err);
  process.exit(1);
});
