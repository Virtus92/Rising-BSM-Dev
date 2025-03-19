"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = void 0;
/**
 * Wraps an async function to properly handle errors and pass them to Express's error handler
 * Allows for different return types (void or Response)
 * @param fn Async handler function to wrap
 * @returns Wrapped function that catches and forwards errors
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next))
            .catch(next);
    };
};
exports.asyncHandler = asyncHandler;
exports.default = exports.asyncHandler;
//# sourceMappingURL=asyncHandler.js.map