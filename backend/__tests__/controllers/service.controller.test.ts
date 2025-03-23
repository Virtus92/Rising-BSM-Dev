import { Request, Response } from 'express';
import { 
  getAllServices,
  getServiceById,
  createService,
  updateService,
  toggleServiceStatus,
  getServiceStatistics
} from '../../controllers/service.controller';
import { serviceService } from '../../services/service.service';

// Mock the serviceService
jest.mock('../../services/service.service', () => ({
  serviceService: {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
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

describe('Service Controller', () => {
  let req: Partial<Request>;
  let res: Response;

  beforeEach(() => {
    req = {};
    res = mockResponse();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllServices', () => {
    it('should get all services with filters', async () => {
      // Arrange
      req.query = { 
        status: 'aktiv', 
        search: 'test', 
        page: '1', 
        limit: '10' 
      };
      
      const mockServices = [
        { id: 1, name: 'Service 1', preis_basis: 100, einheit: 'Stunde', aktiv: true },
        { id: 2, name: 'Service 2', preis_basis: 200, einheit: 'Tag', aktiv: true }
      ];
      
      const mockPagination = {
        total: 2,
        page: 1,
        limit: 10,
        pages: 1
      };
      
      (serviceService.findAll as jest.Mock).mockResolvedValue({
        data: mockServices,
        pagination: mockPagination
      });

      // Act
      await getAllServices(req as Request, res);

      // Assert
      expect(serviceService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'aktiv',
          search: 'test',
          page: 1,
          limit: 10
        }),
        expect.objectContaining({
          page: 1,
          limit: 10
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockServices,
        pagination: mockPagination
      }));
    });
  });

  describe('getServiceById', () => {
    it('should get service by id', async () => {
      // Arrange
      req.params = { id: '1' };
      
      const mockService = { 
        id: 1, 
        name: 'Test Service',
        preis_basis: 100,
        einheit: 'Stunde',
        aktiv: true
      };
      
      (serviceService.findById as jest.Mock).mockResolvedValue(mockService);

      // Act
      await getServiceById(req as Request, res);

      // Assert
      expect(serviceService.findById).toHaveBeenCalledWith(1, { throwIfNotFound: true });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockService
      }));
    });

    it('should return 400 if id is invalid', async () => {
      // Arrange
      req.params = { id: 'invalid' };

      // Act & Assert
      await expect(getServiceById(req as Request, res)).rejects.toThrow();
    });
  });

  describe('createService', () => {
    it('should create a new service', async () => {
      // Arrange
      const serviceData = {
        name: 'New Service',
        preis_basis: 150,
        einheit: 'Stunde',
        beschreibung: 'Service description',
        mwst_satz: 20,
        aktiv: true
      };
      
      req.body = serviceData;
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };
      
      const mockCreatedService = { 
        id: 1, 
        ...serviceData 
      };
      
      (serviceService.create as jest.Mock).mockResolvedValue(mockCreatedService);

      // Act
      await createService(req as any, res);

      // Assert
      expect(serviceService.create).toHaveBeenCalledWith(
        serviceData,
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
        data: { serviceId: 1 }
      }));
    });
  });

  describe('updateService', () => {
    it('should update an existing service', async () => {
      // Arrange
      req.params = { id: '1' };
      const serviceData = {
        name: 'Updated Service',
        preis_basis: 180,
        beschreibung: 'Updated description'
      };
      
      req.body = serviceData;
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };
      
      const mockUpdatedService = { 
        id: 1, 
        ...serviceData 
      };
      
      (serviceService.update as jest.Mock).mockResolvedValue(mockUpdatedService);

      // Act
      await updateService(req as any, res);

      // Assert
      expect(serviceService.update).toHaveBeenCalledWith(
        1,
        serviceData,
        expect.objectContaining({
          userContext: expect.any(Object),
          throwIfNotFound: true
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { serviceId: 1 }
      }));
    });
  });

  describe('toggleServiceStatus', () => {
    it('should toggle service status', async () => {
      // Arrange
      req.params = { id: '1' };
      const statusData = {
        aktiv: true
      };
      
      req.body = statusData;
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };
      
      const mockUpdatedService = { 
        id: 1, 
        aktiv: true
      };
      
      (serviceService.updateStatus as jest.Mock).mockResolvedValue(mockUpdatedService);

      // Act
      await toggleServiceStatus(req as any, res);

      // Assert
      expect(serviceService.updateStatus).toHaveBeenCalledWith(
        1,
        true,
        expect.objectContaining({
          userContext: expect.any(Object)
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { serviceId: 1 },
        message: 'Service activated successfully'
      }));
    });
    
    it('should handle boolean or string input for aktiv field', async () => {
      // Arrange
      req.params = { id: '1' };
      req.body = { aktiv: 'on' };
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };
      
      const mockUpdatedService = { id: 1, aktiv: true };
      
      (serviceService.updateStatus as jest.Mock).mockResolvedValue(mockUpdatedService);

      // Act
      await toggleServiceStatus(req as any, res);

      // Assert
      expect(serviceService.updateStatus).toHaveBeenCalledWith(
        1,
        true,  // 'on' should be converted to true
        expect.any(Object)
      );
    });
  });

  describe('getServiceStatistics', () => {
    it('should get service statistics', async () => {
      // Arrange
      req.params = { id: '1' };
      
      const mockStatistics = {
        usage: {
          totalProjects: 15,
          activeProjects: 8
        },
        revenue: {
          total: 12000,
          average: 800
        }
      };
      
      (serviceService.getStatistics as jest.Mock).mockResolvedValue(mockStatistics);

      // Act
      await getServiceStatistics(req as Request, res);

      // Assert
      expect(serviceService.getStatistics).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { statistics: mockStatistics }
      }));
    });
  });
});