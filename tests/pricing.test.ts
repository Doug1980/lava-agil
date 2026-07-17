import { describe, expect, it } from 'vitest';
import {
  assertValidSelection,
  calculateTotals,
  type CatalogItem,
} from '@/server/services/pricing';
import { BusinessRuleError } from '@/server/services/errors';

const lavagemCompleta: CatalogItem = {
  variantId: 'a',
  serviceName: 'Lavagem completa',
  kind: 'base',
  durationMinutes: 40,
  priceCents: 7000,
};

const higienizacao: CatalogItem = {
  variantId: 'b',
  serviceName: 'Higienização interna',
  kind: 'addon',
  durationMinutes: 45,
  priceCents: 15000,
};

const pretinho: CatalogItem = {
  variantId: 'c',
  serviceName: 'Pretinho nos pneus',
  kind: 'addon',
  durationMinutes: 15,
  priceCents: 2000,
};

const cera: CatalogItem = {
  variantId: 'd',
  serviceName: 'Cera de proteção',
  kind: 'addon',
  durationMinutes: 15,
  priceCents: 3000,
};

describe('calculateTotals', () => {
  it('soma duração e preço dos itens', () => {
    const totals = calculateTotals([lavagemCompleta, higienizacao, pretinho, cera]);
    expect(totals.serviceMinutes).toBe(115);
    expect(totals.totalPriceCents).toBe(27000);
  });

  it('funciona só com o serviço base', () => {
    expect(calculateTotals([lavagemCompleta])).toEqual({
      serviceMinutes: 40,
      totalPriceCents: 7000,
    });
  });
});

describe('assertValidSelection', () => {
  it('aceita um base com adicionais', () => {
    expect(() => assertValidSelection([lavagemCompleta, pretinho])).not.toThrow();
  });

  it('exige um serviço base', () => {
    expect(() => assertValidSelection([pretinho, cera])).toThrow(BusinessRuleError);
  });

  it('recusa mais de um serviço base', () => {
    const outroBase = { ...lavagemCompleta, variantId: 'e' };
    expect(() => assertValidSelection([lavagemCompleta, outroBase])).toThrow(/apenas um/);
  });

  it('recusa itens duplicados', () => {
    expect(() => assertValidSelection([lavagemCompleta, pretinho, pretinho])).toThrow(
      /duplicados/,
    );
  });
});