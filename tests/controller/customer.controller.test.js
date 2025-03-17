jest.mock('../../services/db.service');
jest.mock('../../utils/formatters');
jest.mock('../../utils/helpers');
jest.mock('../../services/export.service');

// Import the mocked modules
const pool = require('../../services/db.service');
const { formatDateSafely } = require('../../utils/formatters');
const helpers = require('../../utils/helpers');
const exportService = require('../../services/export.service');
const customerController = require('../../controllers/customer.controller');

describe('Customer Controller', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create Jest mock functions
        pool.query = jest.fn();
        formatDateSafely.mockImplementation((dateParam) => {
            return dateParam ? '01.01.2023' : '';
        });
        helpers.getProjektStatusInfo.mockReturnValue({ label: 'Project Status', className: 'primary' });
        helpers.getTerminStatusInfo.mockReturnValue({ label: 'Termin Status', className: 'primary' });
        
        exportService.generateExport = jest.fn().mockResolvedValue({ url: 'test-export-url' });

        // Mock request, response, next
        req = {
            params: {},
            query: {},
            body: {},
            session: {
                user: { id: 1, name: 'Test User' }
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            setHeader: jest.fn(),
            send: jest.fn()
        };

        next = jest.fn();
    });

    describe('getAllCustomers', () => {
        it('should get all customers with pagination', async () => {
            // Arrange: Prepare the request body with customer ID and status to be updated
            const PAGE = 1;
            const LIMIT = 10;
            req.query = { page: PAGE, limit: LIMIT };
            
            pool.query
              .mockResolvedValueOnce({
                rows: [
                  { id: 1, name: 'Test Customer', firma: 'Test Company', email: 'test@example.com', status: 'aktiv', kundentyp: 'privat', created_at: new Date() }
                ]
              })
              .mockResolvedValueOnce({
                rows: [{ total: '1' }]
              })
              .mockResolvedValueOnce({
                rows: [{ total: 1, privat: 1, geschaeft: 0, aktiv: 1 }]
              })
              .mockResolvedValueOnce({
                rows: [{ month: new Date(), customer_count: '1' }]
              });

            // Act
            await customerController.getAllCustomers(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response).toHaveProperty('customers');
            expect(response).toHaveProperty('pagination');
            expect(response).toHaveProperty('stats');
            expect(response).toHaveProperty('growthData');
        });

        it('should apply filters when provided', async () => {
            // Arrange: Prepare the request with filters
            req.query = { status: 'aktiv', type: 'privat', search: 'test', page: 1, limit: 10 };
            
            pool.query
              .mockResolvedValueOnce({ rows: [] })
              .mockResolvedValueOnce({ rows: [{ total: '0' }] })
              .mockResolvedValueOnce({ rows: [{ total: 0, privat: 0, geschaeft: 0, aktiv: 0 }] })
              .mockResolvedValueOnce({ rows: [] });

            // Act
            await customerController.getAllCustomers(req, res, next);

            // Assert
            // Check if the query includes the filter values
            const firstQueryCall = pool.query.mock.calls[0][0];
            expect(firstQueryCall).toContain('aktiv');
            expect(firstQueryCall).toContain('privat');
            expect(firstQueryCall).toContain('%test%');
        });

        it('should handle errors properly', async () => {
            // Arrange
            const error = new Error('Database error');
            pool.query.mockRejectedValue(error);

            // Act
            await customerController.getAllCustomers(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(error);
        });

        it('should format customer data correctly', async () => {
            // Arrange
            req.query = { page: 1, limit: 10 };
            
            const testDate = new Date('2023-01-15');
            
            pool.query
              .mockResolvedValueOnce({
                rows: [
                  { 
                    id: 1, 
                    name: 'Test Customer', 
                    firma: 'Test Company', 
                    email: 'test@example.com', 
                    status: 'aktiv', 
                    kundentyp: 'privat', 
                    created_at: testDate
                  }
                ]
              })
              .mockResolvedValueOnce({
                rows: [{ total: '1' }]
              })
              .mockResolvedValueOnce({
                rows: [{ total: 1, privat: 1, geschaeft: 0, aktiv: 1 }]
              })
              .mockResolvedValueOnce({
                rows: [{ month: testDate, customer_count: '1' }]
              });

            // Act
            await customerController.getAllCustomers(req, res, next);

            // Assert
            expect(formatDateSafely).toHaveBeenCalledWith(testDate, 'dd.MM.yyyy');
            expect(res.json).toHaveBeenCalled();
            const customer = res.json.mock.calls[0][0].customers[0];
            expect(customer.statusLabel).toBe('Aktiv');
            expect(customer.statusClass).toBe('success');
            expect(customer.kundentypLabel).toBe('Privatkunde');
        });

        it('should handle empty result sets', async () => {
            // Arrange
            req.query = { page: 1, limit: 10 };
            
            pool.query
              .mockResolvedValueOnce({ rows: [] })
              .mockResolvedValueOnce({ rows: [{ total: '0' }] })
              .mockResolvedValueOnce({ rows: [{ total: 0, privat: 0, geschaeft: 0, aktiv: 0 }] })
              .mockResolvedValueOnce({ rows: [] });

            // Act
            await customerController.getAllCustomers(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            const response = res.json.mock.calls[0][0];
            expect(response.customers).toEqual([]);
            expect(response.pagination.totalRecords).toBe(0);
        });

    });

    describe('getCustomerById', () => {
        it('should get a customer by id with related data', async () => {
            // Arrange
            req.params = { id: 1 };
            
            pool.query
              .mockResolvedValueOnce({
                rows: [{ id: 1, name: 'Test Customer', status: 'aktiv', kundentyp: 'privat', created_at: new Date() }]
              })
              .mockResolvedValueOnce({
                rows: [{ id: 1, titel: 'Test Appointment', termin_datum: new Date(), status: 'geplant' }]
              })
              .mockResolvedValueOnce({
                rows: [{ id: 1, titel: 'Test Project', start_datum: new Date(), status: 'aktiv' }]
              });

            // Act
            await customerController.getCustomerById(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response).toHaveProperty('customer');
            expect(response).toHaveProperty('appointments');
            expect(response).toHaveProperty('projects');
        });

        it('should return 404 if customer not found', async () => {
            // Arrange
            req.params = { id: 999 };
            pool.query.mockResolvedValue({ rows: [] });

            // Act
            await customerController.getCustomerById(req, res, next);

            // Assert
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(404);
        });
    });

    describe('createCustomer', () => {
        it('should create a new customer', async () => {
            // Arrange
            req.body = {
                name: 'New Customer',
                email: 'new@example.com',
                kundentyp: 'privat',
                status: 'aktiv'
            };
            
            pool.query
              .mockResolvedValueOnce({ rows: [{ id: 1 }] })
              .mockResolvedValueOnce({});

            // Act
            await customerController.createCustomer(req, res, next);

            // Assert
            expect(pool.query).toHaveBeenCalledTimes(2);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json.mock.calls[0][0].success).toBe(true);
        });

        it('should validate required fields', async () => {
            // Missing email is required for contact purposes
            req.body = { name: 'New Customer' }; 

            // Act
            await customerController.createCustomer(req, res, next);

            // Assert
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
        });
    });
    
    describe('addCustomerNote', () => {
        it('should add a note to customer', async () => {
            // Arrange
            req.params = { id: 1 };
            req.body = { notiz: 'Test note' };
            
            pool.query
              .mockResolvedValueOnce({ rows: [{ notizen: 'Previous notes' }] })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({});

            // Act
            await customerController.addCustomerNote(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json.mock.calls[0][0].success).toBe(true);
        });

        it('should validate note content', async () => {
            // Arrange
            req.params = { id: 1 };
            req.body = { notiz: '' }; // Empty note: Note content is required to provide meaningful information about the customer.

            // Act
            await customerController.addCustomerNote(req, res, next);

            // Assert
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
        });

        it('should return 404 if customer not found', async () => {
            // Arrange
            req.params = { id: 999 };
            req.body = { notiz: 'Test note' };
            
            pool.query.mockResolvedValueOnce({ rows: [] }); // Customer not found

            // Act
            await customerController.addCustomerNote(req, res, next);

            // Assert
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(404);
            expect(next.mock.calls[0][0].message).toContain('Customer with ID 999 not found');
        });
    });

    describe('updateCustomerStatus', () => {
        it('should update customer status', async () => {
            // Arrange
            req.body = { id: 1, status: 'inaktiv' };
            
            pool.query
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({});

            // Act
            await customerController.updateCustomerStatus(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json.mock.calls[0][0].success).toBe(true);
        });

        it('should validate status value', async () => {
            // Arrange
            // Invalid status value: valid status values are 'aktiv', 'inaktiv', 'geplant', etc.
            req.body = { id: 1, status: 'invalid-status' };

            // Act
            await customerController.updateCustomerStatus(req, res, next);

            // Assert
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
        });

        it('should validate required fields', async () => {
            // Arrange
            req.body = { id: 1 }; // Missing status field
            
            // Act
            await customerController.updateCustomerStatus(req, res, next);
            
            // Assert
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
            expect(next.mock.calls[0][0].message).toBe('Customer ID and status are required');
        });
        
        it('should validate customer ID', async () => {
            // Arrange
            req.body = { status: 'aktiv' }; // Missing id field
            
            // Act
            await customerController.updateCustomerStatus(req, res, next);
            
            // Assert
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
            expect(next.mock.calls[0][0].message).toBe('Customer ID and status are required');
        });
    });

    describe('deleteCustomer', () => {
        it('should mark customer as deleted when no related data exists', async () => {
            // Arrange
            req.body = { id: 1 };
            
            pool.query
              .mockResolvedValueOnce({ rows: [{ count: '0' }] })
              .mockResolvedValueOnce({ rows: [{ count: '0' }] })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({});

            // Act
            await customerController.deleteCustomer(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json.mock.calls[0][0].success).toBe(true);
        });

        it('should not delete customer with related data', async () => {
            // Arrange
            req.body = { id: 1 };
            
            pool.query
              .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // Mock related projects count
              .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // Mock related appointments count

            // Act
            await customerController.deleteCustomer(req, res, next);

            // Assert
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
        });

        it('should validate customer ID for deletion', async () => {
            // Arrange
            req.body = {}; // Missing id field
            
            // Act
            await customerController.deleteCustomer(req, res, next);
            
            // Assert
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
            expect(next.mock.calls[0][0].message).toBe('Customer ID is required');
        });
    });

    describe('exportCustomers', () => {
        it('should export customers in requested format', async () => {
            // Arrange
            req.query = { format: 'xlsx' };
            pool.query.mockResolvedValue({ rows: [{ id: 1, name: 'Test Customer' }] });
            
            const mockExportData = { url: 'test-export-url' };
            exportService.generateExport.mockResolvedValue(mockExportData);

            // Act
            await customerController.exportCustomers(req, res, next);

            // Assert
            expect(exportService.generateExport).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockExportData);
        });

        it('should apply filters to export', async () => {
            // Arrange
            req.query = { format: 'xlsx', status: 'aktiv', type: 'privat' };
            pool.query.mockResolvedValue({ rows: [{ id: 1, name: 'Test Customer' }] });
            
            // Act
            await customerController.exportCustomers(req, res, next);

            // Assert
            expect(pool.query).toHaveBeenCalledWith(expect.objectContaining({
                values: expect.arrayContaining(['aktiv', 'privat'])
            }));
            expect(exportService.generateExport).toHaveBeenCalled();
        });

        it('should handle export errors', async () => {
            // Arrange
            req.query = { format: 'invalid' };
            const error = new Error('Invalid export format');
            exportService.generateExport.mockRejectedValue(error);
            pool.query.mockResolvedValue({ rows: [] });

            // Act
            await customerController.exportCustomers(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(error);
        });

        it('should pass correct column formatters to exportService', async () => {
            // Arrange
            req.query = { format: 'xlsx' };
            const mockCustomer = { 
                id: 1, 
                name: 'Test Customer',
                kundentyp: 'geschaeft',
                status: 'aktiv',
                created_at: new Date('2023-05-15'),
                newsletter: true
            };
            pool.query.mockResolvedValue({ rows: [mockCustomer] });
            
            // Act
            await customerController.exportCustomers(req, res, next);
            
            // Assert
            expect(exportService.generateExport).toHaveBeenCalled();
            
            // Extract the columns configuration passed to generateExport
            const columnsConfig = exportService.generateExport.mock.calls[0][2].columns;
            
            // Find the specific columns we want to test
            const kundentypColumn = columnsConfig.find(col => col.key === 'kundentyp');
            const statusColumn = columnsConfig.find(col => col.key === 'status');
            const createdAtColumn = columnsConfig.find(col => col.key === 'created_at');
            const newsletterColumn = columnsConfig.find(col => col.key === 'newsletter');
            
            // Test formatters
            expect(kundentypColumn.format('geschaeft')).toBe('Geschäftskunde');
            expect(kundentypColumn.format('privat')).toBe('Privatkunde');
            
            expect(statusColumn.format('aktiv')).toBe('Aktiv');
            expect(statusColumn.format('inaktiv')).toBe('Inaktiv');
            
            // For created_at, we need to verify it calls formatDateSafely
            expect(createdAtColumn.format(mockCustomer.created_at)).toBe('01.01.2023');
            expect(formatDateSafely).toHaveBeenCalledWith(
                mockCustomer.created_at, 
                'dd.MM.yyyy'
            );
            
            expect(newsletterColumn.format(true)).toBe('Ja');
            expect(newsletterColumn.format(false)).toBe('Nein');
        });

        it('should exclude deleted customers by default in export', async () => {
            // Arrange
            req.query = { format: 'csv' };
            pool.query.mockResolvedValue({ rows: [] });
            
            // Act
            await customerController.exportCustomers(req, res, next);
            
            // Assert
            expect(pool.query).toHaveBeenCalled();
            const queryText = pool.query.mock.calls[0][0].text;
            expect(queryText).toContain(`status != 'geloescht'`);
        });

        it('should include all columns in export with correct widths', async () => {
            // Arrange
            req.query = { format: 'xlsx' };
            pool.query.mockResolvedValue({ rows: [] });
            
            // Act
            await customerController.exportCustomers(req, res, next);
            
            // Assert
            const columnsConfig = exportService.generateExport.mock.calls[0][2].columns;
            
            // Check all required columns are present with correct widths
            expect(columnsConfig).toContainEqual(expect.objectContaining({ header: 'ID', key: 'id', width: 10 }));
            expect(columnsConfig).toContainEqual(expect.objectContaining({ header: 'Name', key: 'name', width: 20 }));
            expect(columnsConfig).toContainEqual(expect.objectContaining({ header: 'Firma', key: 'firma', width: 20 }));
            expect(columnsConfig).toContainEqual(expect.objectContaining({ header: 'E-Mail', key: 'email', width: 25 }));
            expect(columnsConfig).toContainEqual(expect.objectContaining({ header: 'Telefon', key: 'telefon', width: 15 }));
            expect(columnsConfig).toContainEqual(expect.objectContaining({ header: 'Adresse', key: 'adresse', width: 25 }));
            expect(columnsConfig).toContainEqual(expect.objectContaining({ header: 'PLZ', key: 'plz', width: 10 }));
            expect(columnsConfig).toContainEqual(expect.objectContaining({ header: 'Ort', key: 'ort', width: 15 }));
            expect(columnsConfig).toContainEqual(expect.objectContaining({ header: 'Land', key: 'land', width: 15 }));
            expect(columnsConfig).toContainEqual(expect.objectContaining({ header: 'Kundentyp', key: 'kundentyp', width: 15 }));
            expect(columnsConfig).toContainEqual(expect.objectContaining({ header: 'Status', key: 'status', width: 12 }));
            expect(columnsConfig).toContainEqual(expect.objectContaining({ header: 'Erstellt am', key: 'created_at', width: 18 }));
            expect(columnsConfig).toContainEqual(expect.objectContaining({ header: 'Newsletter', key: 'newsletter', width: 12 }));
        });

    });

    describe('updateCustomer', () => {
        it('should update an existing customer', async () => {
            // Arrange
            req.params = { id: 1 };
            req.body = {
                name: 'Updated Customer',
                email: 'updated@example.com',
                kundentyp: 'geschaeft',
                status: 'aktiv'
            };
            
            pool.query
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check if customer exists
                .mockResolvedValueOnce({}) // Update customer
                .mockResolvedValueOnce({}); // Log activity

            // Act
            await customerController.updateCustomer(req, res, next);

            // Assert
            expect(pool.query).toHaveBeenCalledTimes(3);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json.mock.calls[0][0].success).toBe(true);
        });

        it('should return 404 if customer not found', async () => {
            // Arrange
            req.params = { id: 999 };
            req.body = { name: 'Updated', email: 'updated@example.com' };
            pool.query.mockResolvedValue({ rows: [] });

            // Act
            await customerController.updateCustomer(req, res, next);

            // Assert
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(404);
        });

        it('should validate required fields', async () => {
            // Arrange
            req.params = { id: 1 };
            req.body = { name: '', email: '' };  // Missing required fields

            // Act
            await customerController.updateCustomer(req, res, next);

            // Assert
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
        });
    });
});