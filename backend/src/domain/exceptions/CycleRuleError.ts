export class CycleRuleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'CycleRuleError';
  }
}

export class ValidationError extends Error {
  constructor(public readonly fields: Record<string, string>) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

