import { IValidationService, ValidationResult, ValidationRules } from '../interfaces/IValidationService';

/**
 * Standard-Validierungs-Service-Implementierung
 */
export class ValidationService implements IValidationService {
  /**
   * Validiert ein Objekt gegen Validierungsregeln
   */
  validate(data: any, rules: ValidationRules): ValidationResult {
    const errors: string[] = [];
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      
      // Prüfen auf Pflichtfelder
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} ist ein Pflichtfeld`);
        continue;
      }
      
      // Wenn der Wert nicht vorhanden ist und nicht erforderlich, überspringen
      if (value === undefined || value === null) {
        continue;
      }
      
      // Typ-Validierung
      if (rule.type) {
        const actualType = this.getType(value);
        if (actualType !== rule.type) {
          errors.push(`${field} muss vom Typ ${rule.type} sein, ist aber ${actualType}`);
        }
      }
      
      // Validierung für Strings
      if (typeof value === 'string') {
        if (rule.min !== undefined && value.length < rule.min) {
          errors.push(`${field} muss mindestens ${rule.min} Zeichen haben`);
        }
        
        if (rule.max !== undefined && value.length > rule.max) {
          errors.push(`${field} darf maximal ${rule.max} Zeichen haben`);
        }
        
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(rule.message || `${field} entspricht nicht dem erforderlichen Format`);
        }
      }
      
      // Validierung für Zahlen
      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${field} muss mindestens ${rule.min} sein`);
        }
        
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${field} darf maximal ${rule.max} sein`);
        }
      }
      
      // Benutzerdefinierte Validierung
      if (rule.custom && !rule.custom(value)) {
        errors.push(rule.message || `${field} ist ungültig`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validiert eine E-Mail-Adresse
   */
  validateEmail(email: string): ValidationResult {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!email || !emailRegex.test(email)) {
      return {
        isValid: false,
        errors: ['Ungültige E-Mail-Adresse']
      };
    }
    
    return {
      isValid: true,
      errors: []
    };
  }
  
  /**
   * Validiert ein Passwort
   */
  validatePassword(password: string): ValidationResult {
    const errors = [];
    
    if (!password || password.length < 8) {
      errors.push('Das Passwort muss mindestens 8 Zeichen lang sein');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Das Passwort muss mindestens einen Großbuchstaben enthalten');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Das Passwort muss mindestens einen Kleinbuchstaben enthalten');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Das Passwort muss mindestens eine Zahl enthalten');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Ermittelt den Typ eines Werts
   */
  private getType(value: any): string {
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    return typeof value;
  }
}
