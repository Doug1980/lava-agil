import { config } from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

config({ path: '.env.local' });

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) throw new Error('DATABASE_URL_UNPOOLED não configurada');

async function main() {
  const sql = postgres(url!, { max: 1 });
  const db = drizzle(sql);

  console.log('Aplicando migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations aplicadas com sucesso.');

  await sql.end();
}

main().catch((err) => {
  console.error('Falha na migration:');
  console.error(err);
  process.exit(1);
});