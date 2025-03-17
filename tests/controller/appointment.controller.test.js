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

        it('should validate required fields', async () => {
            mockReq.params = { id: 1 };
            mockReq.body = {
                titel: '',
                termin_datum: '',
                termin_zeit: ''
            };
        
            pool.query.mockImplementation((query) => {
                if (query.text && query.text.includes('SELECT id FROM termine WHERE id = $1')) {
                    return Promise.resolve({ rows: [{ id: 1 }] });
                }
                return Promise.resolve({});
            });
        
            await appointmentController.updateAppointment(mockReq, mockRes, mockNext);
        
            expect(mockNext).toHaveBeenCalled();
            const errorArg = mockNext.mock.calls[0][0];
            expect(errorArg.message).toContain('required');
            expect(errorArg.statusCode).toBe(400);
        });

        it('should handle appointment not found during update', async () => {
            mockReq.params = { id: 999 };
            mockReq.body = {
                titel: 'Updated Meeting',
                termin_datum: '2023-01-02',
                termin_zeit: '11:00'
            };
        
            pool.query.mockImplementation((query) => {
                if (query.text && query.text.includes('SELECT id FROM termine WHERE id = $1')) {
                    return Promise.resolve({ rows: [] });
                }
                return Promise.resolve({});
            });
        
            await appointmentController.updateAppointment(mockReq, mockRes, mockNext);
        
            expect(mockNext).toHaveBeenCalled();
            const errorArg = mockNext.mock.calls[0][0];
            expect(errorArg.message).toContain('not found');
            expect(errorArg.statusCode).toBe(404);
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

        it('should handle appointment not found when adding note', async () => {
            mockReq.params = { id: 999 };
            mockReq.body = { note: 'Test note' };
            
            pool.query.mockImplementation((query) => {
                if (query.text && query.text.includes('SELECT id FROM')) {
                    return Promise.resolve({ rows: [] });
                }
                return Promise.resolve({});
            });

            await appointmentController.addAppointmentNote(mockReq, mockRes, mockNext);
            
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 404,
                message: expect.stringContaining('not found')
            }));
            expect(pool.query).toHaveBeenCalledTimes(1);
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

            // Mock exportService.generateExport to transform data properly
            exportService.generateExport.mockImplementation((data, format, options) => {
                // Transform data according to column definitions
                const transformedData = data.map(row => {
                    return {
                        id: row.id,
                        titel: row.titel,
                        datum: formatDateSafely(row.termin_datum, 'dd.MM.yyyy'),
                        uhrzeit: formatDateSafely(row.termin_datum, 'HH:mm'),
                        status: getTerminStatusInfo(row.status).label
                    };
                });
                
                return Promise.resolve({
                    fileName: 'termine-export.xlsx',
                    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    data: transformedData  // Store transformed data to check in test
                });
            });

            const result = await appointmentController.exportAppointments(mockReq, mockRes, mockNext);

            expect(result).toBeDefined();
            expect(pool.query).toHaveBeenCalledTimes(1);
            expect(exportService.generateExport).toHaveBeenCalledTimes(1);
            
            // Check that raw DB data was passed to the export service
            const rawDataPassedToExport = exportService.generateExport.mock.calls[0][0];
            expect(rawDataPassedToExport).toEqual([{
                id: 1,
                titel: 'Test Meeting',
                termin_datum: expect.any(Date),
                status: 'geplant'
            }]);
            
            // Verify the format parameter is passed correctly
            expect(exportService.generateExport.mock.calls[0][1]).toBe('xlsx');
            
            // Check that filters were passed correctly
            expect(exportService.generateExport.mock.calls[0][2].filters).toEqual({
                start_date: '2023-01-01',
                end_date: '2023-01-31',
                status: 'geplant'
            });

            // Check transformed data in the result
            expect(result.data).toEqual([{
                id: 1,
                titel: 'Test Meeting',
                datum: '01.01.2023',
                uhrzeit: '10:00',
                status: 'Geplant'
            }]);

            // Check column definitions - now accessing from the third argument (options.columns)
            const columnDefinitions = exportService.generateExport.mock.calls[0][2].columns;
            expect(columnDefinitions).toEqual(expect.arrayContaining([
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Titel', key: 'titel', width: 30 },
                { header: 'Datum', key: 'datum', width: 15, format: expect.any(Function) },
                { header: 'Uhrzeit', key: 'uhrzeit', width: 10, format: expect.any(Function) },
                { header: 'Status', key: 'status', width: 15, format: expect.any(Function) }
            ]));
        });

        it('should handle errors', async () => {
            mockReq.query = { format: 'xlsx' };
            
            pool.query.mockRejectedValue(new Error('Export error'));

            await appointmentController.exportAppointments(mockReq, mockRes, mockNext);
            
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
            expect(exportService.generateExport).not.toHaveBeenCalled();
        });

        it('should export appointments with no date filters', async () => {
            mockReq.query = {
                format: 'csv',
                status: 'bestaetigt'
            };
            
            pool.query.mockResolvedValue({
                rows: [
                    { 
                        id: 1,
                        titel: 'Meeting 1',
                        termin_datum: new Date('2023-01-01T10:00:00'),
                        dauer: 60,
                        ort: 'Office',
                        status: 'bestaetigt',
                        beschreibung: 'Description',
                        kunde_name: 'Client 1',
                        projekt_titel: 'Project 1'
                    },
                    { 
                        id: 2,
                        titel: 'Meeting 2',
                        termin_datum: new Date('2023-01-02T11:00:00'),
                        dauer: 90,
                        ort: null,
                        status: 'bestaetigt',
                        beschreibung: null,
                        kunde_name: null,
                        projekt_titel: null
                    }
                ]
            });

            exportService.generateExport.mockResolvedValue({
                fileName: 'termine-export.csv',
                fileType: 'text/csv',
                data: [
                    {
                        id: 1,
                        titel: 'Meeting 1',
                        datum: '01.01.2023',
                        uhrzeit: '10:00',
                        dauer: 60,
                        status: 'Bestätigt',
                        kunde_name: 'Client 1',
                        projekt_titel: 'Project 1',
                        ort: 'Office',
                        beschreibung: 'Description'
                    },
                    {
                        id: 2,
                        titel: 'Meeting 2',
                        datum: '02.01.2023',
                        uhrzeit: '11:00',
                        dauer: 90,
                        status: 'Bestätigt',
                        kunde_name: 'Kein Kunde',
                        projekt_titel: 'Kein Projekt',
                        ort: '',
                        beschreibung: ''
                    }
                ]
            });

            const result = await appointmentController.exportAppointments(mockReq, mockRes, mockNext);

            expect(result).toBeDefined();
            expect(result.fileName).toBe('termine-export.csv');
            expect(result.fileType).toBe('text/csv');
            expect(result.data).toHaveLength(2);
            
            // Verify query didn't include date parameters
            const queryText = pool.query.mock.calls[0][0].text;
            expect(queryText).not.toMatch(/termin_datum >= \$/);
            expect(queryText).not.toMatch(/termin_datum <= \$/);
            expect(queryText).toMatch(/t\.status = \$/);
            
            // Verify the column formatting functions were provided
            const options = exportService.generateExport.mock.calls[0][2];
            const datumColumn = options.columns.find(col => col.key === 'datum');
            const uhrzeitColumn = options.columns.find(col => col.key === 'uhrzeit');
            const statusColumn = options.columns.find(col => col.key === 'status');
            
            expect(datumColumn.format).toBeDefined();
            expect(uhrzeitColumn.format).toBeDefined();
            expect(statusColumn.format).toBeDefined();
        });

        it('should handle empty result set when exporting', async () => {
            mockReq.query = {
                format: 'pdf',
                start_date: '2023-01-01',
                end_date: '2023-01-31'
            };
            
            pool.query.mockResolvedValue({ rows: [] });

            exportService.generateExport.mockResolvedValue({
                fileName: 'termine-export.pdf',
                fileType: 'application/pdf',
                data: []
            });

            const result = await appointmentController.exportAppointments(mockReq, mockRes, mockNext);

            expect(result).toBeDefined();
            expect(result.data).toEqual([]);
            expect(exportService.generateExport).toHaveBeenCalledWith(
                [],
                'pdf',
                expect.objectContaining({
                    filename: 'termine-export',
                    title: 'Terminliste - Rising BSM',
                })
            );
        });

        it('should export appointments with only start_date filter', async () => {
            mockReq.query = {
                format: 'xlsx',
                start_date: '2023-01-01'
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
                fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                data: [/* transformed data */]
            });

            await appointmentController.exportAppointments(mockReq, mockRes, mockNext);
            
            // Check that start_date was used in the query
            const queryCall = pool.query.mock.calls[0][0];
            expect(queryCall.text).toMatch(/termin_datum >= \$\d+/);
            
            // Verify the query was called with the proper parameters
            expect(pool.query).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining('WHERE termin_datum >= $1'),
                    values: expect.arrayContaining([expect.any(Date)])
                })
            );
            
            // Check that filters were passed correctly to export service
            const exportFilters = exportService.generateExport.mock.calls[0][2].filters;
            expect(exportFilters).toEqual({
                start_date: '2023-01-01',
                end_date: undefined,
                status: undefined
            });
        });
    });

    describe('deleteAppointment', () => {
        it('should delete an existing appointment', async () => {
            mockReq.params = { id: 1 };
    
            // Mock the pool.query to first find the appointment and then delete it
            pool.query.mockImplementation((query) => {
                if (query.text && query.text.includes('SELECT id FROM termine WHERE id = $1')) {
                    return Promise.resolve({ rows: [{ id: 1 }] });
                } else if (query.text && query.text.includes('DELETE FROM termine WHERE id = $1')) {
                    return Promise.resolve({});
                } else if (query.text && query.text.includes('INSERT INTO termin_log')) {
                    return Promise.resolve({});
                }
            });
    
            const result = await appointmentController.deleteAppointment(mockReq, mockRes, mockNext);
    
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.appointmentId).toBe(1);
            expect(pool.query).toHaveBeenCalledTimes(3);
        });
    
        it('should handle not found appointment', async () => {
            mockReq.params = { id: 999 };
    
            // Mock the pool.query to return no rows, simulating the appointment not being found
            pool.query.mockImplementation((query) => {
                if (query.text && query.text.includes('SELECT id FROM termine WHERE id = $1')) {
                    return Promise.resolve({ rows: [] });
                }
            });
    
            await appointmentController.deleteAppointment(mockReq, mockRes, mockNext);
    
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 404,
                message: expect.stringContaining('not found')
            }));
            expect(pool.query).toHaveBeenCalledTimes(1);
        });
    });
});