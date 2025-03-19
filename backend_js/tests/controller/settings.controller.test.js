const settingsController = require('../../controllers/settings.controller');
const pool = require('../../services/db.service');

// Mock the database pool
jest.mock('../../services/db.service', () => ({
    query: jest.fn()
}));

describe('Settings Controller', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Setup mock request, response, and next function
        mockReq = {
            session: {
                user: {
                    id: 123,
                    name: 'Test User',
                    role: 'user'
                }
            },
            body: {},
            ip: '127.0.0.1'
        };
        
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        
        mockNext = jest.fn();
    });

    describe('getUserSettings', () => {
        it('should call getUserSettings and return the correct result', async () => {
            // Mock database response
            pool.query.mockResolvedValue({
                rows: [{
                    sprache: 'en',
                    dark_mode: true,
                    benachrichtigungen_email: false,
                    benachrichtigungen_push: true,
                    benachrichtigungen_intervall: 'taeglich'
                }]
            });

            await settingsController.getUserSettings(mockReq, mockRes, mockNext);

            expect(pool.query).toHaveBeenCalledWith({
                text: expect.stringContaining('SELECT * FROM benutzer_einstellungen'),
                values: [123]
            });
            expect(mockRes.json).not.toHaveBeenCalled();
        });

        it('should return default settings when none exist', async () => {
            // Mock empty database response
            pool.query.mockResolvedValueOnce({ rows: [] });

            const result = await settingsController.getUserSettings(mockReq, mockRes, mockNext);

            expect(result).toEqual({
                settings: {
                    sprache: 'de',
                    dark_mode: false,
                    benachrichtigungen_email: true,
                    benachrichtigungen_push: false,
                    benachrichtigungen_intervall: 'sofort'
                }
            });
        });

        it('should call next with error on failure', async () => {
            const testError = new Error('Test error');
            pool.query.mockRejectedValueOnce(testError);

            await settingsController.getUserSettings(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(testError);
        });
    });

    describe('updateUserSettings', () => {
        beforeEach(() => {
            mockReq.body = {
                sprache: 'en',
                dark_mode: 'on',
                benachrichtigungen_email: true,
                benachrichtigungen_push: false,
                benachrichtigungen_intervall: 'taeglich'
            };
        });

        it('should insert new settings if none exist', async () => {
            // Mock empty settings check
            pool.query.mockResolvedValueOnce({ rows: [] });
            // Mock insert query
            pool.query.mockResolvedValueOnce({});
            // Mock activity log query
            pool.query.mockResolvedValueOnce({});

            const result = await settingsController.updateUserSettings(mockReq, mockRes, mockNext);

            expect(pool.query).toHaveBeenCalledTimes(3);
            expect(result).toEqual({
                success: true,
                message: 'Settings updated successfully'
            });
        });

        it('should update existing settings', async () => {
            // Mock existing settings check
            pool.query.mockResolvedValueOnce({ rows: [{ benutzer_id: 123 }] });
            // Mock update query
            pool.query.mockResolvedValueOnce({});
            // Mock activity log query
            pool.query.mockResolvedValueOnce({});

            const result = await settingsController.updateUserSettings(mockReq, mockRes, mockNext);

            expect(pool.query).toHaveBeenCalledTimes(3);
            expect(result).toEqual({
                success: true,
                message: 'Settings updated successfully'
            });
        });

        it('should call next with error on failure', async () => {
            const testError = new Error('Test error');
            pool.query.mockRejectedValueOnce(testError);

            await settingsController.updateUserSettings(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(testError);
        });
    });

    describe('getSystemSettings', () => {
        it('should return system settings for admin user', async () => {
            // Set admin role
            mockReq.session.user.role = 'admin';
            
            // Mock database response
            pool.query.mockResolvedValueOnce({
                rows: [
                    { kategorie: 'email', einstellung: 'smtp_host', wert: 'smtp.example.com', beschreibung: 'SMTP Host', typ: 'string' },
                    { kategorie: 'email', einstellung: 'smtp_port', wert: '587', beschreibung: 'SMTP Port', typ: 'number' },
                    { kategorie: 'security', einstellung: 'max_login_attempts', wert: '5', beschreibung: 'Max login attempts', typ: 'number' }
                ]
            });

            const result = await settingsController.getSystemSettings(mockReq, mockRes, mockNext);

            expect(result).toEqual({
                settings: {
                    email: [
                        { key: 'smtp_host', value: 'smtp.example.com', description: 'SMTP Host', type: 'string' },
                        { key: 'smtp_port', value: '587', description: 'SMTP Port', type: 'number' }
                    ],
                    security: [
                        { key: 'max_login_attempts', value: '5', description: 'Max login attempts', type: 'number' }
                    ]
                }
            });
        });

        it('should throw error for non-admin users', async () => {
            // Set non-admin role
            mockReq.session.user.role = 'user';

            await settingsController.getSystemSettings(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Unauthorized access to system settings',
                statusCode: 403
            }));
        });
    });

    describe('getBackupSettings', () => {
        beforeEach(() => {
            // Set admin role for most tests
            mockReq.session.user.role = 'admin';
        });

        it('should return backup settings and recent backups for admin users', async () => {
            // Mock settings query
            pool.query.mockResolvedValueOnce({
                rows: [{
                    automatisch: true,
                    intervall: 'taeglich',
                    zeit: '03:00',
                    aufbewahrung: 14,
                    letzte_ausfuehrung: '2023-01-01T03:00:00Z',
                    status: 'erfolgreich'
                }]
            });
            
            // Mock backups query
            pool.query.mockResolvedValueOnce({
                rows: [
                    { id: 1, dateiname: 'backup1.sql', groesse: 1024, erstellt_am: '2023-01-01', status: 'erfolgreich' },
                    { id: 2, dateiname: 'backup2.sql', groesse: 2048, erstellt_am: '2023-01-02', status: 'erfolgreich' }
                ]
            });

            const result = await settingsController.getBackupSettings(mockReq, mockRes, mockNext);

            expect(result).toEqual({
                settings: {
                    automatisch: true,
                    intervall: 'taeglich',
                    zeit: '03:00',
                    aufbewahrung: 14,
                    letzte_ausfuehrung: '2023-01-01T03:00:00Z',
                    status: 'erfolgreich'
                },
                backups: [
                    { id: 1, dateiname: 'backup1.sql', groesse: 1024, datum: '2023-01-01', status: 'erfolgreich' },
                    { id: 2, dateiname: 'backup2.sql', groesse: 2048, datum: '2023-01-02', status: 'erfolgreich' }
                ]
            });
        });

        it('should return default backup settings when none exist', async () => {
            // Mock empty settings query
            pool.query.mockResolvedValueOnce({ rows: [] });
            
            // Mock backups query
            pool.query.mockResolvedValueOnce({ rows: [] });

            const result = await settingsController.getBackupSettings(mockReq, mockRes, mockNext);

            expect(result.settings).toEqual({
                automatisch: true,
                intervall: 'taeglich',
                zeit: '02:00',
                aufbewahrung: 7,
                letzte_ausfuehrung: null,
                status: 'nicht_ausgefuehrt'
            });
            expect(result.backups).toEqual([]);
        });

        it('should throw error for non-admin users', async () => {
            // Set non-admin role
            mockReq.session.user.role = 'user';

            await settingsController.getBackupSettings(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Unauthorized access to backup settings',
                statusCode: 403
            }));
        });
    });

    describe('updateSystemSettings', () => {
        beforeEach(() => {
            // Set admin role for most tests
            mockReq.session.user.role = 'admin';
            mockReq.body = {
                settings: {
                    'smtp_host': 'new.smtp.example.com',
                    'max_login_attempts': '3'
                }
            };
        });

        it('should update system settings for admin users', async () => {
            // Mock update queries
            pool.query.mockResolvedValue({});

            const result = await settingsController.updateSystemSettings(mockReq, mockRes, mockNext);

            expect(pool.query).toHaveBeenCalledTimes(3); // Two updates and one log entry
            expect(result).toEqual({
                success: true,
                message: 'System settings updated successfully'
            });
        });

        it('should throw error for non-admin users', async () => {
            // Set non-admin role
            mockReq.session.user.role = 'user';

            await settingsController.updateSystemSettings(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Unauthorized access to system settings',
                statusCode: 403
            }));
        });

        it('should throw error for invalid settings data', async () => {
            mockReq.body = { settings: null };

            await settingsController.updateSystemSettings(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Invalid settings data',
                statusCode: 400
            }));
        });

        it('should call next with error on failure', async () => {
            const testError = new Error('Test error');
            pool.query.mockRejectedValueOnce(testError);

            await settingsController.updateSystemSettings(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(testError);
        });
    });

    describe('updateBackupSettings', () => {
        beforeEach(() => {
            // Set admin role for most tests
            mockReq.session.user.role = 'admin';
            mockReq.body = {
                automatisch: true,
                intervall: 'woechentlich',
                zeit: '04:00',
                aufbewahrung: 30
            };
        });

        it('should update backup settings for admin users', async () => {
            // Mock insert query and update query
            pool.query.mockResolvedValue({});

            const result = await settingsController.updateBackupSettings(mockReq, mockRes, mockNext);

            expect(pool.query).toHaveBeenCalledTimes(3); // Insert, update, and log
            expect(result).toEqual({
                success: true,
                message: 'Backup settings updated successfully'
            });
        });

        it('should throw error for non-admin users', async () => {
            // Set non-admin role
            mockReq.session.user.role = 'user';

            await settingsController.updateBackupSettings(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Unauthorized access to backup settings',
                statusCode: 403
            }));
        });

        it('should throw error for missing required fields', async () => {
            mockReq.body = { automatisch: true }; // Missing intervall and zeit

            await settingsController.updateBackupSettings(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Backup interval and time are required',
                statusCode: 400
            }));
        });

        it('should call next with error on failure', async () => {
            const testError = new Error('Test error');
            pool.query.mockRejectedValueOnce(testError);

            await settingsController.updateBackupSettings(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(testError);
        });
    });

    describe('triggerManualBackup', () => {
        beforeEach(() => {
            // Set admin role for most tests
            mockReq.session.user.role = 'admin';
        });

        it('should trigger manual backup for admin users', async () => {
            // Mock database queries
            pool.query.mockResolvedValue({});

            const result = await settingsController.triggerManualBackup(mockReq, mockRes, mockNext);

            expect(pool.query).toHaveBeenCalledTimes(2); // Backup log and system log
            expect(result).toEqual({
                success: true,
                message: 'Backup process initiated',
                status: 'pending'
            });
        });

        it('should throw error for non-admin users', async () => {
            // Set non-admin role
            mockReq.session.user.role = 'user';

            await settingsController.triggerManualBackup(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Unauthorized access to backup functionality',
                statusCode: 403
            }));
        });

        it('should call next with error on failure', async () => {
            const testError = new Error('Test error');
            pool.query.mockRejectedValueOnce(testError);

            await settingsController.triggerManualBackup(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(testError);
        });
    });
});