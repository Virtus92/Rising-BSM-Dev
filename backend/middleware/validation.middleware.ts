/**
 * Validation Middleware
 * 
 * Provides middleware functions for validating request data against schemas.
 * Ensures consistent validation across all API endpoints.
 */
import { Request, Response, NextFunction } from 'express';
import { ValidationSchema } from '../types/validation.types.js';
import { ValidationError } from '../utils/errors.js';
import validator from '../utils/validators.js';
import logger from '../utils/logger.js';

/**
 * Validates request body against a schema
 * @param schema - Validation schema
 * @returns Middleware function
 */
export const validateBody = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validationResult = validator.validate(req.body, schema);

      if (!validationResult.isValid) {
        logger.debug('Validation failed', { errors: validationResult.errors, body: req.body });
        throw new ValidationError(
          'Validation failed', 
          validationResult.errors,
          { invalidFields: validationResult.invalidFields }
        );
      }

      // Attach validated data to request for use in controller
      (req as any).validatedData = validationResult.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validates request query parameters against a schema
 * @param schema - Validation schema
 * @returns Middleware function
 */
export const validateQuery = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validationResult = validator.validate(req.query, schema);

      if (!validationResult.isValid) {
        logger.debug('Query validation failed', { errors: validationResult.errors, query: req.query });
        throw new ValidationError(
          'Query validation failed', 
          validationResult.errors,
          { invalidFields: validationResult.invalidFields }
        );
      }

      // Attach validated query to request for use in controller
      (req as any).validatedQuery = validationResult.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validates request parameters against a schema
 * @param schema - Validation schema
 * @returns Middleware function
 */
export const validateParams = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validationResult = validator.validate(req.params, schema);

      if (!validationResult.isValid) {
        logger.debug('Params validation failed', { errors: validationResult.errors, params: req.params });
        throw new ValidationError(
          'Params validation failed', 
          validationResult.errors,
          { invalidFields: validationResult.invalidFields }
        );
      }

      // Attach validated parameters to request for use in controller
      (req as any).validatedParams = validationResult.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Creates a combined validation middleware for multiple request parts
 * @param bodySchema - Schema for request body
 * @param querySchema - Schema for query parameters
 * @param paramsSchema - Schema for route parameters
 * @returns Middleware function
 */
export const validateRequest = (
  bodySchema?: ValidationSchema,
  querySchema?: ValidationSchema,
  paramsSchema?: ValidationSchema
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validationErrors: string[] = [];
      const invalidFields: Record<string, string[]> = {};

      // Validate body if schema provided
      if (bodySchema) {
        const bodyResult = validator.validate(req.body, bodySchema);
        if (!bodyResult.isValid) {
          validationErrors.push(...bodyResult.errors);
          invalidFields.body = bodyResult.invalidFields;
        } else {
          (req as any).validatedData = bodyResult.data;
        }
      }

      // Validate query if schema provided
      if (querySchema) {
        const queryResult = validator.validate(req.query, querySchema);
        if (!queryResult.isValid) {
          validationErrors.push(...queryResult.errors);
          invalidFields.query = queryResult.invalidFields;
        } else {
          (req as any).validatedQuery = queryResult.data;
        }
      }

      // Validate params if schema provided
      if (paramsSchema) {
        const paramsResult = validator.validate(req.params, paramsSchema);
        if (!paramsResult.isValid) {
          validationErrors.push(...paramsResult.errors);
          invalidFields.params = paramsResult.invalidFields;
        } else {
          (req as any).validatedParams = paramsResult.data;
        }
      }

      // If any validation errors occurred, throw ValidationError
      if (validationErrors.length > 0) {
        logger.debug('Request validation failed', { errors: validationErrors, invalidFields });
        throw new ValidationError(
          'Request validation failed',
          validationErrors,
          { invalidFields }
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default {
  validateBody,
  validateQuery,
  validateParams,
  validateRequest
};