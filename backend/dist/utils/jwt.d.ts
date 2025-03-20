export interface TokenPayload {
    userId: number;
    role: string;
    email?: string;
    name?: string;
}
export interface TokenResult {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export declare const generateToken: (payload: TokenPayload) => string;
export declare const verifyToken: (token: string) => TokenPayload;
export declare const generateRefreshToken: (userId: number) => string;
export declare const verifyRefreshToken: (token: string) => number;
export declare const generateAuthTokens: (payload: TokenPayload) => TokenResult;
export declare const extractTokenFromHeader: (authHeader?: string) => string | null;
