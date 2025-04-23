import { ValidationResultDto } from '@/domain/dtos/ValidationDto';

/**
 * Validierungsregel
 */
export interface ValidationRule {
  /**
   * Typ des Feldes
   */
  type: string;
  
  /**
   * Ob das Feld erforderlich ist
   */
  required?: boolean;
  
  /**
   * Standardwert
   */
  default?: any;
  
  /**
   * Minimaler Wert/Länge
   */
  min?: number;
  
  /**
   * Maximaler Wert/Länge
   */
  max?: number;
  
  /**
   * Muster, dem der Wert entsprechen muss
   */
  pattern?: string | RegExp;
  
  /**
   * Aufzählungswerte
   */
  enum?: any[];
  
  /**
   * Transformationsfunktionen
   */
  transform?: ((value: any) => any)[];
  
  /**
   * Benutzerdefinierte Validierungsfunktion
   */
  validate?: (value: any, data: any) => boolean | string;
  
  /**
   * Fehlermeldungen
   */
  messages?: Record<string, string>;
  
  /**
   * Allgemeine Fehlermeldung
   */
  message?: string;
  
  /**
   * Verschachteltes Schema (für Objekte)
   */
  schema?: ValidationSchema;
  
  /**
   * Validierungsregel für Array-Elemente
   */
  items?: ValidationRule;
  
  /**
   * Benutzerdefinierte Eigenschaften für erweiterte Validierungstypen
   */
  [key: string]: any;
}

/**
 * Validierungsschema
 */
export type ValidationSchema = Record<string, ValidationRule>;

/**
 * Validierungsergebnis
 */
export interface ValidationResult<T = any> {
  /**
   * Ob die Validierung erfolgreich war
   */
  isValid: boolean;
  
  /**
   * Validierungsfehler
   */
  errors: string[];
  
  /**
   * Validierte Daten
   */
  validatedData: T;
}

/**
 * Validierungsoptionen
 */
export interface ValidationOptions {
  /**
   * Ob bei Validierungsfehlern ein Fehler geworfen werden soll
   */
  throwOnError?: boolean;
  
  /**
   * Ob unbekannte Eigenschaften erlaubt sind
   */
  allowUnknown?: boolean;
  
  /**
   * Ob unbekannte Eigenschaften entfernt werden sollen
   */
  stripUnknown?: boolean;
  
  /**
   * Ob bei einem Fehler abgebrochen werden soll
   */
  abortEarly?: boolean;
  
  /**
   * Ob Typen konvertiert werden sollen
   */
  convert?: boolean;
}

/**
 * Validierungsfunktion
 */
export type ValidatorFunction = (value: any, rule: ValidationRule) => boolean | string;

/**
 * Interface für Validierungsdienste
 */
export interface IValidationService {
  /**
   * Validiert Daten anhand eines Schemas
   * 
   * @param data - Zu validierende Daten
   * @param schema - Validierungsschema
   * @param options - Validierungsoptionen
   * @returns Validierungsergebnis
   */
  validate<T = any>(data: any, schema: ValidationSchema, options?: ValidationOptions): ValidationResult<T>;
  
  /**
   * Validiert Daten anhand eines Schemas und wirft bei Fehlern einen Fehler
   * Integriert mit Domain ValidationResultDto
   * 
   * @param data - Zu validierende Daten
   * @param schema - Validierungsschema
   * @returns Domain-Validierungsergebnis
   */
  validateOrThrow<T = any>(data: any, schema: ValidationSchema): ValidationResultDto;
  
  /**
   * Validiert ein bestimmtes Feld
   * 
   * @param value - Zu validierender Wert
   * @param rule - Validierungsregel
   * @param field - Feldname
   * @param options - Validierungsoptionen
   * @returns Validierungsergebnis
   */
  validateField(value: any, rule: ValidationRule, field: string, options?: ValidationOptions): ValidationResult<any>;
  
  /**
   * Registriert einen benutzerdefinierten Validierungstyp
   * 
   * @param type - Typname
   * @param validator - Validierungsfunktion
   */
  registerType(type: string, validator: ValidatorFunction): void;
  
  /**
   * Registriert eine benutzerdefinierte Validierungsregel
   * 
   * @param name - Regelname
   * @param validator - Validierungsfunktion
   */
  registerRule(name: string, validator: ValidatorFunction): void;
  
  /**
   * Erstellt ein Validierungsschema aus einer Klasse/Interface
   * 
   * @param target - Klassenkonstruktor oder Objekt mit der Form des Interfaces
   * @returns Validierungsschema
   */
  createSchema(target: any): ValidationSchema;
  
  /**
   * Bereinigt Daten anhand eines Schemas
   * 
   * @param data - Zu bereinigende Daten
   * @param schema - Schema zur Bereinigung
   * @returns Bereinigte Daten
   */
  sanitize<T>(data: any, schema: ValidationSchema): T;
}
