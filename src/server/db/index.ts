import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type Db = ReturnType<typeof createDb>;

let cached: Db | undefined;

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não configurada');
  return drizzle(neon(url), { schema });
}

export function getDb(): Db {
  cached ??= createDb();
  return cached;
}