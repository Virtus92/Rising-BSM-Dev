const authController = require('../../controllers/auth.controller');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../../services/db.service');

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('crypto');
jest.mock('../../services/db.service');

describe('Auth Controller', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {
            body: {},
            ip: '127.0.0.1',
            session: {},
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('login', () => {
        test('should return error when email is missing', async () => {
            req.body = { password: 'password123' };

            await authController.login(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                message: 'Email and password are required'
            }));
        });

        test('should return error when password is missing', async () => {
            req.body = { email: 'user@example.com' };

            await authController.login(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                message: 'Email and password are required'
            }));
        });

        test('should return error when user is not found', async () => {
            req.body = { email: 'nonexistent@example.com', password: 'password123' };
            pool.query.mockResolvedValueOnce({ rows: [] });

            await authController.login(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 401,
                message: 'Invalid email or password'
            }));
        });

        test('should return error when password is incorrect', async () => {
            req.body = { email: 'user@example.com', password: 'wrongpassword' };
            pool.query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    email: 'user@example.com',
                    passwort: 'hashedpassword',
                    name: 'Test User',
                    rolle: 'user',
                    status: 'aktiv'
                }]
            });
            bcrypt.compare.mockResolvedValueOnce(false);

            await authController.login(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 401,
                message: 'Invalid email or password'
            }));
        });

        test('should return error when account is inactive', async () => {
            req.body = { email: 'user@example.com', password: 'password123' };
            pool.query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    email: 'user@example.com',
                    passwort: 'hashedpassword',
                    name: 'Test User',
                    rolle: 'user',
                    status: 'inaktiv'
                }]
            });
            bcrypt.compare.mockResolvedValueOnce(true);

            await authController.login(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 403,
                message: 'Account is inactive or suspended'
            }));
        });

        test('should return user data when login is successful', async () => {
            req.body = { email: 'user@example.com', password: 'password123', remember: 'off' };
            pool.query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    email: 'user@example.com',
                    passwort: 'hashedpassword',
                    name: 'Test User',
                    rolle: 'user',
                    status: 'aktiv'
                }]
            });
            pool.query.mockResolvedValueOnce({ rowCount: 1 });
            bcrypt.compare.mockResolvedValueOnce(true);

            await authController.login(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                user: {
                    id: 1,
                    email: 'user@example.com',
                    name: 'Test User',
                    role: 'user',
                    initials: 'TU'
                },
                remember: false
            });
        });

        test('should handle remember me functionality', async () => {
            req.body = { email: 'user@example.com', password: 'password123', remember: 'on' };
            pool.query.mockResolvedValueOnce({
            rows: [{
                id: 1,
                email: 'user@example.com',
                passwort: 'hashedpassword',
                name: 'Test User',
                rolle: 'user',
                status: 'aktiv'
            }]
            });
            bcrypt.compare.mockResolvedValueOnce(true);

            await authController.login(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
            user: {
                id: 1,
                email: 'user@example.com',
                name: 'Test User',
                role: 'user',
                initials: 'TU'
            },
            remember: true
            });
        });
    });

    describe('forgotPassword', () => {
        test('should return error when email is missing', async () => {
            await authController.forgotPassword(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                message: 'Please provide a valid email address'
            }));
        });

        test('should return success even when user is not found', async () => {
            req.body = { email: 'nonexistent@example.com' };
            pool.query.mockResolvedValueOnce({ rows: [] });

            await authController.forgotPassword(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'If an account with this email exists, password reset instructions have been sent'
            });
        });

        test('should generate reset token when user exists', async () => {
            req.body = { email: 'user@example.com' };
            pool.query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    email: 'user@example.com'
                }]
            });
            pool.query.mockResolvedValueOnce({ rowCount: 1 });

            const mockToken = 'mockresettoken';
            const mockHashedToken = 'mockhashedtoken';

            crypto.randomBytes.mockReturnValueOnce({
                toString: jest.fn().mockReturnValueOnce(mockToken)
            });

            const mockHashUpdate = {
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValueOnce(mockHashedToken)
            };

            crypto.createHash.mockReturnValueOnce(mockHashUpdate);

            await authController.forgotPassword(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                userId: 1,
                email: 'user@example.com',
                token: mockToken,
                message: 'If an account with this email exists, password reset instructions have been sent'
            });
        });

        test('should sanitize email input', async () => {
            req.body = { email: '  User@Example.com  ' }; // Email with spaces and mixed case
            
            pool.query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    email: 'user@example.com'
                }]
            });
            pool.query.mockResolvedValueOnce({ rowCount: 1 });
            
            // Same token setup as in other tests
            const mockToken = 'mockresettoken';
            const mockHashedToken = 'mockhashedtoken';
            crypto.randomBytes.mockReturnValueOnce({
                toString: jest.fn().mockReturnValueOnce(mockToken)
            });
            const mockHashUpdate = {
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValueOnce(mockHashedToken)
            };
            crypto.createHash.mockReturnValueOnce(mockHashUpdate);

            await authController.forgotPassword(req, res, next);
            
            // Check that sanitized email is used in query
            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM benutzer WHERE email = $1',
                ['user@example.com'] // Should be lowercase, trimmed
            );
        });
    });

    describe('validateResetToken', () => {
        test('should return error when token is missing', async () => {
            await authController.validateResetToken(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                message: 'Invalid token'
            }));
        });

        test('should return error when token is invalid or expired', async () => {
            req.params = { token: 'invalidtoken' };

            const mockHashUpdate = {
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValueOnce('hashedtoken')
            };

            crypto.createHash.mockReturnValueOnce(mockHashUpdate);
            pool.query.mockResolvedValueOnce({ rows: [] });

            await authController.validateResetToken(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                message: 'Invalid or expired token'
            }));
        });

        test('should return user data when token is valid', async () => {
            req.params = { token: 'validtoken' };

            const mockHashUpdate = {
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValueOnce('hashedtoken')
            };

            crypto.createHash.mockReturnValueOnce(mockHashUpdate);
            pool.query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    email: 'user@example.com'
                }]
            });

            await authController.validateResetToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                userId: 1,
                email: 'user@example.com'
            });
        });
    });

    describe('resetPassword', () => {
        test('should return error when passwords are missing', async () => {
            req.params = { token: 'validtoken' };

            await authController.resetPassword(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                message: 'Please enter and confirm your new password'
            }));
        });

        test('should return error when passwords do not match', async () => {
            req.params = { token: 'validtoken' };
            req.body = { password: 'newpassword', confirmPassword: 'differentpassword' };

            await authController.resetPassword(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                message: 'Passwords do not match'
            }));
        });

        test('should return error when password is too short', async () => {
            req.params = { token: 'validtoken' };
            req.body = { password: 'short', confirmPassword: 'short' };

            await authController.resetPassword(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                message: 'Password must be at least 12 characters long'
            }));
        });

        test('should return error when password does not meet complexity requirements', async () => {
            req.params = { token: 'validtoken' };
            req.body = { password: 'longpassword123', confirmPassword: 'longpassword123' };

            await authController.resetPassword(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                message: expect.stringContaining('Password must contain')
            }));
        });

        test('should return success when password is reset', async () => {
            req.params = { token: 'validtoken' };
            // Use a password that meets all validation requirements
            req.body = { password: 'NewP@ssword123', confirmPassword: 'NewP@ssword123' };

            const mockHashUpdate = {
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValueOnce('hashedtoken')
            };

            crypto.createHash.mockReturnValueOnce(mockHashUpdate);
            pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            bcrypt.hash.mockResolvedValueOnce('newhashedpassword');
            pool.query.mockResolvedValueOnce({ rowCount: 1 });
            pool.query.mockResolvedValueOnce({ rowCount: 1 });

            await authController.resetPassword(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Password has been reset successfully'
            });
        });
    });

    describe('logout', () => {
        test('should log logout activity when user is logged in', async () => {
            req.session = { user: { id: 1 } };
            pool.query.mockResolvedValueOnce({ rowCount: 1 });

            await authController.logout(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true });
            expect(pool.query).toHaveBeenCalledWith(
                expect.any(String),
                [1, 'logout', '127.0.0.1']
            );
        });

        test('should return success when no user session exists', async () => {
            await authController.logout(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true });
            expect(pool.query).not.toHaveBeenCalled();
        });
    });
});