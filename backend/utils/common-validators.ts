import { ValidationError } from './errors.js';

/**
 * Validiert eine E-Mail-Adresse
 */
export function validateEmail(email: string, fieldName: string = 'Email'): void {
  if (!email) {
    throw new ValidationError(`${fieldName} ist erforderlich`);
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError(`Ungültiges E-Mail-Format: ${email}`);
  }
}

/**
 * Validiert eine Telefonnummer
 */
export function validatePhone(phone: string, required: boolean = false): void {
  if (!phone) {
    if (required) {
      throw new ValidationError('Telefonnummer ist erforderlich');
    }
    return;
  }
  
  // Einfache Validierung - kann je nach Anforderung erweitert werden
  if (phone.length < 5) {
    throw new ValidationError('Ungültiges Telefonnummer-Format');
  }
}

/**
 * Validiert ein Datum
 */
export function validateDate(date: string | Date, fieldName: string = 'Datum'): Date {
  if (!date) {
    throw new ValidationError(`${fieldName} ist erforderlich`);
  }
  
  const parsedDate = date instanceof Date ? date : new Date(date);
  
  if (isNaN(parsedDate.getTime())) {
    throw new ValidationError(`Ungültiges Datumsformat für ${fieldName}: ${date}`);
  }
  
  return parsedDate;
}

/**
 * Validiert einen Pflichtfeldwert
 */
export function validateRequired(
  value: any, 
  fieldName: string, 
  minLength?: number, 
  maxLength?: number
): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} ist erforderlich`);
  }
  
  if (typeof value === 'string') {
    if (minLength !== undefined && value.length < minLength) {
      throw new ValidationError(`${fieldName} muss mindestens ${minLength} Zeichen lang sein`);
    }
    
    if (maxLength !== undefined && value.length > maxLength) {
      throw new ValidationError(`${fieldName} darf maximal ${maxLength} Zeichen lang sein`);
    }
  }
}