"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTokenFromHeader = exports.generateAuthTokens = exports.verifyRefreshToken = exports.generateRefreshToken = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("./errors");
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-super-secret-key-that-should-be-in-env';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-super-secret-key-that-should-be-in-env';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
if (process.env.NODE_ENV === 'development') {
    if (process.env.JWT_SECRET === undefined) {
        console.warn('⚠️ Warning: JWT_SECRET is not set in environment variables');
    }
    if (process.env.JWT_REFRESH_SECRET === undefined) {
        console.warn('⚠️ Warning: JWT_REFRESH_SECRET is not set in environment variables');
    }
}
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errors_1.UnauthorizedError('Invalid token');
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new errors_1.UnauthorizedError('Token expired');
        }
        else {
            throw error;
        }
    }
};
exports.verifyToken = verifyToken;
const generateRefreshToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};
exports.generateRefreshToken = generateRefreshToken;
const verifyRefreshToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
        return decoded.userId;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errors_1.UnauthorizedError('Invalid refresh token');
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new errors_1.UnauthorizedError('Refresh token expired');
        }
        else {
            throw error;
        }
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
const generateAuthTokens = (payload) => {
    const accessToken = (0, exports.generateToken)(payload);
    const refreshToken = (0, exports.generateRefreshToken)(payload.userId);
    let expiresIn = 3600;
    const expiresMatch = JWT_EXPIRES_IN.match(/^(\d+)([smhd])$/);
    if (expiresMatch) {
        const value = parseInt(expiresMatch[1]);
        const unit = expiresMatch[2];
        switch (unit) {
            case 's':
                expiresIn = value;
                break;
            case 'm':
                expiresIn = value * 60;
                break;
            case 'h':
                expiresIn = value * 60 * 60;
                break;
            case 'd':
                expiresIn = value * 24 * 60 * 60;
                break;
        }
    }
    return {
        accessToken,
        refreshToken,
        expiresIn
    };
};
exports.generateAuthTokens = generateAuthTokens;
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader)
        return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
};
exports.extractTokenFromHeader = extractTokenFromHeader;
//# sourceMappingURL=jwt.js.map