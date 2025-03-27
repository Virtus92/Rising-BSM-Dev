/**
 * Validation Service Configuration
 * Configuration and setup for application-wide validation mechanisms.
 */

import { IValidationService, ValidationSchema, ValidationRule } from '../interfaces/IValidationService.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';

/**
 * Get validation schema for a specific entity type
 * 
 * @param entityType - Type of entity to get schema for
 * @param operation - Operation type (create, update, patch)
 * @returns Validation schema for the entity and operation
 */
export function getValidationSchema(entityType: string, operation: 'create' | 'update' | 'patch'): ValidationSchema {
    // Import schemas based on entity type
    switch (entityType) {
        case 'user':
            return getUserSchema(operation);
        case 'customer':
            return getCustomerSchema(operation);
        case 'role':
            return getRoleSchema(operation);
        case 'permission':
            return getPermissionSchema(operation);
        case 'notification':
            return getNotificationSchema(operation);
        default:
            // Return empty schema if entity type not recognized
            return {};
    }
}

/**
 * Get validation schema for User entity
 * 
 * @param operation - Operation type
 * @returns User validation schema
 */
function getUserSchema(operation: 'create' | 'update' | 'patch'): ValidationSchema {
    const baseSchema: ValidationSchema = {
        username: {
            type: 'string',
            required: operation === 'create',
            min: 3,
            max: 50,
            pattern: '^[a-zA-Z0-9_-]+$',
            messages: {
                required: 'Username is required',
                min: 'Username must be at least 3 characters',
                max: 'Username cannot exceed 50 characters',
                pattern: 'Username can only contain letters, numbers, underscores and hyphens'
            }
        },
        email: {
            type: 'email',
            required: operation === 'create',
            messages: {
                required: 'Email is required',
                email: 'Invalid email format'
            }
        },
        firstName: {
            type: 'string',
            required: operation === 'create',
            min: 1,
            max: 50,
            messages: {
                required: 'First name is required',
                min: 'First name cannot be empty',
                max: 'First name cannot exceed 50 characters'
            }
        },
        lastName: {
            type: 'string',
            required: operation === 'create',
            min: 1,
            max: 50,
            messages: {
                required: 'Last name is required',
                min: 'Last name cannot be empty',
                max: 'Last name cannot exceed 50 characters'
            }
        },
        roles: {
            type: 'array',
            required: false,
            items: {
                type: 'number'
            },
            messages: {
                type: 'Roles must be an array',
                items: 'Role IDs must be numbers'
            }
        },
        status: {
            type: 'string',
            required: false,
            enum: ['active', 'inactive', 'suspended', 'deleted'],
            messages: {
                enum: 'Status must be one of: active, inactive, suspended, deleted'
            }
        }
    };

    // Add password field for create operations
    if (operation === 'create') {
        baseSchema.password = {
            type: 'string',
            required: true,
            min: 8,
            max: 100,
            messages: {
                required: 'Password is required',
                min: 'Password must be at least 8 characters',
                max: 'Password cannot exceed 100 characters'
            }
        };
    }

    return baseSchema;
}

/**
 * Get validation schema for Customer entity
 * 
 * @param operation - Operation type
 * @returns Customer validation schema
 */
function getCustomerSchema(operation: 'create' | 'update' | 'patch'): ValidationSchema {
    return {
        name: {
            type: 'string',
            required: operation === 'create',
            min: 2,
            max: 100,
            messages: {
                required: 'Name is required',
                min: 'Name must be at least 2 characters',
                max: 'Name cannot exceed 100 characters'
            }
        },
        company: {
            type: 'string',
            required: false,
            max: 100,
            messages: {
                max: 'Company name cannot exceed 100 characters'
            }
        },
        email: {
            type: 'email',
            required: false,
            messages: {
                email: 'Invalid email format'
            }
        },
        phone: {
            type: 'string',
            required: false,
            max: 20,
            messages: {
                max: 'Phone number cannot exceed 20 characters'
            }
        },
        status: {
            type: 'string',
            required: false,
            enum: ['aktiv', 'inaktiv', 'pausiert', 'geloescht'],
            messages: {
                enum: 'Status must be one of: aktiv, inaktiv, pausiert, geloescht'
            }
        },
        type: {
            type: 'string',
            required: false,
            enum: ['privat', 'geschaeft'],
            messages: {
                enum: 'Type must be one of: privat, geschaeft'
            }
        }
    };
}

