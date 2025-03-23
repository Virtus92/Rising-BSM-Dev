/**
 * Validation Middleware
 * 
 * Provides middleware functions for validating request data against schemas.
 * Ensures consistent validation across all API endpoints.
 */
import { Request, Response, NextFunction } from 'express';
import { ValidationSchema } from '../types/validation.js';
import { validateInput } from '../utils/validators.js';
import { ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Validates request body against a schema
 * @param schema - Validation schema
 * @returns Middleware function
 */
export const validateBody = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { validatedData, isValid, errors } = validateInput(
        req.body, 
        schema,
        { throwOnError: false }
      );
      
      if (!isValid) {
        logger.debug('Validation failed', { errors, body: req.body });
        throw new ValidationError('Validation failed', errors);
      }
      
      // Attach validated data to request for use in controller
      (req as any).validatedData = validatedData;
      
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
      const validationResult = validateInput(req.query, schema, { throwOnError: false });

      if (!validationResult.isValid) {
        logger.debug('Query validation failed', { errors: validationResult.errors, query: req.query });
        throw new ValidationError(
          'Query validation failed', 
          validationResult.errors
        );
      }

      // Attach validated query to request for use in controller
      (req as any).validatedQuery = validationResult.validatedData;
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
      const validationResult = validateInput(req.params, schema, { throwOnError: false });

      if (!validationResult.isValid) {
        logger.debug('Params validation failed', { errors: validationResult.errors, params: req.params });
        throw new ValidationError(
          'Params validation failed', 
          validationResult.errors
        );
      }

      // Attach validated parameters to request for use in controller
      (req as any).validatedParams = validationResult.validatedData;
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

      // Validate body if schema provided
      if (bodySchema) {
        const bodyResult = validateInput(req.body, bodySchema, { throwOnError: false });
        if (!bodyResult.isValid) {
          validationErrors.push(...bodyResult.errors.map(err => `Body: ${err}`));
        } else {
          (req as any).validatedData = bodyResult.validatedData;
        }
      }

      // Validate query if schema provided
      if (querySchema) {
        const queryResult = validateInput(req.query, querySchema, { throwOnError: false });
        if (!queryResult.isValid) {
          validationErrors.push(...queryResult.errors.map(err => `Query: ${err}`));
        } else {
          (req as any).validatedQuery = queryResult.validatedData;
        }
      }

      // Validate params if schema provided
      if (paramsSchema) {
        const paramsResult = validateInput(req.params, paramsSchema, { throwOnError: false });
        if (!paramsResult.isValid) {
          validationErrors.push(...paramsResult.errors.map(err => `Params: ${err}`));
        } else {
          (req as any).validatedParams = paramsResult.validatedData;
        }
      }

      // If any validation errors occurred, throw ValidationError
      if (validationErrors.length > 0) {
        logger.debug('Request validation failed', { errors: validationErrors });
        throw new ValidationError(
          'Request validation failed',
          validationErrors
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Common validation schemas for reuse in routes
 */
export const commonSchemas = {
  // ID parameter schema
  idParam: {
    id: {
      type: 'numeric',
      required: true,
      min: 1,
      integer: true
    }
  },
  
  // Pagination query schema
  pagination: {
    page: {
      type: 'numeric',
      required: false,
      min: 1,
      integer: true
    },
    limit: {
      type: 'numeric',
      required: false,
      min: 1,
      max: 100,
      integer: true
    }
  },
  
  // Search query schema
  search: {
    search: {
      type: 'text',
      required: false,
      minLength: 1,
      maxLength: 100
    }
  },
  
  // Date range query schema
  dateRange: {
    start_date: {
      type: 'date',
      required: false
    },
    end_date: {
      type: 'date',
      required: false
    }
  },
  
  // Status query schema
  status: {
    status: {
      type: 'text',
      required: false
    }
  }
};

export default {
  validateBody,
  validateQuery,
  validateParams,
  validateRequest,
  commonSchemas
};