const validator = require('validator');

const { 
    validateCustomer, 
    validateProject, 
    validateAppointment, 
    validateService,
    validateStatusUpdate 
} = require('../../middleware/validation.middleware');

jest.mock('validator', () => ({
    isEmail: jest.fn(),
    isMobilePhone: jest.fn(),
    isPostalCode: jest.fn(),
    escape: jest.fn(str => str),
    normalizeEmail: jest.fn(str => str),
    isDate: jest.fn(),
    matches: jest.fn()
}));

describe('Validation Middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        
        // Reset all mock implementations
        jest.clearAllMocks();
        
        // Default mock returns
        validator.isEmail.mockReturnValue(true);
        validator.isMobilePhone.mockReturnValue(true);
        validator.isPostalCode.mockReturnValue(true);
        validator.isDate.mockReturnValue(true);
        validator.matches.mockReturnValue(true);
    });

    describe('validateCustomer', () => {
        test('should pass validation with valid customer data', () => {
            req.body = {
                name: 'Test User',
                email: 'test@example.com',
                telefon: '1234567890',
                plz: '12345'
            };

            validateCustomer(req, res, next);
            
            expect(next).toHaveBeenCalledWith();
            expect(next).not.toHaveBeenCalledWith(expect.any(Error));
        });

        test('should fail when name is missing', () => {
            req.body = {
                email: 'test@example.com'
            };

            validateCustomer(req, res, next);
            
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                validationErrors: expect.arrayContaining(['Name is required'])
            }));
        });

        test('should fail when email is missing', () => {
            req.body = {
                name: 'Test User'
            };

            validateCustomer(req, res, next);
            
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                validationErrors: expect.arrayContaining(['Email is required'])
            }));
        });

        test('should fail when email is invalid', () => {
            validator.isEmail.mockReturnValue(false);
            
            req.body = {
                name: 'Test User',
                email: 'invalid-email'
            };

            validateCustomer(req, res, next);
            
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                validationErrors: expect.arrayContaining(['Please enter a valid email address'])
            }));
        });

        test('should fail when phone number is invalid', () => {
            validator.isMobilePhone.mockReturnValue(false);
            
            req.body = {
                name: 'Test User',
                email: 'test@example.com',
                telefon: 'invalid-phone'
            };

            validateCustomer(req, res, next);
            
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                validationErrors: expect.arrayContaining(['Please enter a valid phone number'])
            }));
        });

        test('should fail when postal code is invalid', () => {
            validator.isPostalCode.mockReturnValue(false);
            
            req.body = {
                name: 'Test User',
                email: 'test@example.com',
                plz: 'invalid-plz'
            };

            validateCustomer(req, res, next);
            
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                validationErrors: expect.arrayContaining(['Please enter a valid postal code'])
            }));
        });

        test('should escape and trim string fields', () => {
                    const escapeMock = jest.fn(str => `escaped_${str}`);
                    validator.escape = escapeMock;

                    req.body = {
                        name: 'Test User',
                        email: 'test@example.com',
                        telefon: '1234567890',
                        plz: '12345',
                        firma: '  Test Firma  ',
                        adresse: '  Test Adresse  ',
                        ort: '  Test Ort  ',
                        notizen: '  Test Notizen  '
                    };

                    validateCustomer(req, res, next);

                    expect(escapeMock).toHaveBeenCalledTimes(5);
                    expect(escapeMock).toHaveBeenCalledWith('Test Firma');
                    expect(escapeMock).toHaveBeenCalledWith('Test Adresse');
                    expect(escapeMock).toHaveBeenCalledWith('Test Ort');
                    expect(escapeMock).toHaveBeenCalledWith('Test Notizen');
                    
                    expect(req.body.name).toBe('escaped_Test User');
                    expect(req.body.firma).toBe('escaped_Test Firma');
                    expect(req.body.adresse).toBe('escaped_Test Adresse');
                    expect(req.body.ort).toBe('escaped_Test Ort');
                    expect(req.body.notizen).toBe('escaped_Test Notizen');
                    
                    expect(next).toHaveBeenCalledWith();
        });
    });

    describe('validateProject', () => {
        test('should pass validation with valid project data', () => {
            req.body = {
                titel: 'Project Title',
                start_datum: '2023-10-15',
                beschreibung: 'Project description'
            };

            validateProject(req, res, next);
            
            expect(next).toHaveBeenCalledWith();
            expect(next).not.toHaveBeenCalledWith(expect.any(Error));
        });

        test('should fail when title is missing', () => {
            req.body = {
                start_datum: '2023-10-15'
            };

            validateProject(req, res, next);
            
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                validationErrors: expect.arrayContaining(['Title is required'])
            }));
        });

        test('should fail when start date is invalid', () => {
            validator.isDate.mockReturnValue(false);
            
            req.body = {
                titel: 'Project Title',
                start_datum: 'invalid-date'
            };

            validateProject(req, res, next);
            
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                validationErrors: expect.arrayContaining(['Please enter a valid start date'])
            }));
        });

        test('should fail when end date is before start date', () => {
            const mockStartDate = new Date('2023-10-15');
            const mockEndDate = new Date('2023-10-10');
            
            jest.spyOn(global, 'Date').mockImplementation(arg => {
                if (arg === '2023-10-15') return mockStartDate;
                if (arg === '2023-10-10') return mockEndDate;
                return new Date();
            });

            req.body = {
                titel: 'Project Title',
                start_datum: '2023-10-15',
                end_datum: '2023-10-10'
            };

            validateProject(req, res, next);
            
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                validationErrors: expect.arrayContaining(['End date must be after start date'])
            }));
            
            global.Date.mockRestore();
        });

        test('should fail when start date is missing', () => {
            req.body = {
            titel: 'Project Title'
            };

            validateProject(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 400,
            validationErrors: expect.arrayContaining(['Start date is required'])
            }));
        });
    });

    describe('validateAppointment', () => {
        test('should pass validation with valid appointment data', () => {
            // Create a fixed date for testing
            const currentDate = new Date(2023, 9, 1, 12, 0); // October 1, 2023, 12:00
            const futureDate = new Date(2023, 9, 2, 12, 0);  // October 2, 2023, 12:00
            const dateStr = '2023-10-02';
            
            req.body = {
                titel: 'Appointment Title',
                termin_datum: dateStr,
                termin_zeit: '14:30',
                ort: 'Office'
            };
            
            // Use a more careful mocking approach
            const originalDate = global.Date;
            global.Date = jest.fn(() => currentDate);
            global.Date.UTC = originalDate.UTC;
            global.Date.parse = originalDate.parse;
            global.Date.now = jest.fn(() => currentDate.getTime());
            // Allow Date to work with constructor arguments
            global.Date.mockImplementation((arg) => {
                if (arg) {
                    return new originalDate(arg);
                }
                return currentDate;
            });

            validateAppointment(req, res, next);
            
            expect(next).toHaveBeenCalledWith();
            expect(next).not.toHaveBeenCalledWith(expect.any(Error));
            
            // Restore the original Date
            global.Date = originalDate;
        });

        test('should fail when title is missing', () => {
            req.body = {
                termin_datum: '2023-10-15',
                termin_zeit: '14:30'
            };

            validateAppointment(req, res, next);
            
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                validationErrors: expect.arrayContaining(['Title is required'])
            }));
        });

        test('should fail when time format is invalid', () => {
            validator.matches.mockReturnValue(false);
            
            req.body = {
                titel: 'Appointment Title',
                termin_datum: '2023-10-15',
                termin_zeit: 'invalid-time'
            };

            validateAppointment(req, res, next);
            
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                validationErrors: expect.arrayContaining(['Please enter a valid time (HH:MM)'])
            }));
        });

        test('should fail when date is missing', () => {
                    req.body = {
                        titel: 'Appointment Title',
                        termin_zeit: '14:30'
                    };

                    validateAppointment(req, res, next);
                    
                    expect(next).toHaveBeenCalledWith(expect.objectContaining({
                        statusCode: 400,
                        validationErrors: expect.arrayContaining(['Date is required'])
                    }));
        });

        test('should fail when date is invalid', () => {
            validator.isDate.mockReturnValue(false);
            
            req.body = {
                titel: 'Appointment Title',
                termin_datum: 'invalid-date',
                termin_zeit: '14:30'
            };

            validateAppointment(req, res, next);
            
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                validationErrors: expect.arrayContaining(['Please enter a valid date'])
            }));
        });

        test('should fail when time is missing', () => {
            req.body = {
                titel: 'Appointment Title',
                termin_datum: '2023-10-15'
            };

            validateAppointment(req, res, next);
            
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                validationErrors: expect.arrayContaining(['Time is required'])
            }));
        });

        test('should fail when appointment date and time are in the past', () => {
            // Mock the Date constructor once before using it
            const realDate = global.Date;
            const mockCurrentDate = new Date(2023, 10, 15); // November 15, 2023
            
            // Create a proper mock implementation that avoids recursion
            const DateMock = jest.fn(() => mockCurrentDate);
            DateMock.prototype = realDate.prototype;
            // Pass through static methods
            DateMock.UTC = realDate.UTC;
            DateMock.parse = realDate.parse;
            DateMock.now = jest.fn(() => mockCurrentDate.getTime());
            
            // Special handling for constructor with args to avoid recursion
            global.Date = jest.fn(function(arg) {
                if (!arg) return mockCurrentDate;
                return new realDate(arg);
            });
            
            req.body = {
                titel: 'Past Appointment',
                termin_datum: '2023-10-15', // October 15, 2023 (1 month before mock date)
                termin_zeit: '14:30'
            };

            validateAppointment(req, res, next);
            
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                validationErrors: expect.arrayContaining(['Appointment date and time cannot be in the past'])
            }));
            
            // Restore the original Date
            global.Date = realDate;
        });

        test('should escape and trim string fields', () => {
            const escapeMock = jest.fn(str => `escaped_${str}`);
            validator.escape = escapeMock;

            // Mock Date to return future date to bypass the past date validation
            const realDate = global.Date;
            const mockCurrentDate = new Date(2023, 0, 1); // Jan 1, 2023
            global.Date = jest.fn(function(arg) {
                if (!arg) return mockCurrentDate;
                // For the appointment date, make it a future date
                if (arg === '2023-10-15T14:30') {
                    return new realDate(2023, 9, 15, 14, 30); // Oct 15, 2023 
                }
                return new realDate(arg);
            });

            req.body = {
                titel: '  Appointment Title  ',
                termin_datum: '2023-10-15',
                termin_zeit: '14:30',
                ort: '  Test Ort  ',
                beschreibung: '  Test Beschreibung  '
            };

            validateAppointment(req, res, next);

            expect(escapeMock).toHaveBeenCalledTimes(3);
            expect(escapeMock).toHaveBeenCalledWith('Appointment Title');
            expect(escapeMock).toHaveBeenCalledWith('Test Ort');
            expect(escapeMock).toHaveBeenCalledWith('Test Beschreibung');
            
            expect(req.body.titel).toBe('escaped_Appointment Title');
            expect(req.body.ort).toBe('escaped_Test Ort');
            expect(req.body.beschreibung).toBe('escaped_Test Beschreibung');
            
            expect(next).toHaveBeenCalledWith();
            
            // Restore original Date
            global.Date = realDate;
        });
    });

    describe('validateService', () => {
        test('should pass validation with valid service data', () => {
            req.body = {
                name: 'Service Name',
                preis_basis: 100.50,
                einheit: 'hour',
                beschreibung: 'Service description'
            };

            validateService(req, res, next);
            
            expect(next).toHaveBeenCalledWith();
            expect(next).not.toHaveBeenCalledWith(expect.any(Error));
        });

        test('should fail when price is negative', () => {
            req.body = {
                name: 'Service Name',
                preis_basis: -50,
                einheit: 'hour'
            };

            validateService(req, res, next);
            
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                validationErrors: expect.arrayContaining(['Please enter a valid price (must be a positive number)'])
            }));
        });

        test('should fail when unit is missing', () => {
            req.body = {
                name: 'Service Name',
                preis_basis: 100.50
            };

            validateService(req, res, next);
            
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                validationErrors: expect.arrayContaining(['Unit is required'])
            }));
        });
    });
    
    describe('validateStatusUpdate', () => {
        test('should pass validation with valid status update data', () => {
            req.body = {
                id: 1,
                status: 'completed'
            };

            validateStatusUpdate(req, res, next);
            
            expect(next).toHaveBeenCalledWith();
            expect(next).not.toHaveBeenCalledWith(expect.any(Error));
        });

        test('should fail when id is missing', () => {
            req.body = {
                status: 'completed'
            };

            validateStatusUpdate(req, res, next);
            
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                validationErrors: expect.arrayContaining(['ID is required'])
            }));
        });

        test('should fail when status is not a string', () => {
            req.body = {
                id: 1,
                status: 123
            };

            validateStatusUpdate(req, res, next);
            
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                validationErrors: expect.arrayContaining(['Status is required'])
            }));
        });
    });
});