const EXCLUSION_VIOLATION = '23P01';

export function isExclusionViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const code = (err as { code?: unknown }).code;
  return code === EXCLUSION_VIOLATION;
}