/**
 * Validation module exports
 * This file exports all validation-related functionality
 */
import { ValidationService } from './ValidationService';

// Singleton instance
let validationService: ValidationService;

/**
 * Returns a singleton instance of ValidationService
 */
export function getValidationService(): ValidationService {
  if (!validationService) {
    validationService = new ValidationService();
  }
  return validationService;
}

// Export interfaces
export { 
  type IValidationService, 
  type ValidationResult, 
  type SchemaDefinition 
} from './IValidationService';

// Export implementation
export { ValidationService } from './ValidationService';

// Export validators
export * from './validators';

// Export user validation utilities
export { validateUserData as validateUserCreate, validateUserData as validateUserUpdate } from './userValidation';
