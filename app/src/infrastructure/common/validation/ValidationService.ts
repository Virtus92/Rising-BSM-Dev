import { 
  IValidationService, 
  ValidationSchema, 
  ValidationRule, 
  ValidationResult, 
  ValidationOptions,
  ValidatorFunction
} from './IValidationService';
import { ILoggingService } from '../logging/ILoggingService';
import { IErrorHandler, ValidationError } from '../error/ErrorHandler';
import { ValidationResult as DomainValidationResult, ValidationErrorType } from '@/domain/enums/ValidationResults';
import { createErrorValidation, createSuccessValidation, ValidationResultDto, ValidationErrorDto } from '@/domain/dtos/ValidationDto';

/**
 * Implementierung des Validierungsdienstes
 */
export class ValidationService implements IValidationService {
  /**
   * Eingebaute Validatoren
   */
  private validators: Record<string, ValidatorFunction> = {
    // Grundlegende Typvalidatoren
    string: (value) => typeof value === 'string' || 'Wert muss ein String sein',
    number: (value) => typeof value === 'number' || 'Wert muss eine Zahl sein',
    boolean: (value) => typeof value === 'boolean' || 'Wert muss ein Boolean sein',
    object: (value) => typeof value === 'object' && value !== null || 'Wert muss ein Objekt sein',
    array: (value) => Array.isArray(value) || 'Wert muss ein Array sein',
    enum: (value, options) => {
      if (!options.enum) return 'Enum-Werte nicht angegeben';
      return options.enum.includes(value) || `Wert muss einer der folgenden sein: ${options.enum.join(', ')}`;
    },
    
    // String-Validatoren
    email: (value) => {
      if (typeof value !== 'string') return 'E-Mail muss ein String sein';
      // Einfache E-Mail-Validierung
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) || 'Ungültiges E-Mail-Format';
    },
    url: (value) => {
      if (typeof value !== 'string') return 'URL muss ein String sein';
      try {
        new URL(value);
        return true;
      } catch {
        return 'Ungültiges URL-Format';
      }
    },
    uuid: (value) => {
      if (typeof value !== 'string') return 'UUID muss ein String sein';
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value) || 'Ungültiges UUID-Format';
    },
    
    // Zahlenvalidatoren
    integer: (value) => {
      if (typeof value !== 'number') return 'Wert muss eine Zahl sein';
      return Number.isInteger(value) || 'Wert muss eine ganze Zahl sein';
    },
    positive: (value) => {
      if (typeof value !== 'number') return 'Wert muss eine Zahl sein';
      return value > 0 || 'Wert muss positiv sein';
    },
    negative: (value) => {
      if (typeof value !== 'number') return 'Wert muss eine Zahl sein';
      return value < 0 || 'Wert muss negativ sein';
    },
    
    // Datumsvalidator
    date: (value) => {
      if (value instanceof Date) return true;
      if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        return !isNaN(date.getTime()) || 'Ungültiges Datumsformat';
      }
      return 'Wert muss ein Datum oder ein gültiger Datumsstring sein';
    }
  };
  
  /**
   * Benutzerdefinierte Validierungsregeln
   */
  private customRules: Record<string, ValidatorFunction> = {};
  
  /**
   * Konstruktor
   * 
   * @param logger - Logging-Dienst
   * @param errorHandler - Fehlerbehandlungsdienst
   */
  constructor(
    private readonly logger: ILoggingService,
    private readonly errorHandler?: IErrorHandler
  ) {
    this.logger.debug('Initialized ValidationService');
  }
  
  /**
   * Validiert Daten anhand eines Schemas
   * 
   * @param data - Zu validierende Daten
   * @param schema - Validierungsschema
   * @param options - Validierungsoptionen
   * @returns Validierungsergebnis
   */
  validate<T = any>(data: any, schema: ValidationSchema, options?: ValidationOptions): ValidationResult<T> {
    // Standardoptionen
    const opts = {
      throwOnError: false,
      abortEarly: false,
      stripUnknown: true,
      convert: true,
      ...options
    };
    
    // Initialisiere Validierungsergebnis
    const result: ValidationResult<T> = {
      isValid: true,
      errors: [],
      validatedData: {} as T
    };
    
    // Behandle null oder undefined Daten
    if (data === null || data === undefined) {
      result.isValid = false;
      result.errors.push('Daten sind null oder nicht definiert');
      
      if (opts.throwOnError) {
        if (this.errorHandler) {
          throw this.errorHandler.createValidationError('Validierung fehlgeschlagen: Daten sind null oder nicht definiert');
        } else {
          throw new Error('Validierung fehlgeschlagen: Daten sind null oder nicht definiert');
        }
      }
      
      return result;
    }
    
    // Validiere jedes Feld gemäß Schema
    for (const [field, rule] of Object.entries(schema)) {
      try {
        // Überspringe Felder, die nicht in den Daten vorhanden sind, es sei denn, sie sind erforderlich
        if (!(field in data)) {
          if (rule.required) {
            result.isValid = false;
            const errorMessage = this.getErrorMessage(rule, 'required', `${field} ist erforderlich`);
            result.errors.push(errorMessage);
            
            if (opts.abortEarly) break;
          } else if (rule.default !== undefined) {
            // Verwende Standardwert, wenn das Feld fehlt
            (result.validatedData as any)[field] = rule.default;
          }
          continue;
        }
        
        // Hole den Feldwert
        let value = data[field];
        
        // Wende Transformationen an, falls vorhanden
        if (rule.transform && Array.isArray(rule.transform)) {
          for (const transform of rule.transform) {
            value = transform(value);
          }
        }
        
        // Prüfe, ob das Feld erforderlich ist, aber null oder undefined
        if ((value === null || value === undefined) && rule.required) {
          result.isValid = false;
          const errorMessage = this.getErrorMessage(rule, 'required', `${field} ist erforderlich`);
          result.errors.push(errorMessage);
          
          if (opts.abortEarly) break;
          continue;
        }
        
        // Überspringe weitere Validierung, wenn das Feld null oder undefined ist und nicht erforderlich
        if (value === null || value === undefined) {
          if (rule.default !== undefined) {
            (result.validatedData as any)[field] = rule.default;
          } else {
            (result.validatedData as any)[field] = value;
          }
          continue;
        }
        
        // Typkonvertierung, falls aktiviert
        if (opts.convert) {
          value = this.convertValue(value, rule.type);
        }
        
        // Validiere Typ
        const typeValidation = this.validateType(value, rule);
        
        if (typeValidation !== true) {
          result.isValid = false;
          const errorMessage = this.getErrorMessage(rule, 'type', typeValidation);
          result.errors.push(`${field}: ${errorMessage}`);
          
          if (opts.abortEarly) break;
          continue;
        }
        
        // Validiere zusätzliche Einschränkungen
        const constraintErrors = this.validateConstraints(value, rule);
        
        if (constraintErrors.length > 0) {
          result.isValid = false;
          result.errors.push(...constraintErrors.map(err => `${field}: ${err}`));
          
          if (opts.abortEarly) break;
          continue;
        }
        
        // Validiere mit benutzerdefiniertem Validator, falls vorhanden
        if (rule.validate) {
          const validateResult = rule.validate(value, data);
          
          if (validateResult !== true) {
            result.isValid = false;
            const errorMessage = typeof validateResult === 'string' 
              ? `${field}: ${validateResult}` 
              : `${field}: Ungültiger Wert`;
            result.errors.push(errorMessage);
            
            if (opts.abortEarly) break;
            continue;
          }
        }
        
        // Validierung bestanden, zum validierten Daten hinzufügen
        (result.validatedData as any)[field] = value;
      } catch (error) {
        result.isValid = false;
        result.errors.push(`${field}: ${error instanceof Error ? error.message : String(error)}`);
        
        if (opts.abortEarly) break;
      }
    }
    
    // Wenn stripUnknown false ist, füge unbekannte Felder zu validatedData hinzu
    if (!opts.stripUnknown && typeof data === 'object' && data !== null) {
      for (const field in data) {
        if (!(field in schema) && data[field] !== undefined) {
          (result.validatedData as any)[field] = data[field];
        }
      }
    }
    
    // Wirf Fehler, falls gewünscht und Validierung fehlgeschlagen
    if (!result.isValid && opts.throwOnError) {
      if (this.errorHandler) {
        throw this.errorHandler.createValidationError(
          'Validierung fehlgeschlagen', 
          result.errors
        );
      } else {
        throw new Error(`Validierung fehlgeschlagen: ${result.errors.join(', ')}`);
      }
    }
    
    return result;
  }
  
  /**
   * Validiert Daten anhand eines Schemas und wirft bei Fehlern einen Fehler
   * 
   * @param data - Zu validierende Daten
   * @param schema - Validierungsschema
   * @returns Validierungsergebnis
   */
  validateOrThrow<T extends Record<string, any> | undefined = any>(data: any, schema: ValidationSchema): ValidationResultDto {
    const result = this.validate<T>(data, schema, { throwOnError: true });
    
    return {
      result: DomainValidationResult.SUCCESS,
      data: result.validatedData
    };
  }
  
  /**
   * Validiert ein bestimmtes Feld
   * 
   * @param value - Zu validierender Wert
   * @param rule - Validierungsregel
   * @param field - Feldname
   * @param options - Validierungsoptionen
   * @returns Validierungsergebnis
   */
  validateField(value: any, rule: ValidationRule, field: string, options?: ValidationOptions): ValidationResult<any> {
    // Erstelle ein Schema mit nur diesem Feld
    const schema: ValidationSchema = {
      [field]: rule
    };
    
    // Validiere das Feld mithilfe des Schemas
    return this.validate({ [field]: value }, schema, options);
  }
  
  /**
   * Registriert einen benutzerdefinierten Validierungstyp
   * 
   * @param type - Typname
   * @param validator - Validierungsfunktion
   */
  registerType(type: string, validator: ValidatorFunction): void {
    if (this.validators[type]) {
      this.logger.warn(`Überschreibe vorhandenen Validator für Typ: ${type}`);
    }
    
    this.validators[type] = validator;
    this.logger.debug(`Validator für Typ registriert: ${type}`);
  }
  
  /**
   * Registriert eine benutzerdefinierte Validierungsregel
   * 
   * @param name - Regelname
   * @param validator - Validierungsfunktion
   */
  registerRule(name: string, validator: ValidatorFunction): void {
    if (this.customRules[name]) {
      this.logger.warn(`Überschreibe vorhandene benutzerdefinierte Regel: ${name}`);
    }
    
    this.customRules[name] = validator;
    this.logger.debug(`Benutzerdefinierte Regel registriert: ${name}`);
  }
  
  /**
   * Erstellt ein Validierungsschema aus einer Klasse/Interface
   * 
   * @param target - Klassenkonstruktor oder Objekt mit der Form des Interfaces
   * @returns Validierungsschema
   */
  createSchema(target: any): ValidationSchema {
    // Wenn das Ziel ein Konstruktor ist, erstelle eine Instanz
    const instance = typeof target === 'function' ? new target() : target;
    const schema: ValidationSchema = {};
    
    // Extrahiere Eigenschaften und ihre Typen
    for (const key in instance) {
      const value = instance[key];
      let rule: ValidationRule;
      
      if (value === undefined) {
        // Eigenschaft existiert, aber kein Wert zum Ableiten des Typs
        rule = { type: 'any', required: false };
      } else {
        // Leite Typ aus Wert ab
        const type = this.inferType(value);
        rule = { type, required: false };
        
        // Füge Einschränkungen basierend auf dem Werttyp hinzu
        if (type === 'string' && typeof value === 'string') {
          rule.min = 0;
          rule.max = value.length > 0 ? value.length : undefined;
        } else if (type === 'number' && typeof value === 'number') {
          rule.min = value;
          rule.max = value;
        } else if (type === 'array' && Array.isArray(value)) {
          rule.min = 0;
          rule.max = value.length > 0 ? value.length : undefined;
          
          // Leite Elementtyp ab, wenn das Array nicht leer ist
          if (value.length > 0) {
            rule.items = { type: this.inferType(value[0]) };
          }
        }
      }
      
      schema[key] = rule;
    }
    
    return schema;
  }
  
  /**
   * Bereinigt Daten anhand eines Schemas
   * 
   * @param data - Zu bereinigende Daten
   * @param schema - Schema zur Bereinigung
   * @returns Bereinigte Daten
   */
  sanitize<T>(data: any, schema: ValidationSchema): T {
    if (typeof data !== 'object' || data === null) {
      return data as T;
    }
    
    const sanitized: any = {};
    
    for (const key in schema) {
      if (key in data) {
        sanitized[key] = data[key];
      }
    }
    
    return sanitized as T;
  }
  
  /**
   * Leitet den Typ eines Wertes ab
   * 
   * @param value - Wert, von dem der Typ abgeleitet werden soll
   * @returns Abgeleiteter Typ
   */
  private inferType(value: any): string {
    if (value === null || value === undefined) return 'any';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'object') {
      if (Array.isArray(value)) return 'array';
      if (value instanceof Date) return 'date';
      return 'object';
    }
    return 'any';
  }
  
  /**
   * Validiert einen Wert gegen einen Typ
   * 
   * @param value - Zu validierender Wert
   * @param rule - Validierungsregel
   * @returns Validierungsergebnis
   */
  private validateType(value: any, rule: ValidationRule): true | string {
    const type = rule.type;
    
    // Überspringe Typvalidierung für 'any'-Typ
    if (type === 'any') return true;
    
    // Hole Validator für Typ
    const validator = this.validators[type];
    
    if (!validator) {
      this.logger.warn(`Kein Validator gefunden für Typ: ${type}`);
      return true; // Überspringe Validierung für unbekannte Typen
    }
    
    // Führe Validator aus
    const result = validator(value, rule);
    
    return result === true ? true : (typeof result === 'string' ? result : `Wert muss vom Typ ${type} sein`);
  }
  
  /**
   * Validiert einen Wert gegen Einschränkungen
   * 
   * @param value - Zu validierender Wert
   * @param rule - Validierungsregel
   * @returns Array von Einschränkungsfehlern
   */
  private validateConstraints(value: any, rule: ValidationRule): string[] {
    const errors: string[] = [];
    
    // Validiere String-Einschränkungen
    if (typeof value === 'string' && (rule.type === 'string' || rule.type === 'email' || rule.type === 'url')) {
      if (rule.min !== undefined && value.length < rule.min) {
        errors.push(this.getErrorMessage(rule, 'min', `Wert muss mindestens ${rule.min} Zeichen haben`));
      }
      
      if (rule.max !== undefined && value.length > rule.max) {
        errors.push(this.getErrorMessage(rule, 'max', `Wert darf nicht mehr als ${rule.max} Zeichen haben`));
      }
      
      if (rule.pattern) {
        const pattern = rule.pattern instanceof RegExp ? rule.pattern : new RegExp(rule.pattern);
        if (!pattern.test(value)) {
          errors.push(this.getErrorMessage(rule, 'pattern', 'Wert entspricht nicht dem erforderlichen Muster'));
        }
      }
    }
    
    // Validiere Zahlen-Einschränkungen
    if (typeof value === 'number' && rule.type === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(this.getErrorMessage(rule, 'min', `Wert muss mindestens ${rule.min} sein`));
      }
      
      if (rule.max !== undefined && value > rule.max) {
        errors.push(this.getErrorMessage(rule, 'max', `Wert darf nicht größer als ${rule.max} sein`));
      }
    }
    
    // Validiere Array-Einschränkungen
    if (Array.isArray(value) && rule.type === 'array') {
      if (rule.min !== undefined && value.length < rule.min) {
        errors.push(this.getErrorMessage(rule, 'min', `Array muss mindestens ${rule.min} Elemente enthalten`));
      }
      
      if (rule.max !== undefined && value.length > rule.max) {
        errors.push(this.getErrorMessage(rule, 'max', `Array darf nicht mehr als ${rule.max} Elemente haben`));
      }
      
      // Validiere Array-Elemente, wenn Element-Regel vorhanden ist
      if (rule.items && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          const itemResult = this.validateType(value[i], rule.items);
          if (itemResult !== true) {
            errors.push(`Element at index ${i}: ${itemResult}`);
          }
          
          const itemConstraintErrors = this.validateConstraints(value[i], rule.items);
          if (itemConstraintErrors.length > 0) {
            errors.push(...itemConstraintErrors.map(err => `Element at index ${i}: ${err}`));
          }
        }
      }
    }
    
    // Validiere Objekt-Einschränkungen
    if (typeof value === 'object' && value !== null && !Array.isArray(value) && rule.type === 'object' && rule.schema) {
      const nestedResult = this.validate(value, rule.schema);
      if (!nestedResult.isValid) {
        errors.push(...nestedResult.errors);
      }
    }
    
    // Validiere benutzerdefinierte Regeln
    for (const [ruleName, validator] of Object.entries(this.customRules)) {
      if (ruleName in rule && ruleName !== 'type' && ruleName !== 'required') {
        const ruleValue = (rule as any)[ruleName];
        const validationResult = validator(value, { ...rule, [ruleName]: ruleValue });
        
        if (validationResult !== true) {
          errors.push(typeof validationResult === 'string' ? validationResult : `Validierung für ${ruleName} fehlgeschlagen`);
        }
      }
    }
    
    return errors;
  }
  
  /**
   * Holt die Fehlermeldung für einen Validierungsfehler
   * 
   * @param rule - Validierungsregel
   * @param errorType - Fehlertyp
   * @param defaultMessage - Standardfehlermeldung
   * @returns Fehlermeldung
   */
  private getErrorMessage(rule: ValidationRule, errorType: string, defaultMessage: string): string {
    // Prüfe auf Meldung in rule.messages
    if (rule.messages && errorType in rule.messages) {
      return rule.messages[errorType] as string;
    }
    
    // Prüfe auf allgemeine Meldung
    if (rule.message) {
      return rule.message;
    }
    
    return defaultMessage;
  }
  
  /**
   * Konvertiert einen Wert in den angegebenen Typ
   * 
   * @param value - Zu konvertierender Wert
   * @param type - Zieltyp
   * @returns Konvertierter Wert
   */
  private convertValue(value: any, type: string): any {
    if (value === null || value === undefined) {
      return value;
    }
    
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return String(value);
        }
        break;
        
      case 'number':
        if (typeof value !== 'number') {
          const num = Number(value);
          if (!isNaN(num)) {
            return num;
          }
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          if (value === 'true' || value === '1' || value === 1) {
            return true;
          } else if (value === 'false' || value === '0' || value === 0) {
            return false;
          }
        }
        break;
        
      case 'date':
        if (!(value instanceof Date)) {
          try {
            return new Date(value);
          } catch {
            // Konvertierung in Datum fehlgeschlagen
          }
        }
        break;
        
      case 'array':
        if (!Array.isArray(value)) {
          if (typeof value === 'string') {
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) {
                return parsed;
              }
            } catch {
              // JSON-Parsing fehlgeschlagen
            }
          }
        }
        break;
    }
    
    return value;
  }
}