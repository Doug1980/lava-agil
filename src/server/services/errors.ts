export class BusinessRuleError extends Error {
  constructor(
    public readonly rule: string,
    message: string,
  ) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

export function isBusinessRuleError(err: unknown): err is BusinessRuleError {
  return err instanceof BusinessRuleError;
}