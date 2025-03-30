import { IValidationService } from '../../../src/interfaces/IValidationService.js';

/**
 * Mock implementation of IValidationService for testing
 */
export class MockValidationService implements IValidationService {
  public validations: Record<string, any[]> = {
    validate: [],
    validateEmail: [],
    validatePassword: [],
    validateLength: [],
    validateRequired: [],
    validateEnum: [],
    validateNumeric: [],
    validateAlphanumeric: [],
    validateDate: [],
    validateUUID: [],
    validateCustom: []
  };

  constructor() {}

  validate(value: any, validations: ((value: any) => string | null)[]): string[] {
    this.validations.validate.push({ value, validations });
    return []; // Default to no validation errors
  }

  validateEmail(value: string): string | null {
    this.validations.validateEmail.push({ value });
    return value.includes('@') ? null : 'Invalid email format';
  }

  validatePassword(value: string, options?: { minLength?: number }): string | null {
    const minLength = options?.minLength || 8;
    this.validations.validatePassword.push({ value, options });
    return value.length >= minLength ? null : `Password must be at least ${minLength} characters`;
  }

  validateLength(value: string, min: number, max?: number): string | null {
    this.validations.validateLength.push({ value, min, max });
    if (value.length < min) {
      return `Value must be at least ${min} characters`;
    }
    if (max !== undefined && value.length > max) {
      return `Value cannot exceed ${max} characters`;
    }
    return null;
  }

  validateRequired(value: any): string | null {
    this.validations.validateRequired.push({ value });
    return value === null || value === undefined || value === '' 
      ? 'Value is required' 
      : null;
  }

  validateEnum<T>(value: any, allowedValues: T[]): string | null {
    this.validations.validateEnum.push({ value, allowedValues });
    return allowedValues.includes(value as T) 
      ? null 
      : `Value must be one of: ${allowedValues.join(', ')}`;
  }

  validateNumeric(value: string): string | null {
    this.validations.validateNumeric.push({ value });
    return /^\d+$/.test(value) ? null : 'Value must be numeric';
  }

  validateAlphanumeric(value: string): string | null {
    this.validations.validateAlphanumeric.push({ value });
    return /^[a-zA-Z0-9]+$/.test(value) ? null : 'Value must be alphanumeric';
  }

  validateDate(value: string): string | null {
    this.validations.validateDate.push({ value });
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? 'Invalid date format' : null;
    } catch (e) {
      return 'Invalid date format';
    }
  }

  validateUUID(value: string): string | null {
    this.validations.validateUUID.push({ value });
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(value) ? null : 'Invalid UUID format';
  }

  validateCustom(value: any, validationFn: (value: any) => string | null): string | null {
    this.validations.validateCustom.push({ value, validationFn });
    return null; // Default to success in the mock
  }

  // Helper method to clear validation history
  public clearValidations(): void {
    Object.keys(this.validations).forEach(key => {
      this.validations[key as keyof typeof this.validations] = [];
    });
  }

  // Helper method to mock validation errors
  public mockValidationError(method: keyof typeof this.validations, error: string): void {
    const originalMethod = this[method as keyof this];
    this[method as keyof this] = jest.fn().mockReturnValue(error);
  }

  // Helper method to reset mocked methods
  public resetMocks(): void {
    Object.keys(this.validations).forEach(key => {
      if (jest.isMockFunction(this[key as keyof this])) {
        (this[key as keyof this] as jest.Mock).mockRestore();
      }
    });
  }
}

/**
 * Factory to create a mock validation service instance
 */
export function createMockValidationService(): MockValidationService {
  return new MockValidationService();
}
