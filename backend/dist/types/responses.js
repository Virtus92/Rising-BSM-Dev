"use strict";
/**
 * Standard API response types for consistent frontend integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
exports.createPaginatedResponse = createPaginatedResponse;
// Create a standardized success response
function createSuccessResponse(data, message, meta) {
    return {
        success: true,
        data,
        message,
        meta: {
            ...meta,
            timestamp: new Date().toISOString()
        }
    };
}
// Create a standardized error response
function createErrorResponse(error, errors, code, meta) {
    return {
        success: false,
        error: typeof error === 'string' ? error : error.message,
        errors,
        code,
        meta: {
            ...meta,
            timestamp: new Date().toISOString()
        }
    };
}
// Create a paginated response
function createPaginatedResponse(data, pagination, message, meta) {
    return createSuccessResponse(data, message, {
        ...meta,
        pagination
    });
}
//# sourceMappingURL=responses.js.map