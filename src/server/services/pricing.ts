import { BusinessRuleError } from './errors';

export type CatalogItem = {
  variantId: string;
  serviceName: string;
  kind: 'base' | 'addon';
  durationMinutes: number;
  priceCents: number;
};

export type Totals = {
  serviceMinutes: number;
  totalPriceCents: number;
};

export function assertValidSelection(items: CatalogItem[]): void {
  const bases = items.filter((i) => i.kind === 'base');

  if (bases.length === 0) {
    throw new BusinessRuleError('BASE_REQUIRED', 'Escolha um serviço principal.');
  }

  if (bases.length > 1) {
    throw new BusinessRuleError('SINGLE_BASE', 'Escolha apenas um serviço principal.');
  }

  const ids = items.map((i) => i.variantId);
  if (new Set(ids).size !== ids.length) {
    throw new BusinessRuleError('DUPLICATE_ITEM', 'Há serviços duplicados na seleção.');
  }
}

export function calculateTotals(items: CatalogItem[]): Totals {
  return items.reduce<Totals>(
    (acc, item) => ({
      serviceMinutes: acc.serviceMinutes + item.durationMinutes,
      totalPriceCents: acc.totalPriceCents + item.priceCents,
    }),
    { serviceMinutes: 0, totalPriceCents: 0 },
  );
}