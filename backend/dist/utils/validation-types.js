"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertValidationSchema = convertValidationSchema;
exports.isValidType = isValidType;
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
function isValidType(type) {
    return ['text', 'email', 'phone', 'date', 'numeric', 'password', 'time'].includes(type);
}
//# sourceMappingURL=validation-types.js.map