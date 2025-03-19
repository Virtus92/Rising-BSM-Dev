"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertValidationSchema = convertValidationSchema;
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
//# sourceMappingURL=validation-types.js.map