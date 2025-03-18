// Using CommonJS syntax instead of ES modules
const ProfileController = require('../../controllers/profile.controller');
const bcrypt = require('bcryptjs');
const pool = require('../../services/db.service');

// Mock dependencies
jest.mock('../../services/db.service');
jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
    hash: jest.fn()
}));
jest.mock('../../utils/formatters', () => ({
    formatDateSafely: jest.fn((_date, _format) => new Date().toLocaleDateString('de-DE'))
}));

describe('Profile Controller', () => {
    // Mock request and response objects
    let req, res, next;
    
    beforeEach(() => {
        req = {
            body: {},
            session: { user: { id: 1 } }, // Changed from req.user to req.session.user
            ip: '127.0.0.1'
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    describe('updatePassword', () => {
        it('should update password successfully', async () => {
            req.body = {
                current_password: 'oldpassword',
                new_password: 'newpassword123',
                confirm_password: 'newpassword123'
            };
            
            // Removed duplicate mock implementations
            bcrypt.compare.mockResolvedValueOnce(true);
            bcrypt.hash.mockResolvedValueOnce('hashedpassword');
            
            pool.query
                .mockResolvedValueOnce({ rows: [{ passwort: 'hashedoldpassword' }] })
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({});
            
            await ProfileController.updatePassword(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json.mock.calls[0][0].success).toBe(true);
        });

        it('should validate password fields', async () => {
            req.body = {
                current_password: '',
                new_password: '',
                confirm_password: ''
            };
            
            await ProfileController.updatePassword(req, res, next);
            
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
        });

        it('should validate password matching', async () => {
            req.body = {
                current_password: 'oldpassword',
                new_password: 'newpassword123',
                confirm_password: 'differentpassword'
            };
            
            await ProfileController.updatePassword(req, res, next);
            
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
            expect(next.mock.calls[0][0].message).toContain('do not match');
        });

        it('should validate password length', async () => {
            req.body = {
                current_password: 'oldpassword',
                new_password: 'short',
                confirm_password: 'short'
            };
            
            await ProfileController.updatePassword(req, res, next);
            
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
            expect(next.mock.calls[0][0].message).toContain('at least 8 characters');
        });

        it('should verify current password', async () => {
            req.body = {
                current_password: 'wrongpassword',
                new_password: 'newpassword123',
                confirm_password: 'newpassword123'
            };
            
            bcrypt.compare.mockResolvedValueOnce(false);
            
            pool.query.mockResolvedValueOnce({ rows: [{ passwort: 'hashedoldpassword' }] });
            
            await ProfileController.updatePassword(req, res, next);
            
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
            expect(next.mock.calls[0][0].message).toContain('Current password is incorrect');
        });

        it('should handle database error', async () => {
            req.body = {
            current_password: 'oldpassword',
            new_password: 'newpassword123',
            confirm_password: 'newpassword123'
            };
            
            bcrypt.compare.mockResolvedValueOnce(true);
            bcrypt.hash.mockResolvedValueOnce('hashedpassword');
            
            pool.query.mockRejectedValueOnce(new Error('Database error'));
            
            await ProfileController.updatePassword(req, res, next);
            
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].message).toBe('Database error');
        });

        it('should handle user not found', async () => {
            req.body = {
            current_password: 'oldpassword',
            new_password: 'newpassword123',
            confirm_password: 'newpassword123'
            };
            
            pool.query.mockResolvedValueOnce({ rows: [] });
            
            await ProfileController.updatePassword(req, res, next);
            
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(404);
            expect(next.mock.calls[0][0].message).toBe('User not found');
        });
    });

    describe('updateProfilePicture', () => {
        it('should update profile picture successfully', async () => {
            req.file = { filename: 'profile-123.jpg' };
            
            pool.query.mockResolvedValueOnce({});
            
            await ProfileController.updateProfilePicture(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json.mock.calls[0][0].success).toBe(true);
            expect(res.json.mock.calls[0][0].imagePath).toContain('/uploads/profile/profile-123.jpg');
        });

        it('should validate file upload', async () => {
            req.file = undefined;
            
            await ProfileController.updateProfilePicture(req, res, next);
            
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
        });
    });

    describe('updateNotificationSettings', () => {
        it('should create new notification settings if none exist', async () => {
            req.body = {
                benachrichtigungen_email: 'on',
                benachrichtigungen_push: 'off',
                benachrichtigungen_intervall: 'täglich'
            };
            
            pool.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({});
            
            await ProfileController.updateNotificationSettings(req, res, next); // Added controller call
            
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json.mock.calls[0][0].success).toBe(true);
        });

        it('should update existing notification settings', async () => {
            req.body = {
                benachrichtigungen_email: 'on',
                benachrichtigungen_push: 'off',
                benachrichtigungen_intervall: 'täglich'
            };
            
            pool.query
                .mockResolvedValueOnce({ rows: [{ benutzer_id: 1 }] })
                .mockResolvedValueOnce({});
            
            await ProfileController.updateNotificationSettings(req, res, next); // Added controller call
            
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json.mock.calls[0][0].success).toBe(true);
        });

        it('should handle database error', async () => {
            req.body = {
                benachrichtigungen_email: 'on',
                benachrichtigungen_push: 'off',
                benachrichtigungen_intervall: 'täglich'
            };
        
            pool.query.mockRejectedValueOnce(new Error('Database error'));
        
            await ProfileController.updateNotificationSettings(req, res, next);
        
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].message).toBe('Database error');
        });
        
    });

    describe('getUserProfile', () => {
        it('should retrieve user profile data successfully', async () => {
            // Arrange
            req.session.user = { id: 1 };
            
            pool.query
                .mockResolvedValueOnce({ 
                    rows: [{
                        id: 1,
                        name: 'Test User',
                        email: 'test@example.com',
                        telefon: '123456789',
                        rolle: 'admin',
                        profilbild: '/uploads/profile/test.jpg',
                        erstellt_am: new Date('2023-01-01')
                    }]
                })
                .mockResolvedValueOnce({ 
                    rows: [{
                        sprache: 'de',
                        dark_mode: false,
                        benachrichtigungen_email: true,
                        benachrichtigungen_intervall: 'sofort'
                    }]
                })
                .mockResolvedValueOnce({
                    rows: [
                        {
                            aktivitaet: 'login',
                            ip_adresse: '127.0.0.1',
                            erstellt_am: new Date()
                        }
                    ]
                });
            
            // Act
            await ProfileController.getUserProfile(req, res, next);
            
            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response).toHaveProperty('user');
            expect(response).toHaveProperty('settings');
            expect(response).toHaveProperty('activity');
            expect(response.user.name).toBe('Test User');
        });

        it('should return 404 when user not found', async () => {
            // Arrange
            req.session.user = { id: 999 };
            pool.query.mockResolvedValueOnce({ rows: [] });
            
            // Act
            await ProfileController.getUserProfile(req, res, next);
            
            // Assert
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(404);
            expect(next.mock.calls[0][0].message).toContain('User not found');
        });
    });

    describe('updateProfile', () => {
        it('should update user profile successfully', async () => {
            // Arrange
            req.session.user = { id: 1, email: 'old@example.com' };
            req.body = {
                name: 'Updated Name',
                email: 'new@example.com',
                telefon: '987654321'
            };
            
            pool.query.mockResolvedValueOnce({ rows: [] }) // Email check
                .mockResolvedValueOnce({}) // Update user
                .mockResolvedValueOnce({}); // Log activity
            
            // Act
            await ProfileController.updateProfile(req, res, next);
            
            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json.mock.calls[0][0].success).toBe(true);
        });

        it('should validate required fields', async () => {
            // Arrange
            req.session.user = { id: 1 };
            req.body = { name: '' }; // Missing required fields
            
            // Act
            await ProfileController.updateProfile(req, res, next);
            
            // Assert
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
        });

        it('should check for duplicate email', async () => {
            // Arrange
            req.session.user = { id: 1, email: 'old@example.com' };
            req.body = { 
                name: 'Updated Name',
                email: 'taken@example.com' // Email that's already in use
            };
            
            pool.query.mockResolvedValueOnce({ rows: [{ id: 2 }] }); // Return another user with this email
            
            // Act
            await ProfileController.updateProfile(req, res, next);
            
            // Assert
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
            expect(next.mock.calls[0][0].message).toContain('already in use');
        });
    });
});