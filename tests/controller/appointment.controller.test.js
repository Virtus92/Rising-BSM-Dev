const appointmentController = require('../../controllers/appointment.controller');
const pool = require('../../services/db.service');
const exportService = require('../../services/export.service');
const { formatDateSafely } = require('../../utils/formatters');
const { getTerminStatusInfo } = require('../../utils/helpers');

// Mock dependencies
jest.mock('../../services/db.service');
jest.mock('../../services/export.service');
jest.mock('../../utils/formatters');
jest.mock('../../utils/helpers');

describe('Appointment Controller', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Mock request object
        mockReq = {
            query: {},
            params: {},
            body: {},
            session: {
                user: {
                    id: 1,
                    name: 'Test User'
                }
            }
        };
        
        // Mock response object with correct methods
        mockRes = {};
        
        // Mock next function
        mockNext = jest.fn();

        // Mock helper function
        getTerminStatusInfo.mockReturnValue({ label: 'Geplant', className: 'status-planned' });
        
        // Mock formatter
        formatDateSafely.mockImplementation((date, format) => {
            if (format === 'dd.MM.yyyy') return '01.01.2023';
            if (format === 'HH:mm') return '10:00';
            if (format === 'dd.MM.yyyy, HH:mm') return '01.01.2023, 10:00';
            return '';
        });
    });

    describe('getAllAppointments', () => {
        it('should get all appointments with no filters', async () => {
            mockReq.query = { page: 1, limit: 10 };
            
            pool.query.mockImplementation((query, params) => {
                if (query.includes('COUNT(*)')) {
                    return Promise.resolve({ rows: [{ total: '5' }] });
                }
                return Promise.resolve({
                    rows: [
                        {
                            id: 1,
                            titel: 'Test Meeting',
                            kunde_id: 1,
                            kunde_name: 'Test Client',
                            projekt_id: 1,
                            projekt_titel: 'Test Project',
                            termin_datum: new Date('2023-01-01T10:00:00'),
                            dauer: 60,
                            ort: 'Office',
                            status: 'geplant'
                        }
                    ]
                });
            });

            const result = await appointmentController.getAllAppointments(mockReq, mockRes, mockNext);

            expect(result).toBeDefined();
            expect(result.appointments).toHaveLength(1);
            expect(result.pagination.total).toBe(1);
            expect(result.pagination.current).toBe(1);
            expect(pool.query).toHaveBeenCalledTimes(2);
        });

        it('should apply filters when provided', async () => {
            mockReq.query = {
                status: 'geplant',
                date: '2023-01-01',
                search: 'test',
                page: 1,
                limit: 10
            };
            
            pool.query.mockImplementation((query, params) => {
                if (query.includes('COUNT(*)')) {
                    return Promise.resolve({ rows: [{ total: '2' }] });
                }
                return Promise.resolve({
                    rows: [{ 
                        id: 1,
                        titel: 'Test Meeting',
                        status: 'geplant',
                        termin_datum: new Date('2023-01-01T10:00:00')
                    }]
                });
            });

            const result = await appointmentController.getAllAppointments(mockReq, mockRes, mockNext);

            expect(result).toBeDefined();
            expect(pool.query).toHaveBeenCalledTimes(2);
            
            // Check if filters are being applied to the query
            const queryParams = pool.query.mock.calls[0][1];
            expect(queryParams).toContain('geplant');
            expect(queryParams).toContain('2023-01-01');
            expect(queryParams[2]).toMatch(/%test%/);
        });

        it('should handle errors', async () => {
            pool.query.mockRejectedValue(new Error('Database error'));
            
            await appointmentController.getAllAppointments(mockReq, mockRes, mockNext);
            
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('getAppointmentById', () => {
        it('should get appointment by ID', async () => {
            mockReq.params = { id: 1 };
            
            // Fix the mock implementation to ensure correct data is returned for both queries
            let queryCounter = 0;
            pool.query.mockImplementation((query) => {
                queryCounter++;
                if (queryCounter === 1) {
                    // First query - appointment details
                    return Promise.resolve({
                        rows: [{
                            id: 1,
                            titel: 'Test Meeting',
                            kunde_id: 1,
                            kunde_name: 'Test Client',
                            projekt_id: 1,
                            projekt_titel: 'Test Project',
                            termin_datum: new Date('2023-01-01T10:00:00'),
                            dauer: 60,
                            ort: 'Office',
                            beschreibung: 'Test description',
                            status: 'geplant'
                        }]
                    });
                } else {
                    // Second query - notes
                    return Promise.resolve({
                        rows: [{
                            id: 1,
                            text: 'Test note',
                            erstellt_am: new Date('2023-01-01T09:00:00'),
                            benutzer_name: 'Test User'
                        }]
                    });
                }
            });
            const result = await appointmentController.getAppointmentById(mockReq, mockRes, mockNext);

            expect(result).toBeDefined();
            expect(result.appointment.id).toBe(1);
            expect(result.appointment.titel).toBe('Test Meeting');
            expect(result.notes).toHaveLength(1);
            expect(pool.query).toHaveBeenCalledTimes(2);
        });

        it('should handle not found appointment', async () => {
            mockReq.params = { id: 999 };
            
            pool.query.mockResolvedValue({ rows: [] });

            await appointmentController.getAppointmentById(mockReq, mockRes, mockNext);
            
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 404,
                message: expect.stringContaining('not found')
            }));
        });
    });

    describe('createAppointment', () => {
        it('should create a new appointment', async () => {
            mockReq.body = {
                titel: 'New Meeting',
                termin_datum: '2023-01-01',
                termin_zeit: '10:00',
                kunde_id: 1,
                projekt_id: 1,
                dauer: 60,
                ort: 'Office',
                beschreibung: 'New description',
                status: 'geplant'
            };
            
            pool.query.mockImplementation((query) => {
                if (query.text && query.text.includes('RETURNING id')) {
                    return Promise.resolve({ rows: [{ id: 5 }] });
                }
                return Promise.resolve({});
            });

            const result = await appointmentController.createAppointment(mockReq, mockRes, mockNext);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.appointmentId).toBe(5);
            expect(pool.query).toHaveBeenCalledTimes(2);
        });

        it('should validate required fields', async () => {
            mockReq.body = {
                titel: '',
                termin_datum: '',
                termin_zeit: ''
            };

            await appointmentController.createAppointment(mockReq, mockRes, mockNext);
            
            expect(mockNext).toHaveBeenCalled();
            const errorArg = mockNext.mock.calls[0][0];
            expect(errorArg.message).toContain('required');
            expect(pool.query).not.toHaveBeenCalled();
        });

        it('should validate date and time format', async () => {
            mockReq.body = {
                titel: 'Test Meeting',
                termin_datum: 'invalid-date', // Invalid date format
                termin_zeit: '25:00' // Invalid time format
            };

            await appointmentController.createAppointment(mockReq, mockRes, mockNext);
            
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                message: expect.stringMatching(/.*Validation failed.*/)
            }));

            // Check that the error message contains information about the invalid formats
            const errorArg = mockNext.mock.calls[0][0];
            expect(errorArg.message).toContain('Invalid date format');
            expect(errorArg.message).toContain('Invalid time format');
            
            expect(pool.query).not.toHaveBeenCalled();
        });
    });

    describe('updateAppointment', () => {
        it('should update an existing appointment', async () => {
            mockReq.params = { id: 1 };
            mockReq.body = {
                titel: 'Updated Meeting',
                termin_datum: '2023-01-02',
                termin_zeit: '11:00',
                kunde_id: 2,
                projekt_id: 2,
                dauer: 90,
                ort: 'New Office',
                beschreibung: 'Updated description',
                status: 'bestaetigt'
            };
            
            pool.query.mockImplementation((query) => {
                if (query.text && query.text.includes('SELECT id FROM')) {
                    return Promise.resolve({ rows: [{ id: 1 }] });
                }
                return Promise.resolve({});
            });

            const result = await appointmentController.updateAppointment(mockReq, mockRes, mockNext);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.appointmentId).toBe(1);
            expect(pool.query).toHaveBeenCalledTimes(3);
        });

        it('should handle not found appointment', async () => {
            mockReq.params = { id: 999 };
            mockReq.body = {
                titel: 'Updated Meeting',
                termin_datum: '2023-01-02',
                termin_zeit: '11:00'
            };
            
            pool.query.mockResolvedValue({ rows: [] });

            await appointmentController.updateAppointment(mockReq, mockRes, mockNext);
            
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 404,
                message: expect.stringContaining('not found')
            }));
        });
    });

    describe('updateAppointmentStatus', () => {
        it('should update appointment status', async () => {
            mockReq.body = {
                id: 1,
                status: 'bestaetigt',
                note: 'Status updated'
            };
            
            pool.query.mockResolvedValue({});

            const result = await appointmentController.updateAppointmentStatus(mockReq, mockRes, mockNext);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.appointmentId).toBe(1);
            expect(pool.query).toHaveBeenCalledTimes(3);
        });

        it('should validate required fields', async () => {
            mockReq.body = {
                id: '',
                status: ''
            };

            await appointmentController.updateAppointmentStatus(mockReq, mockRes, mockNext);
            
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400
            }));
            expect(pool.query).not.toHaveBeenCalled();
        });

        it('should validate status value', async () => {
            mockReq.body = {
                id: 1,
                status: 'invalid_status'
            };

            await appointmentController.updateAppointmentStatus(mockReq, mockRes, mockNext);
            
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                message: expect.stringContaining('Invalid status')
            }));
            expect(pool.query).not.toHaveBeenCalled();
        });
    });

    describe('addAppointmentNote', () => {
        it('should add a note to appointment', async () => {
            mockReq.params = { id: 1 };
            mockReq.body = { note: 'Test note' };
            
            pool.query.mockImplementation((query) => {
                if (query.text && query.text.includes('SELECT id FROM')) {
                    return Promise.resolve({ rows: [{ id: 1 }] });
                }
                return Promise.resolve({});
            });

            const result = await appointmentController.addAppointmentNote(mockReq, mockRes, mockNext);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.appointmentId).toBe('1');
            expect(pool.query).toHaveBeenCalledTimes(3);
        });

        it('should validate note is not empty', async () => {
            mockReq.params = { id: 1 };
            mockReq.body = { note: '' };

            await appointmentController.addAppointmentNote(mockReq, mockRes, mockNext);
            
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                message: expect.stringContaining('cannot be empty')
            }));
            expect(pool.query).not.toHaveBeenCalled();
        });
    });

    describe('exportAppointments', () => {
        it('should export appointments data', async () => {
            mockReq.query = {
                format: 'xlsx',
                start_date: '2023-01-01',
                end_date: '2023-01-31',
                status: 'geplant'
            };
            
            pool.query.mockResolvedValue({
                rows: [{ 
                    id: 1,
                    titel: 'Test Meeting',
                    termin_datum: new Date('2023-01-01T10:00:00'),
                    status: 'geplant'
                }]
            });

            exportService.generateExport.mockResolvedValue({
                fileName: 'termine-export.xlsx',
                fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const result = await appointmentController.exportAppointments(mockReq, mockRes, mockNext);

            expect(result).toBeDefined();
            expect(pool.query).toHaveBeenCalledTimes(1);
            expect(exportService.generateExport).toHaveBeenCalledTimes(1);
            expect(exportService.generateExport.mock.calls[0][2].filters).toEqual({
                start_date: '2023-01-01',
                end_date: '2023-01-31',
                status: 'geplant'
            });
        });

        it('should handle errors', async () => {
            mockReq.query = { format: 'xlsx' };
            
            pool.query.mockRejectedValue(new Error('Export error'));

            await appointmentController.exportAppointments(mockReq, mockRes, mockNext);
            
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
            expect(exportService.generateExport).not.toHaveBeenCalled();
        });
    });
});