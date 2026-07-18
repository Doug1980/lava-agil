import { and, asc, eq, inArray } from 'drizzle-orm';
import type { VehicleSize } from '@/lib/schemas/appointment';
import { getDb } from '@/server/db';
import { services, serviceVariants } from '@/server/db/schema';
import type { CatalogItem } from '@/server/services/pricing';

export type VariantRow = CatalogItem & {
  vehicleSize: VehicleSize;
  active: boolean;
};

export async function listCatalog(vehicleSize: VehicleSize) {
  const db = getDb();

  const rows = await db
    .select({
      id: services.id,
      slug: services.slug,
      name: services.name,
      kind: services.kind,
      description: services.description,
      sortOrder: services.sortOrder,
      variantId: serviceVariants.id,
      durationMinutes: serviceVariants.durationMinutes,
      priceCents: serviceVariants.priceCents,
    })
    .from(services)
    .innerJoin(serviceVariants, eq(serviceVariants.serviceId, services.id))
    .where(and(eq(services.active, true), eq(serviceVariants.vehicleSize, vehicleSize)))
    .orderBy(asc(services.kind), asc(services.sortOrder));

  return {
    base: rows.filter((r) => r.kind === 'base'),
    addons: rows.filter((r) => r.kind === 'addon'),
  };
}

/** Busca as variantes escolhidas. Nunca confiar em duração ou preço vindos do cliente. */
export async function findVariants(variantIds: string[]): Promise<VariantRow[]> {
  const db = getDb();

  const rows = await db
    .select({
      variantId: serviceVariants.id,
      serviceName: services.name,
      kind: services.kind,
      durationMinutes: serviceVariants.durationMinutes,
      priceCents: serviceVariants.priceCents,
      vehicleSize: serviceVariants.vehicleSize,
      active: services.active,
    })
    .from(serviceVariants)
    .innerJoin(services, eq(services.id, serviceVariants.serviceId))
    .where(inArray(serviceVariants.id, variantIds));

  return rows;
}
