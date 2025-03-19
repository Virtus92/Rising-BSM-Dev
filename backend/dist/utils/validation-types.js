"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertValidationSchema = convertValidationSchema;
exports.isValidType = isValidType;
// Helper function to convert extended schema to standard schema
function convertValidationSchema(schema) {
    const converted = {};
    for (const [key, rule] of Object.entries(schema)) {
        converted[key] = {
            ...rule,
            type: rule.type
        };
    }
    return converted;
}
// Type guard to ensure validation schema types are correct
function isValidType(type) {
    return ['text', 'email', 'phone', 'date', 'numeric', 'password', 'time'].includes(type);
}
//# sourceMappingURL=validation-types.js.map