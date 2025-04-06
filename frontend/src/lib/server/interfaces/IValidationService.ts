/**
 * Ergebnis einer Validierung
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Interface für den Validierungs-Service
 */
export interface IValidationService {
  /**
   * Validiert ein Objekt gegen Validierungsregeln
   */
  validate(data: any, rules: ValidationRules): ValidationResult;

  /**
   * Validiert eine E-Mail-Adresse
   */
  validateEmail(email: string): ValidationResult;
  
  /**
   * Validiert ein Passwort
   */
  validatePassword(password: string): ValidationResult;
}

/**
 * Validierungsregel-Definitionen
 */
export interface ValidationRules {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date';
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean;
    message?: string;
  };
}
