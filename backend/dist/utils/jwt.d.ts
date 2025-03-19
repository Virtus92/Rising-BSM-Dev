/**
 * User payload structure for JWT tokens
 */
export interface TokenPayload {
    userId: number;
    role: string;
    email?: string;
    name?: string;
}
/**
 * Response structure for token generation
 */
export interface TokenResult {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
/**
 * Generate JWT access token
 * @param payload User information to encode in token
 * @returns JWT token string
 */
export declare const generateToken: (payload: TokenPayload) => string;
/**
 * Verify and decode JWT token
 * @param token JWT token to verify
 * @returns Decoded token payload
 * @throws UnauthorizedError if token is invalid or expired
 */
export declare const verifyToken: (token: string) => TokenPayload;
/**
 * Generate refresh token
 * @param userId User ID to encode in token
 * @returns Refresh token string
 */
export declare const generateRefreshToken: (userId: number) => string;
/**
 * Verify refresh token
 * @param token Refresh token to verify
 * @returns User ID from token
 * @throws UnauthorizedError if token is invalid or expired
 */
export declare const verifyRefreshToken: (token: string) => number;
/**
 * Generate both access and refresh tokens
 * @param payload User information for tokens
 * @returns Object containing both tokens and expiration
 */
export declare const generateAuthTokens: (payload: TokenPayload) => TokenResult;
/**
 * Extract token from authorization header
 * @param authHeader Authorization header value
 * @returns Token or null if not found
 */
export declare const extractTokenFromHeader: (authHeader?: string) => string | null;
