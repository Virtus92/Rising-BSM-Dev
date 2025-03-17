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
            } else if (query.text && query.text.includes("SELECT id FROM benutzer WHERE rolle IN ('admin', 'manager')")) {
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

        test('should create notifications for all admin users', async () => {
            // Define admin users
            const adminUsers = [{ id: 101 }, { id: 202 }, { id: 303 }];
            const requestId = 456;

            
            // Reset the query mock and create a more specific implementation
            pool.query.mockReset();
            pool.query.mockImplementation((query) => {
                // Log the query to see what's coming in
                console.log("Query received:", query);
                
                // Handle as object or string
                const queryText = typeof query === 'object' ? query.text : query;
                
                // Normalize the query text by removing extra whitespace
                const normalizedText = queryText.replace(/\s+/g, ' ').trim();
                console.log("Normalized query:", normalizedText);
                
                if (normalizedText.includes('INSERT INTO kontaktanfragen')) {
                    console.log("Returning inserted request with ID:", requestId);
                    return Promise.resolve({ rows: [{ id: requestId }] });
                } 
                
                // More flexible matching for the admin query
                if (normalizedText.includes('SELECT id FROM benutzer') && 
                    normalizedText.includes('rolle IN') && 
                    (normalizedText.includes('admin') || normalizedText.includes('manager'))) {
                    
                    return Promise.resolve({ rows: adminUsers });
                }
                
                return Promise.resolve({ rows: [] });
            });
            
            // Reset notification service mock
            NotificationService.create.mockReset();
            const notificationCalls = [];
            
            NotificationService.create.mockImplementation((data) => {
                notificationCalls.push({...data}); // Store a copy of the data
                console.log(`Mock call ${notificationCalls.length} with type: ${data.type}, userId: ${data.userId}`);
                return Promise.resolve({ success: true });
            });
            
            await contactController.submitContact(mockRequest, mockResponse, next);
            
            console.log(`Total mock calls: ${notificationCalls.length}`);
            console.log(`Expected calls: ${adminUsers.length + 1}`);
            
            // Verify total calls
            expect(notificationCalls.length).toBe(adminUsers.length + 1);
            
            // Check admin notifications
            const adminNotifications = notificationCalls.filter(call => 
                call.type === 'anfrage'
            );
            expect(adminNotifications.length).toBe(adminUsers.length);
            
            // Verify admin user IDs were included correctly
            adminUsers.forEach(admin => {
                const found = adminNotifications.some(notification => 
                    notification.userId === admin.id
                );
                expect(found).toBe(true);
            });
            
            // Verify confirmation notification
            const confirmationNotifications = notificationCalls.filter(call => 
                call.type === 'contact_confirmation'
            );
            expect(confirmationNotifications.length).toBe(1);
        });
        
        test('should return 500 JSON response for XHR requests on generic errors', async () => {
            // Mock a generic error (not the specific 23505 error)
            pool.query.mockRejectedValueOnce(new Error('Generic database error'));
            
            // Set request as XHR
            mockRequest.xhr = true;
            
            await contactController.submitContact(mockRequest, mockResponse, next);
            
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
            });
        });
        
        test('should return 500 JSON response when Accept header includes application/json', async () => {
            // Mock a generic error
            pool.query.mockRejectedValueOnce(new Error('Generic database error'));
            
            // Set XHR to false but include application/json in Accept header
            mockRequest.xhr = false;
            mockRequest.headers.accept = 'application/json';
            
            await contactController.submitContact(mockRequest, mockResponse, next);
            
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
            });
        });

        test('should map notifications for each admin with correct parameters', async () => {
            // Define admin users
            const adminUsers = [{ id: 101 }, { id: 202 }, { id: 303 }];
            const requestId = 456;
            
           // Reset the query mock and create a more specific implementation
           pool.query.mockReset();
           pool.query.mockImplementation((query) => {
               // Log the query to see what's coming in
               console.log("Query received:", query);
               
               // Handle as object or string
               const queryText = typeof query === 'object' ? query.text : query;
               
               // Normalize the query text by removing extra whitespace
               const normalizedText = queryText.replace(/\s+/g, ' ').trim();
               console.log("Normalized query:", normalizedText);
               
               if (normalizedText.includes('INSERT INTO kontaktanfragen')) {
                   console.log("Returning inserted request with ID:", requestId);
                   return Promise.resolve({ rows: [{ id: requestId }] });
               } 
               
               // More flexible matching for the admin query
               if (normalizedText.includes('SELECT id FROM benutzer') && 
                   normalizedText.includes('rolle IN') && 
                   (normalizedText.includes('admin') || normalizedText.includes('manager'))) {
                   
                   return Promise.resolve({ rows: adminUsers });
               }
               
               return Promise.resolve({ rows: [] });
           });
            
            await contactController.submitContact(mockRequest, mockResponse, next);
            
            // Verify notification service was called exactly once for each admin plus confirmation
            expect(NotificationService.create).toHaveBeenCalledTimes(adminUsers.length + 1);
            
            // Verify the notification parameters for each admin
            for (let i = 0; i < adminUsers.length; i++) {
                const expectedNotification = {
                    type: 'anfrage',
                    title: 'Neue Kontaktanfrage',
                    message: `Neue Anfrage von ${mockRequest.body.name} über ${mockRequest.body.service}`,
                    referenceId: requestId,
                    referenceType: 'kontaktanfragen',
                    userId: adminUsers[i].id
                };
                
                expect(NotificationService.create.mock.calls[i][0]).toEqual(expectedNotification);
            }
            
            // Also verify the confirmation notification was called with different parameters
            expect(NotificationService.create.mock.calls[adminUsers.length][0]).toHaveProperty('type', 'contact_confirmation');
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