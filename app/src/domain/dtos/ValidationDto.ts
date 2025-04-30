import { ValidationResult, ValidationErrorType } from '../enums/ValidationResults';

/**
 * DTO für ein Validierungsergebnis
 */
export interface ValidationResultDto {
  /**
   * Ergebnis der Validierung
   */
  result: ValidationResult;
  
  /**
   * Fehler bei Validierungsfehler
   */
  errors?: ValidationErrorDto[];
  
  /**
   * Warnungen bei Validierungswarnung
   */
  warnings?: ValidationWarningDto[];
  
  /**
   * Benutzerdefinierte Daten
   */
  data?: Record<string, any>;

  /**
   * Convenience property to check if validation is valid
   * Returns true if result is SUCCESS, false otherwise
   */
  isValid?: boolean;
}

/**
 * DTO für einen Validierungsfehler
 */
export interface ValidationErrorDto {
  /**
   * Fehlertyp
   */
  type: ValidationErrorType;
  
  /**
   * Feld, das den Fehler verursacht hat
   */
  field: string;
  
  /**
   * Fehlermeldung
   */
  message: string;
  
  /**
   * Zusätzliche Fehlerdaten
   */
  data?: Record<string, any>;
}

/**
 * DTO für eine Validierungswarnung
 */
export interface ValidationWarningDto {
  /**
   * Warnungstyp
   */
  type: ValidationErrorType;
  
  /**
   * Feld, das die Warnung verursacht hat
   */
  field: string;
  
  /**
   * Warnungsmeldung
   */
  message: string;
  
  /**
   * Zusätzliche Warnungsdaten
   */
  data?: Record<string, any>;
}

/**
 * Erstellt ein erfolgreiches Validierungsergebnis
 * 
 * @param data Optionale Daten, die im Ergebnis enthalten sein sollen
 * @returns Erfolgreiches Validierungsergebnis
 */
export function createSuccessValidation(data?: Record<string, any>): ValidationResultDto {
  return {
    result: ValidationResult.SUCCESS,
    isValid: true,
    data
  };
}

/**
 * Erstellt ein Validierungsergebnis mit Fehlern
 * 
 * @param errors Validierungsfehler
 * @param data Optionale Daten, die im Ergebnis enthalten sein sollen
 * @returns Validierungsergebnis mit Fehlern
 */
export function createErrorValidation(
  errors: ValidationErrorDto[],
  data?: Record<string, any>
): ValidationResultDto {
  return {
    result: ValidationResult.ERROR,
    isValid: false,
    errors,
    data
  };
}

/**
 * Erstellt ein Validierungsergebnis mit Warnungen
 * 
 * @param warnings Validierungswarnungen
 * @param data Optionale Daten, die im Ergebnis enthalten sein sollen
 * @returns Validierungsergebnis mit Warnungen
 */
export function createWarningValidation(
  warnings: ValidationWarningDto[],
  data?: Record<string, any>
): ValidationResultDto {
  return {
    result: ValidationResult.WARNING,
    isValid: true, // Warnings are still considered valid
    warnings,
    data
  };
}

/**
 * Erstellt einen Validierungsfehler
 * 
 * @param type Fehlertyp
 * @param field Feld, das den Fehler verursacht hat
 * @param message Fehlermeldung
 * @param data Optionale Fehlerdaten
 * @returns Validierungsfehler
 */
export function createValidationError(
  type: ValidationErrorType,
  field: string,
  message: string,
  data?: Record<string, any>
): ValidationErrorDto {
  return {
    type,
    field,
    message,
    data
  };
}

/**
 * Erstellt eine Validierungswarnung
 * 
 * @param type Warnungstyp
 * @param field Feld, das die Warnung verursacht hat
 * @param message Warnungsmeldung
 * @param data Optionale Warnungsdaten
 * @returns Validierungswarnung
 */
export function createValidationWarning(
  type: ValidationErrorType,
  field: string,
  message: string,
  data?: Record<string, any>
): ValidationWarningDto {
  return {
    type,
    field,
    message,
    data
  };
}
