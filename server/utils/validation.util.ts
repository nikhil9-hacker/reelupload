import { BadRequestError } from './error.util';

export interface ValidationRule<T> {
  field: keyof T | string;
  validator: (value: unknown) => boolean;
  message: string;
}

export class ValidationUtil {
  public static isString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  public static isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
  }

  public static isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
  }

  public static isEmail(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  public static isUrl(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  public static validate<T extends Record<string, unknown>>(
    data: T,
    rules: ValidationRule<T>[]
  ): void {
    const errors: string[] = [];

    for (const rule of rules) {
      const fieldKey = rule.field as string;
      const value = data[fieldKey];
      if (!rule.validator(value)) {
        errors.push(`${fieldKey}: ${rule.message}`);
      }
    }

    if (errors.length > 0) {
      throw new BadRequestError('Validation failed', errors);
    }
  }
}
