/**
 * Validation Middleware
 * 
 * Middleware for validating request data against schemas.
 * Supports validation of request body, query parameters, and URL parameters.
 */
import { Request, Response, NextFunction } from 'express';
import { ValidationSchema, ValidationOptions } from '../types/validation.types.js';
import { validateInput } from '../utils/validation.utils.js';
import { ValidationError } from '../utils/error.utils.js';
import { logger } from '../utils/common.utils.js';

/**
 * Validates request body against a schema
 * @param schema Validation schema
 * @param options Validation options
 * @returns Validation middleware
 */
export const validateBody = (
  schema: ValidationSchema, 
  options: ValidationOptions = {}
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { validatedData, isValid, errors } = validateInput(
        req.body, 
        schema,
        { throwOnError: false, ...options }
      );
      
      if (!isValid) {
        logger.debug('Body validation failed', { errors, body: req.body });
        throw new ValidationError('Body validation failed', errors);
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
 * @param schema Validation schema
 * @param options Validation options
 * @returns Validation middleware
 */
export const validateQuery = (
  schema: ValidationSchema, 
  options: ValidationOptions = {}
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { validatedData, isValid, errors } = validateInput(
        req.query, 
        schema, 
        { throwOnError: false, ...options }
      );

      if (!isValid) {
        logger.debug('Query validation failed', { errors, query: req.query });
        throw new ValidationError('Query validation failed', errors);
      }

      // Attach validated query to request for use in controller
      (req as any).validatedQuery = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validates request URL parameters against a schema
 * @param schema Validation schema
 * @param options Validation options
 * @returns Validation middleware
 */
export const validateParams = (
  schema: ValidationSchema, 
  options: ValidationOptions = {}
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { validatedData, isValid, errors } = validateInput(
        req.params, 
        schema, 
        { throwOnError: false, ...options }
      );

      if (!isValid) {
        logger.debug('Params validation failed', { errors, params: req.params });
        throw new ValidationError('Params validation failed', errors);
      }

      // Attach validated parameters to request for use in controller
      (req as any).validatedParams = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validates request against multiple schemas
 * @param bodySchema Schema for request body
 * @param querySchema Schema for query parameters
 * @param paramsSchema Schema for URL parameters
 * @param options Validation options
 * @returns Combined validation middleware
 */
export const validateRequest = (
  bodySchema?: ValidationSchema,
  querySchema?: ValidationSchema,
  paramsSchema?: ValidationSchema,
  options: ValidationOptions = {}
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validationErrors: string[] = [];

      // Validate body if schema provided
      if (bodySchema) {
        const bodyResult = validateInput(req.body, bodySchema, { throwOnError: false, ...options });
        if (!bodyResult.isValid) {
          validationErrors.push(...bodyResult.errors.map(err => `Body: ${err}`));
        } else {
          (req as any).validatedData = bodyResult.validatedData;
        }
      }

      // Validate query if schema provided
      if (querySchema) {
        const queryResult = validateInput(req.query, querySchema, { throwOnError: false, ...options });
        if (!queryResult.isValid) {
          validationErrors.push(...queryResult.errors.map(err => `Query: ${err}`));
        } else {
          (req as any).validatedQuery = queryResult.validatedData;
        }
      }

      // Validate params if schema provided
      if (paramsSchema) {
        const paramsResult = validateInput(req.params, paramsSchema, { throwOnError: false, ...options });
        if (!paramsResult.isValid) {
          validationErrors.push(...paramsResult.errors.map(err => `Params: ${err}`));
        } else {
          (req as any).validatedParams = paramsResult.validatedData;
        }
      }

      // If any validation errors occurred, throw ValidationError
      if (validationErrors.length > 0) {
        logger.debug('Request validation failed', { errors: validationErrors });
        throw new ValidationError('Request validation failed', validationErrors);
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
      type: 'number' as const,
      required: true,
      min: 1,
      integer: true,
      messages: {
        required: 'ID is required',
        type: 'ID must be a number',
        min: 'ID must be positive',
        integer: 'ID must be an integer'
      }
    }
  },
  
  // Pagination query schema
  pagination: {
    page: {
      type: 'number' as const,
      required: false,
      min: 1,
      integer: true,
      messages: {
        type: 'Page must be a number',
        min: 'Page must be at least 1',
        integer: 'Page must be an integer'
      }
    },
    limit: {
      type: 'number' as const,
      required: false,
      min: 1,
      max: 100,
      integer: true,
      messages: {
        type: 'Limit must be a number',
        min: 'Limit must be at least 1',
        max: 'Limit must not exceed 100',
        integer: 'Limit must be an integer'
      }
    }
  },
  
  // Search query schema
  search: {
    search: {
      type: 'string' as const,
      required: false,
      minLength: 1,
      maxLength: 100,
      messages: {
        type: 'Search must be a string',
        minLength: 'Search must be at least 1 character',
        maxLength: 'Search must not exceed 100 characters'
      }
    }
  },
  
  // Date range query schema
  dateRange: {
    startDate: {
      type: 'date' as const,
      required: false,
      messages: {
        type: 'Start date must be a valid date'
      }
    },
    endDate: {
      type: 'date' as const,
      required: false,
      messages: {
        type: 'End date must be a valid date'
      }
    }
  },
  
  // Status query schema
  status: {
    status: {
      type: 'string' as const,
      required: false,
      messages: {
        type: 'Status must be a string'
      }
    }
  },
  
  // Sort options schema
  sort: {
    sortBy: {
      type: 'string' as const,
      required: false,
      messages: {
        type: 'Sort field must be a string'
      }
    },
    sortDirection: {
      type: 'enum' as const,
      required: false,
      enum: ['asc', 'desc'],
      default: 'desc',
      messages: {
        type: 'Sort direction must be a string',
        enum: 'Sort direction must be either "asc" or "desc"'
      }
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