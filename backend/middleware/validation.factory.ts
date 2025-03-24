import { Request, Response, NextFunction } from 'express';
import { ValidationSchema } from '../types/validation.types.js';
import { validateInput } from '../utils/validation.utils.js';
import { ValidationError } from '../utils/error.utils.js';

/**
 * Factory function to create validation middleware
 */
export function createValidationMiddleware<T>(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { validatedData, isValid, errors } = validateInput<T>(
        req.body, 
        schema,
        { throwOnError: false }
      );
      
      if (!isValid) {
        throw new ValidationError('Validation failed', errors);
      }
      
      // Attach validated data to request
      (req as any).validatedData = validatedData;
      
      next();
    } catch (error) {
      next(error);
    }
  };
}
