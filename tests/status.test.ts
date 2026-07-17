import { describe, expect, it } from 'vitest';
import { allowedTransitions, assertTransition, canTransition } from '@/server/services/status';
import { BusinessRuleError } from '@/server/services/errors';

describe('máquina de estados', () => {
  it('permite agendado para confirmado ou cancelado', () => {
    expect(canTransition('scheduled', 'confirmed')).toBe(true);
    expect(canTransition('scheduled', 'cancelled')).toBe(true);
  });

  it('permite confirmado para concluído ou cancelado', () => {
    expect(canTransition('confirmed', 'completed')).toBe(true);
    expect(canTransition('confirmed', 'cancelled')).toBe(true);
  });

  it('não permite pular de agendado direto para concluído', () => {
    expect(canTransition('scheduled', 'completed')).toBe(false);
  });

  it('trata concluído como estado terminal', () => {
    expect(allowedTransitions('completed')).toHaveLength(0);
  });

  it('trata cancelado como estado terminal', () => {
    expect(allowedTransitions('cancelled')).toHaveLength(0);
  });

  it('lança BusinessRuleError em transição inválida', () => {
    expect(() => assertTransition('completed', 'scheduled')).toThrow(BusinessRuleError);
  });
});