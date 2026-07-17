import { config } from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/server/db/schema';
import { services, serviceVariants } from '../src/server/db/schema';

config({ path: '.env.local' });

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) throw new Error('DATABASE_URL_UNPOOLED não configurada');

type Row = {
  slug: string;
  name: string;
  kind: 'base' | 'addon';
  description: string;
  sortOrder: number;
  /** [duração, preço em reais] por porte */
  hatch: [number, number];
  sedan: [number, number];
  suv: [number, number];
};

const CATALOG: Row[] = [
  {
    slug: 'lavagem-simples',
    name: 'Lavagem simples',
    kind: 'base',
    description: 'Lavagem externa, rodas e vidros.',
    sortOrder: 1,
    hatch: [20, 35],
    sedan: [25, 45],
    suv: [30, 55],
  },
  {
    slug: 'lavagem-completa',
    name: 'Lavagem completa',
    kind: 'base',
    description: 'Externa, rodas, vidros, aspiração e painel.',
    sortOrder: 2,
    hatch: [35, 60],
    sedan: [40, 70],
    suv: [50, 90],
  },
  {
    slug: 'polimento-tecnico',
    name: 'Polimento técnico',
    kind: 'base',
    description: 'Correção de riscos e renovação do brilho da pintura.',
    sortOrder: 3,
    hatch: [80, 280],
    sedan: [90, 320],
    suv: [110, 390],
  },
  {
    slug: 'pretinho-pneus',
    name: 'Pretinho nos pneus',
    kind: 'addon',
    description: 'Aplicação de revitalizador nos pneus.',
    sortOrder: 1,
    hatch: [15, 20],
    sedan: [15, 20],
    suv: [20, 25],
  },
  {
    slug: 'cera-protecao',
    name: 'Cera de proteção',
    kind: 'addon',
    description: 'Camada de cera para proteção da pintura.',
    sortOrder: 2,
    hatch: [15, 30],
    sedan: [15, 30],
    suv: [20, 40],
  },
  {
    slug: 'higienizacao-interna',
    name: 'Higienização interna',
    kind: 'addon',
    description: 'Limpeza profunda de bancos, carpetes e forros.',
    sortOrder: 3,
    hatch: [40, 130],
    sedan: [45, 150],
    suv: [55, 180],
  },
  {
    slug: 'motor-lavado',
    name: 'Motor lavado',
    kind: 'addon',
    description: 'Limpeza do compartimento do motor.',
    sortOrder: 4,
    hatch: [20, 40],
    sedan: [20, 40],
    suv: [25, 50],
  },
  {
    slug: 'cristalizacao-vidros',
    name: 'Cristalização de vidros',
    kind: 'addon',
    description: 'Tratamento hidrofóbico nos vidros.',
    sortOrder: 5,
    hatch: [20, 80],
    sedan: [25, 90],
    suv: [30, 110],
  },
];

async function main() {
  const sql = postgres(url!, { max: 1 });
  const db = drizzle(sql, { schema });

  console.log('Limpando catálogo...');
  await db.delete(serviceVariants);
  await db.delete(services);

  console.log('Inserindo serviços...');
  for (const row of CATALOG) {
    const [service] = await db
      .insert(services)
      .values({
        slug: row.slug,
        name: row.name,
        kind: row.kind,
        description: row.description,
        sortOrder: row.sortOrder,
      })
      .returning();

    await db.insert(serviceVariants).values([
      {
        serviceId: service.id,
        vehicleSize: 'hatch',
        durationMinutes: row.hatch[0],
        priceCents: row.hatch[1] * 100,
      },
      {
        serviceId: service.id,
        vehicleSize: 'sedan',
        durationMinutes: row.sedan[0],
        priceCents: row.sedan[1] * 100,
      },
      {
        serviceId: service.id,
        vehicleSize: 'suv',
        durationMinutes: row.suv[0],
        priceCents: row.suv[1] * 100,
      },
    ]);

    console.log(`  ${row.name}`);
  }

  const [{ count: variantCount }] = await sql`SELECT count(*)::int FROM service_variants`;
  console.log(`\n${CATALOG.length} serviços, ${variantCount} variantes.`);

  await sql.end();
}

main().catch((err) => {
  console.error('Falha no seed:');
  console.error(err);
  process.exit(1);
});