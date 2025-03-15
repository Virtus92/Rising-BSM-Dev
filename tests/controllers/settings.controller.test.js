const settingsController = require('../../controllers/settings.controller');
const pool = require('../../services/db.service');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('../../services/db.service');
jest.mock('fs');
jest.mock('path');

describe('Settings Controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request, response, next
    mockReq = {
      session: {
        user: { id: 1, name: 'Test User', role: 'admin' }
      },
      ip: '127.0.0.1',
      body: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockNext = jest.fn();

    // Default pool query mock implementation
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
  });

  describe('getUserSettings', () => {
    it('should return user settings', async () => {
      // Mock database response
      pool.query.mockResolvedValueOnce({
        rows: [{
          sprache: 'de',
          dark_mode: true,
          benachrichtigungen_email: true,
          benachrichtigungen_push: false,
          benachrichtigungen_intervall: 'woechentlich'
        }]
      });

      // Execute the controller method
      const result = await settingsController.getUserSettings(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledWith({
        text: expect.stringContaining('SELECT * FROM benutzer_einstellungen'),
        values: [1]
      });
      expect(result).toHaveProperty('settings');
      expect(result.settings.sprache).toBe('de');
      expect(result.settings.dark_mode).toBe(true);
      expect(result.settings.benachrichtigungen_intervall).toBe('woechentlich');
    });

    it('should return default settings if none exist', async () => {
      // Mock empty database response
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      const result = await settingsController.getUserSettings(mockReq, mockRes, mockNext);

      // Assertions
      expect(result).toHaveProperty('settings');
      expect(result.settings.sprache).toBe('de');
      expect(result.settings.dark_mode).toBe(false);
      expect(result.settings.benachrichtigungen_email).toBe(true);
    });

    it('should handle errors', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);

      // Execute the controller method
      await settingsController.getUserSettings(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].success).toBe(false);
    });
  });

  describe('updateUserSettings', () => {
    it('should update existing user settings', async () => {
      // Setup request body
      mockReq.body = {
        sprache: 'en',
        dark_mode: 'on',
        benachrichtigungen_email: 'on',
        benachrichtigungen_push: false,
        benachrichtigungen_intervall: 'taeglich'
      };

      // Mock database response for settings check
      pool.query.mockResolvedValueOnce({ rows: [{ benutzer_id: 1 }] });
      
      // Mock database response for update
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      
      // Mock database response for log
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      const result = await settingsController.updateUserSettings(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(3);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Settings updated successfully');
    });

    it('should create new settings if none exist', async () => {
      // Setup request body
      mockReq.body = {
        sprache: 'en',
        dark_mode: true,
        benachrichtigungen_email: true,
        benachrichtigungen_intervall: 'taeglich'
      };

      // Mock empty database response for settings check
      pool.query.mockResolvedValueOnce({ rows: [] });
      
      // Mock database response for insert
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      
      // Mock database response for log
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      const result = await settingsController.updateUserSettings(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(3);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Settings updated successfully');
    });

    it('should validate language setting', async () => {
      // Setup request body with invalid language
      mockReq.body = {
        sprache: 'fr', // Not supported
        benachrichtigungen_intervall: 'taeglich'
      };

      // Execute the controller method
      await settingsController.updateUserSettings(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toContain('Invalid language');
    });

    it('should validate notification interval setting', async () => {
      // Setup request body with invalid interval
      mockReq.body = {
        sprache: 'de',
        benachrichtigungen_intervall: 'monatlich' // Not supported
      };

      // Execute the controller method
      await settingsController.updateUserSettings(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toContain('Invalid notification interval');
    });
  });

  describe('getSystemSettings', () => {
    it('should return system settings for admin', async () => {
      // Mock database response
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            kategorie: 'system',
            einstellung: 'app_name',
            wert: 'Rising BSM',
            beschreibung: 'Application name',
            typ: 'text'
          },
          {
            kategorie: 'email',
            einstellung: 'smtp_host',
            wert: 'smtp.example.com',
            beschreibung: 'SMTP Host',
            typ: 'text'
          }
        ]
      });

      // Execute the controller method
      const result = await settingsController.getSystemSettings(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM system_einstellungen')
      );
      expect(result).toHaveProperty('settings');
      expect(result.settings).toHaveProperty('system');
      expect(result.settings).toHaveProperty('email');
    });

    it('should deny access for non-admin users', async () => {
      // Setup non-admin user
      mockReq.session.user.role = 'user';

      // Execute the controller method
      try {
        await settingsController.getSystemSettings(mockReq, mockRes, mockNext);
      } catch (error) {
        // We expect it to throw an error
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Unauthorized');
        expect(error.statusCode).toBe(403);
      }
    });
  });

  describe('updateSystemSettings', () => {
    it('should update system settings for admin', async () => {
      // Setup request body
      mockReq.body = {
        settings: {
          'app_name': 'Rising BSM Updated',
          'smtp_host': 'new-smtp.example.com'
        }
      };

      // Mock database responses
      pool.query.mockResolvedValue({ rowCount: 1 });

      // Execute the controller method
      const result = await settingsController.updateSystemSettings(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(3); // Two settings + log entry
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'System settings updated successfully');
    });

    it('should deny access for non-admin users', async () => {
      // Setup non-admin user
      mockReq.session.user.role = 'user';

      // Execute the controller method
      try {
        await settingsController.updateSystemSettings(mockReq, mockRes, mockNext);
      } catch (error) {
        // We expect it to throw an error
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Unauthorized');
        expect(error.statusCode).toBe(403);
      }
    });

    it('should validate settings data', async () => {
      // Setup invalid request body
      mockReq.body = {
        settings: 'not an object'
      };

      // Execute the controller method
      try {
        await settingsController.updateSystemSettings(mockReq, mockRes, mockNext);
      } catch (error) {
        // We expect it to throw an error
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Invalid settings data');
        expect(error.statusCode).toBe(400);
      }
    });
  });

  describe('getBackupSettings', () => {
    it('should return backup settings for admin', async () => {
      // Mock database responses
      pool.query.mockResolvedValueOnce({
        rows: [{
          automatisch: true,
          intervall: 'taeglich',
          zeit: '02:00',
          aufbewahrung: 7,
          letzte_ausfuehrung: '2023-06-01T02:00:00Z',
          status: 'erfolg'
        }]
      });
      
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            dateiname: 'backup_20230601.sql',
            groesse: 1024000,
            erstellt_am: '2023-06-01T02:00:00Z',
            status: 'erfolg'
          }
        ]
      });

      // Execute the controller method
      const result = await settingsController.getBackupSettings(mockReq, mockRes, mockNext);

      // Assertions
      expect(result).toHaveProperty('settings');
      expect(result).toHaveProperty('backups');
      expect(result.settings.automatisch).toBe(true);
      expect(result.settings.intervall).toBe('taeglich');
      expect(result.backups).toHaveLength(1);
    });

    it('should return default settings if none exist', async () => {
      // Mock empty database response
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      const result = await settingsController.getBackupSettings(mockReq, mockRes, mockNext);

      // Assertions
      expect(result).toHaveProperty('settings');
      expect(result.settings.automatisch).toBe(true);
      expect(result.settings.intervall).toBe('taeglich');
      expect(result.backups).toHaveLength(0);
    });

    it('should deny access for non-admin users', async () => {
      // Setup non-admin user
      mockReq.session.user.role = 'user';

      // Execute the controller method
      try {
        await settingsController.getBackupSettings(mockReq, mockRes, mockNext);
      } catch (error) {
        // We expect it to throw an error
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Unauthorized');
        expect(error.statusCode).toBe(403);
      }
    });
  });
});
