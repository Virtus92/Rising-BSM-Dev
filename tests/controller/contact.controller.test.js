const contactController = require('../../controllers/contact.controller');
const pool = require('../../services/db.service');
const NotificationService = require('../../services/notification.service');
const { validateInput } = require('../../utils/validators');

// Mock dependencies
jest.mock('../../services/db.service');
jest.mock('../../services/notification.service');
jest.mock('../../utils/validators');

describe('Contact Controller', () => {
    let mockRequest;
    let mockResponse;
    let next;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Setup mock request and response
        mockRequest = {
            body: {
                name: 'Test User',
                email: 'test@example.com',
                phone: '1234567890',
                service: 'Test Service',
                message: 'This is a test message'
            },
            ip: '127.0.0.1',
            xhr: false,
            headers: {
                accept: 'text/html'
            },
            flash: jest.fn(),
            params: {}
        };
        
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            redirect: jest.fn()
        };
        
        next = jest.fn();

        // Setup mock validation response
        validateInput.mockReturnValue({
            isValid: true,
            validatedData: { ...mockRequest.body }
        });

        // Setup DB query responses
        pool.query.mockImplementation((query) => {
            if (query.text && query.text.includes('INSERT INTO kontaktanfragen')) {
                return Promise.resolve({ rows: [{ id: 1 }] });
            } else if (query === 'SELECT id FROM benutzer WHERE rolle IN (\'admin\', \'manager\')') {
                return Promise.resolve({ rows: [{ id: 1 }, { id: 2 }] });
            } else if (query.text && query.text.includes('SELECT * FROM kontaktanfragen')) {
                return Promise.resolve({ rows: [{ id: 1, name: 'Test User', email: 'test@example.com' }] });
            }
            return Promise.resolve({ rows: [] });
        });

        // Setup notification service
        NotificationService.create.mockResolvedValue({ success: true });
    });

    describe('submitContact', () => {
        test('should return 400 with validation errors when input is invalid', async () => {
            validateInput.mockReturnValue({
                isValid: false,
                errors: { name: 'Name is required' }
            });
            
            await contactController.submitContact(mockRequest, mockResponse, next);
            
            expect(validateInput).toHaveBeenCalledWith(mockRequest.body, expect.any(Object));
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                errors: { name: 'Name is required' }
            });
        });
        
        test('should save contact form and return 201 JSON response for AJAX request', async () => {
            mockRequest.xhr = true;
            
            await contactController.submitContact(mockRequest, mockResponse, next);
            
            expect(pool.query).toHaveBeenCalledWith(expect.objectContaining({
                text: expect.stringContaining('INSERT INTO kontaktanfragen'),
                values: expect.arrayContaining([mockRequest.body.name])
            }));
            
            expect(NotificationService.create).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                requestId: 1
            }));
        });
        
        test('should redirect with flash message for normal form submission', async () => {
            await contactController.submitContact(mockRequest, mockResponse, next);
            
            expect(mockRequest.flash).toHaveBeenCalledWith('success', expect.any(String));
            expect(mockResponse.redirect).toHaveBeenCalledWith('/');
        });
        
        test('should handle database errors gracefully', async () => {
            const dbError = new Error('Database error');
            dbError.code = '23505';
            pool.query.mockRejectedValueOnce(dbError);
            
            mockRequest.xhr = true;
            
            await contactController.submitContact(mockRequest, mockResponse, next);
            
            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false
            }));
        });
        
        test('should handle generic errors for regular requests', async () => {
            pool.query.mockRejectedValueOnce(new Error('Generic error'));
            
            await contactController.submitContact(mockRequest, mockResponse, next);
            
            expect(mockRequest.flash).toHaveBeenCalledWith('error', expect.any(String));
            expect(mockResponse.redirect).toHaveBeenCalledWith('/');
        });

        test('should validate message length', async () => {
            // Mock validation error for message length
            validateInput.mockReturnValue({
                isValid: false,
                errors: { message: 'Message must be at least 10 characters long' }
            });
            
            mockRequest.body.message = 'Short';
            
            await contactController.submitContact(mockRequest, mockResponse, next);
            
            expect(validateInput).toHaveBeenCalledWith(mockRequest.body, expect.any(Object));
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                errors: { message: 'Message must be at least 10 characters long' }
            });
        });
    });

    describe('getContactRequest', () => {
        test('should return contact request details by ID', async () => {
            mockRequest.params.id = 1;
            
            const result = await contactController.getContactRequest(mockRequest, mockResponse, next);
            
            expect(pool.query).toHaveBeenCalledWith(expect.objectContaining({
                text: expect.stringContaining('SELECT * FROM kontaktanfragen'),
                values: [1]
            }));
            expect(result).toEqual(expect.objectContaining({
                id: 1,
                name: 'Test User'
            }));
        });
        
        test('should handle not found error', async () => {
            mockRequest.params.id = 999;
            pool.query.mockResolvedValueOnce({ rows: [] });
            
            await contactController.getContactRequest(mockRequest, mockResponse, next);
            
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 404,
                message: expect.stringContaining('nicht gefunden')
            }));
        });
    });
});