import { Request, Response, NextFunction } from 'express';
import { ValidationSchema, IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';

export class ValidationMiddleware {
  constructor(
    private readonly validationService: IValidationService,
    private readonly errorHandler: IErrorHandler
  ) {}

  /**
   * Validate request body against a given schema
   * 
   * @param schema - Validation schema
   * @returns Middleware function
   */
  public validate(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      const { isValid, errors, validatedData } = this.validationService.validate(
        req.body, 
        schema, 
        { 
          throwOnError: false, 
          stripUnknown: true 
        }
      );

      if (!isValid) {
        const validationError = this.errorHandler.createValidationError(
          'Validation failed', 
          errors
        );
        return next(validationError);
      }

      // Replace request body with validated and potentially transformed data
      req.body = validatedData;
      next();
    };
  }
}