/**
 * Get validation schema for Role entity
 * 
 * @param operation - Operation type
 * @returns Role validation schema
 */
function getRoleSchema(operation: 'create' | 'update' | 'patch'): ValidationSchema {
    return {
        name: {
            type: 'string',
            required: operation === 'create',
            min: 2,
            max: 50,
            messages: {
                required: 'Role name is required',
                min: 'Role name must be at least 2 characters',
                max: 'Role name cannot exceed 50 characters'
            }
        },
        description: {
            type: 'string',
            required: false,
            max: 200,
            messages: {
                max: 'Description cannot exceed 200 characters'
            }
        },
        isSystem: {
            type: 'boolean',
            required: false,
            default: false
        },
        permissions: {
            type: 'array',
            required: false,
            items: {
                type: 'number'
            },
            messages: {
                type: 'Permissions must be an array',
                items: 'Permission IDs must be numbers'
            }
        }
    };
}

/**
 * Get validation schema for Permission entity
 * 
 * @param operation - Operation type
 * @returns Permission validation schema
 */
function getPermissionSchema(operation: 'create' | 'update' | 'patch'): ValidationSchema {
    return {
        name: {
            type: 'string',
            required: operation === 'create',
            min: 2,
            max: 50,
            messages: {
                required: 'Permission name is required',
                min: 'Permission name must be at least 2 characters',
                max: 'Permission name cannot exceed 50 characters'
            }
        },
        description: {
            type: 'string',
            required: false,
            max: 200,
            messages: {
                max: 'Description cannot exceed 200 characters'
            }
        },
        category: {
            type: 'string',
            required: operation === 'create',
            messages: {
                required: 'Category is required'
            }
        }
    };
}

/**
 * Get validation schema for Notification entity
 * 
 * @param operation - Operation type
 * @returns Notification validation schema
 */
function getNotificationSchema(operation: 'create' | 'update' | 'patch'): ValidationSchema {
    return {
        userId: {
            type: 'number',
            required: operation === 'create',
            integer: true,
            min: 1,
            messages: {
                required: 'User ID is required',
                integer: 'User ID must be an integer',
                min: 'User ID must be positive'
            }
        },
        title: {
            type: 'string',
            required: operation === 'create',
            min: 1,
            max: 100,
            messages: {
                required: 'Title is required',
                min: 'Title cannot be empty',
                max: 'Title cannot exceed 100 characters'
            }
        },
        message: {
            type: 'string',
            required: false,
            max: 500,
            messages: {
                max: 'Message cannot exceed 500 characters'
            }
        },
        type: {
            type: 'string',
            required: operation === 'create',
            enum: ['system', 'info', 'warning', 'error', 'success', 'appointment', 'project', 'message', 'update'],
            messages: {
                required: 'Type is required',
                enum: 'Type must be one of: system, info, warning, error, success, appointment, project, message, update'
            }
        },
        read: {
            type: 'boolean',
            required: false,
            default: false
        }
    };
}

/**
 * Configure the validation service with custom rules
 * 
 * @param validationService - Validation service to configure
 * @param logger - Logging service
 */
export function configureValidationService(
    validationService: IValidationService,
    logger: ILoggingService
): void {
    logger.debug('Configuring validation service...');

    // Register custom validators
    validationService.registerType('password', (value, options) => {
        if (typeof value !== 'string') return 'Password must be a string';
        
        const { min = 8, max = 100, requireSpecialChar = true } = options || {};
        
        if (value.length < min) return `Password must be at least ${min} characters`;
        if (value.length > max) return `Password cannot exceed ${max} characters`;
        
        if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
            return 'Password must contain at least one special character';
        }
        
        return true;
    });
    
    // Add phone number validation
    validationService.registerType('phone', (value) => {
        if (!value) return true; // Optional
        if (typeof value !== 'string') return 'Phone number must be a string';
        
        // Basic phone number validation - can be enhanced based on requirements
        const phoneRegex = /^[+]?[\d\s()-]{8,20}$/;
        return phoneRegex.test(value) || 'Invalid phone number format';
    });

    logger.debug('Validation service configured');
}