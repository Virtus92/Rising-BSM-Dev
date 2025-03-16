const profileController = require('../../controllers/profile.controller');
const pool = require('../../services/db.service');
const bcrypt = require('bcryptjs');
const { mockRequest, mockResponse, mockDbClient } = require('../setup');

// Mock dependencies
jest.mock('../../services/db.service');
jest.mock('bcryptjs');

describe('Profile Controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request, response, next
    mockReq = mockRequest();
    mockReq.session.user = { id: 1, name: 'Test User', email: 'test@example.com', role: 'user' };
    mockRes = mockResponse();
    mockNext = jest.fn();

    // Default pool query mock implementation
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
  });

  describe('getUserProfile', () => {
    it('should return user profile data', async () => {
      // Mock database responses for user data
      pool.query.mockImplementation((query) => {
        if (query.text.includes('SELECT id, name')) {
          return Promise.resolve({ 
            rows: [{
              id: 1,
              name: 'Test User',
              email: 'test@example.com',
              telefon: '1234567890',
              rolle: 'user',
              profilbild: '/uploads/profile/user1.jpg',
              erstellt_am: '2023-01-01T10:00:00Z',
              updated_at: '2023-01-10T15:30:00Z'
            }]
          });
        } else if (query.text.includes('benutzer_einstellungen')) {
          return Promise.resolve({
            rows: [{
              sprache: 'de',
              dark_mode: true,
              benachrichtigungen_email: true,
              benachrichtigungen_intervall: 'sofort'
            }]
          });
        } else if (query.text.includes('benutzer_aktivitaet')) {
          return Promise.resolve({
            rows: [
              {
                aktivitaet: 'login',
                ip_adresse: '192.168.1.1',
                erstellt_am: '2023-01-10T14:00:00Z'
              },
              {
                aktivitaet: 'profile_updated',
                ip_adresse: '192.168.1.1',
                erstellt_am: '2023-01-05T10:30:00Z'
              }
            ]
          });
        }
        return Promise.resolve({ rows: [] });
      });

      // Execute the controller method
      const result = await profileController.getUserProfile(mockReq, mockRes, mockNext);

      // Assertions
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('settings');
      expect(result).toHaveProperty('activity');
      expect(result.user.name).toBe('Test User');
      expect(result.user.email).toBe('test@example.com');
      expect(result.settings.sprache).toBe('de');
      expect(result.activity).toHaveLength(2);
    });

    it('should handle user not found error', async () => {
      // Mock empty database response for user
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      await profileController.getUserProfile(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile data', async () => {
      // Mock request body
      mockReq.body = {
        name: 'Updated Name',
        email: 'updated@example.com',
        telefon: '9876543210'
      };

      // Execute the controller method
      const result = await profileController.updateProfile(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(2); // Update + Activity log
      expect(result).toHaveProperty('success', true);
      expect(result.user.name).toBe('Updated Name');
      expect(result.user.email).toBe('updated@example.com');
    });

    it('should check if email is unique when changed', async () => {
      // Mock request body with changed email
      mockReq.body = {
        name: 'Test User',
        email: 'existing@example.com', // Different from session email
        telefon: '1234567890'
      };

      // Mock database response for email check
      pool.query.mockImplementationOnce((query) => {
        if (query.text.includes('SELECT id FROM benutzer WHERE email')) {
          return Promise.resolve({ rows: [{ id: 2 }] }); // Another user has this email
        }
        return Promise.resolve({ rows: [] });
      });

      // Execute the controller method
      await profileController.updateProfile(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].message).toContain('already in use');
    });

    it('should validate required fields', async () => {
      // Mock request body with missing required fields
      mockReq.body = {
        name: '', // Empty name
        email: '' // Empty email
      };

      // Execute the controller method
      await profileController.updateProfile(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].message).toContain('required');
    });
  });

  describe('updatePassword', () => {
    it('should update user password when current password is correct', async () => {
      // Mock request body
      mockReq.body = {
        current_password: 'current123',
        new_password: 'newpassword123',
        confirm_password: 'newpassword123'
      };

      // Mock user query response
      pool.query.mockResolvedValueOnce({
        rows: [{ passwort: 'hashedcurrentpassword' }]
      });

      // Mock bcrypt password compare
      bcrypt.compare.mockResolvedValueOnce(true);

      // Mock bcrypt hash
      bcrypt.hash.mockResolvedValueOnce('hashedNewPassword');

      // Execute the controller method
      const result = await profileController.updatePassword(mockReq, mockRes, mockNext);

      // Assertions
      expect(bcrypt.compare).toHaveBeenCalledWith('current123', 'hashedcurrentpassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(pool.query).toHaveBeenCalledTimes(3); // Get password + Update password + Log activity
      expect(result).toHaveProperty('success', true);
      expect(result.message).toContain('updated successfully');
    });

    it('should reject if current password is incorrect', async () => {
      // Mock request body
      mockReq.body = {
        current_password: 'wrongpassword',
        new_password: 'newpassword123',
        confirm_password: 'newpassword123'
      };

      // Mock user query response
      pool.query.mockResolvedValueOnce({
        rows: [{ passwort: 'hashedcurrentpassword' }]
      });

      // Mock bcrypt password compare - returns false for wrong password
      bcrypt.compare.mockResolvedValueOnce(false);

      // Execute the controller method
      await profileController.updatePassword(mockReq, mockRes, mockNext);

      // Assertions
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedcurrentpassword');
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0].message).toContain('incorrect');
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should validate password confirmation match', async () => {
      // Mock request body with mismatched passwords
      mockReq.body = {
        current_password: 'current123',
        new_password: 'newpassword123',
        confirm_password: 'differentpassword'
      };

      // Execute the controller method
      await profileController.updatePassword(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0].message).toContain('do not match');
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should validate password length', async () => {
      // Mock request body with short password
      mockReq.body = {
        current_password: 'current123',
        new_password: 'short',
        confirm_password: 'short'
      };

      // Execute the controller method
      await profileController.updatePassword(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0].message).toContain('at least 8 characters');
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });
  });

  describe('updateProfilePicture', () => {
    it('should update user profile picture', async () => {
      // Mock file upload
      mockReq.file = {
        filename: 'profile1234.jpg',
        path: '/tmp/uploads/profile1234.jpg'
      };

      // Execute the controller method
      const result = await profileController.updateProfilePicture(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('UPDATE benutzer SET profilbild')
        }),
        expect.any(Array)
      );
      expect(result).toHaveProperty('success', true);
      expect(result.imagePath).toContain('profile1234.jpg');
    });

    it('should handle missing file error', async () => {
      // No file in request
      mockReq.file = undefined;

      // Execute the controller method
      await profileController.updateProfilePicture(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0].message).toContain('No image file uploaded');
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });
  });

  describe('updateNotificationSettings', () => {
    it('should create notification settings if none exist', async () => {
      // Mock request body
      mockReq.body = {
        benachrichtigungen_email: 'on',
        benachrichtigungen_push: 'off',
        benachrichtigungen_intervall: 'taeglich'
      };

      // Mock empty settings query response (no existing settings)
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      const result = await profileController.updateNotificationSettings(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('INSERT INTO benutzer_einstellungen')
        }),
        expect.any(Array)
      );
      expect(result).toHaveProperty('success', true);
    });

    it('should update existing notification settings', async () => {
      // Mock request body
      mockReq.body = {
        benachrichtigungen_email: 'on',
        benachrichtigungen_push: 'on',
        benachrichtigungen_intervall: 'woechentlich'
      };

      // Mock settings query response (existing settings)
      pool.query.mockResolvedValueOnce({ rows: [{ benutzer_id: 1 }] });

      // Execute the controller method
      const result = await profileController.updateNotificationSettings(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(pool.query).toHaveBeenCalledWith(expect.objectContaining({
          text: expect.stringContaining('SELECT benutzer_id FROM benutzer_einstellungen')
        }),expect.any(Array));
      expect(pool.query).toHaveBeenCalledWith(expect.objectContaining({
          text: expect.stringContaining('UPDATE benutzer_einstellungen')
        }),expect.any(Array));
      expect(result).toHaveProperty('success', true);
    });
  });
});
