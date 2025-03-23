import { Request, Response } from 'express';
import { 
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  updateCustomerStatus,
  addCustomerNote,
  getCustomerStatistics
} from '../../controllers/customer.controller';
import { customerService } from '../../services/customer.service';

// Mock the customerService
jest.mock('../../services/customer.service', () => ({
  customerService: {
    findAll: jest.fn(),
    findByIdWithDetails: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    addNote: jest.fn(),
    getStatistics: jest.fn()
  }
}));

// Mock Response object
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('Customer Controller', () => {
  let req: Partial<Request>;
  let res: Response;

  beforeEach(() => {
    req = {};
    res = mockResponse();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCustomers', () => {
    it('should get all customers with filters', async () => {
      // Arrange
      req.query = { 
        status: 'aktiv', 
        type: 'privat', 
        search: 'test', 
        page: '1', 
        limit: '10',
        sortBy: 'name',
        sortDirection: 'asc'
      };
      
      const mockCustomers = [
        { id: 1, name: 'Customer 1', email: 'customer1@example.com' },
        { id: 2, name: 'Customer 2', email: 'customer2@example.com' }
      ];
      
      const mockPagination = {
        total: 2,
        page: 1,
        limit: 10,
        pages: 1
      };
      
      (customerService.findAll as jest.Mock).mockResolvedValue({
        data: mockCustomers,
        pagination: mockPagination
      });

      // Act
      await getAllCustomers(req as Request, res);

      // Assert
      expect(customerService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'aktiv',
          type: 'privat',
          search: 'test',
          page: 1,
          limit: 10,
          sortBy: 'name',
          sortDirection: 'asc'
        }),
        expect.objectContaining({
          page: 1,
          limit: 10,
          orderBy: 'name',
          orderDirection: 'asc'
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockCustomers,
        pagination: mockPagination
      }));
    });
  });

  describe('getCustomerById', () => {
    it('should get customer by id with details', async () => {
      // Arrange
      req.params = { id: '1' };
      
      const mockCustomer = { 
        id: 1, 
        name: 'Test Customer',
        email: 'test@example.com',
        projects: [
          { id: 1, title: 'Project 1' }
        ],
        appointments: [
          { id: 1, title: 'Appointment 1' }
        ]
      };
      
      (customerService.findByIdWithDetails as jest.Mock).mockResolvedValue(mockCustomer);

      // Act
      await getCustomerById(req as Request, res);

      // Assert
      expect(customerService.findByIdWithDetails).toHaveBeenCalledWith(1, { throwIfNotFound: true });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockCustomer
      }));
    });

    it('should return 400 if id is invalid', async () => {
      // Arrange
      req.params = { id: 'invalid' };

      // Act & Assert
      await expect(getCustomerById(req as Request, res)).rejects.toThrow();
    });
  });

  describe('createCustomer', () => {
    it('should create a new customer', async () => {
      // Arrange
      const customerData = {
        name: 'New Customer',
        email: 'new@example.com',
        telefon: '123456789',
        adresse: 'Test Street 1',
        plz: '12345',
        ort: 'Test City',
        status: 'aktiv',
        kundentyp: 'privat'
      };
      
      req.body = customerData;
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };
      
      const mockCreatedCustomer = { 
        id: 1, 
        ...customerData 
      };
      
      (customerService.create as jest.Mock).mockResolvedValue(mockCreatedCustomer);

      // Act
      await createCustomer(req as any, res);

      // Assert
      expect(customerService.create).toHaveBeenCalledWith(
        customerData,
        expect.objectContaining({
          userContext: expect.objectContaining({
            userId: 1,
            userName: 'Test User',
            userRole: 'admin'
          })
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockCreatedCustomer
      }));
    });
  });

  describe('updateCustomer', () => {
    it('should update an existing customer', async () => {
      // Arrange
      req.params = { id: '1' };
      const customerData = {
        name: 'Updated Customer',
        email: 'updated@example.com',
        telefon: '987654321'
      };
      
      req.body = customerData;
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };
      
      const mockUpdatedCustomer = { 
        id: 1, 
        ...customerData 
      };
      
      (customerService.update as jest.Mock).mockResolvedValue(mockUpdatedCustomer);

      // Act
      await updateCustomer(req as any, res);

      // Assert
      expect(customerService.update).toHaveBeenCalledWith(
        1,
        customerData,
        expect.objectContaining({
          userContext: expect.any(Object),
          throwIfNotFound: true
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockUpdatedCustomer
      }));
    });
  });

  describe('updateCustomerStatus', () => {
    it('should update customer status', async () => {
      // Arrange
      req.params = { id: '1' };
      const statusData = {
        status: 'inaktiv',
        note: 'Status update note'
      };
      
      req.body = statusData;
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };
      
      const mockUpdatedCustomer = { 
        id: 1, 
        status: 'inaktiv'
      };
      
      (customerService.updateStatus as jest.Mock).mockResolvedValue(mockUpdatedCustomer);

      // Act
      await updateCustomerStatus(req as any, res);

      // Assert
      expect(customerService.updateStatus).toHaveBeenCalledWith(
        1,
        'inaktiv',
        'Status update note',
        expect.objectContaining({
          userContext: expect.any(Object)
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockUpdatedCustomer
      }));
    });
    
    it('should throw error if status is missing', async () => {
      // Arrange
      req.params = { id: '1' };
      req.body = { note: 'Status update note' }; // Status missing
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };

      // Act & Assert
      await expect(updateCustomerStatus(req as any, res)).rejects.toThrow();
    });
  });

  describe('addCustomerNote', () => {
    it('should add a note to a customer', async () => {
      // Arrange
      req.params = { id: '1' };
      req.body = { note: 'New note for customer' };
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };
      
      const mockAddedNote = { 
        id: 1, 
        customerId: 1,
        text: 'New note for customer',
        userId: 1,
        userName: 'Test User'
      };
      
      (customerService.addNote as jest.Mock).mockResolvedValue(mockAddedNote);

      // Act
      await addCustomerNote(req as any, res);

      // Assert
      expect(customerService.addNote).toHaveBeenCalledWith(
        1,
        'New note for customer',
        expect.objectContaining({
          userContext: expect.any(Object)
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockAddedNote,
        message: 'Note added successfully',
        statusCode: 201
      }));
    });
    
    it('should throw error if note text is missing', async () => {
      // Arrange
      req.params = { id: '1' };
      req.body = {}; // Note missing
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };

      // Act & Assert
      await expect(addCustomerNote(req as any, res)).rejects.toThrow();
    });
  });

  describe('getCustomerStatistics', () => {
    it('should get customer statistics', async () => {
      // Arrange
      const mockStatistics = {
        total: 100,
        active: 80,
        inactive: 15,
        deleted: 5,
        byType: {
          privat: 70,
          geschaeft: 30
        },
        newThisMonth: 12
      };
      
      (customerService.getStatistics as jest.Mock).mockResolvedValue(mockStatistics);

      // Act
      await getCustomerStatistics(req as Request, res);

      // Assert
      expect(customerService.getStatistics).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockStatistics
      }));
    });
  });
});