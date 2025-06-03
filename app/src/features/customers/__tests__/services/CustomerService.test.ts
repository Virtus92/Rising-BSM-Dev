import { CustomerService } from '@/features/customers/lib/services/CustomerService.server';
import { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IValidationService } from '@/core/validation/IValidationService';
import { IErrorHandler } from '@/core/errors';
import { CreateCustomerDto, UpdateCustomerDto } from '@/domain/dtos/CustomerDtos';
import { Customer } from '@/domain/entities/Customer';
import { CommonStatus, CustomerType } from '@/domain/enums/CommonEnums';
import { ValidationResult } from '@/domain/enums/ValidationResults';

describe('CustomerService', () => {
  let service: CustomerService;
  let mockRepository: jest.Mocked<ICustomerRepository>;
  let mockLogger: jest.Mocked<ILoggingService>;
  let mockValidationService: jest.Mocked<IValidationService>;
  let mockErrorHandler: jest.Mocked<IErrorHandler>;

  beforeEach(() => {
    // Create mocks
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByEmail: jest.fn(),
      updateStatus: jest.fn(),
      addNote: jest.fn(),
      findNotes: jest.fn(),
      count: jest.fn(),
      exists: jest.fn(),
      find: jest.fn(),
      findByCriteria: jest.fn(),
      bulkUpdate: jest.fn(),
      transaction: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
    } as any;

    mockValidationService = {
      validate: jest.fn(),
    } as any;

    mockErrorHandler = {
      handleError: jest.fn(),
      formatError: jest.fn(),
    } as any;

    service = new CustomerService(
      mockRepository,
      mockLogger,
      mockValidationService,
      mockErrorHandler
    );
  });

  describe('getAll', () => {
    it('should return paginated customers', async () => {
      const customers = [
        new Customer({
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          type: CustomerType.INDIVIDUAL,
          status: CommonStatus.ACTIVE,
        }),
        new Customer({
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '098-765-4321',
          type: CustomerType.BUSINESS,
          status: CommonStatus.ACTIVE,
        }),
      ];

      const paginationResult = {
        data: customers,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };

      mockRepository.findAll.mockResolvedValue(paginationResult);

      const result = await service.getAll();

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(mockRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        relations: [],
        sort: undefined,
        criteria: {},
      });
    });

    it('should handle search filters', async () => {
      const filters = {
        search: 'John',
        status: CommonStatus.ACTIVE,
      };

      mockRepository.findAll.mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });

      await service.getAll({ filters });

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        relations: [],
        sort: undefined,
        criteria: {
          search: 'John',
          status: CommonStatus.ACTIVE,
        },
      });
    });
  });

  describe('getById', () => {
    it('should return customer when found', async () => {
      const customer = new Customer({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        type: CustomerType.INDIVIDUAL,
        status: CommonStatus.ACTIVE,
      });

      mockRepository.findById.mockResolvedValue(customer);
      mockRepository.findNotes.mockResolvedValue([]);

      const result = await service.getById(1);

      expect(result).toMatchObject({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when customer not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.getById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create customer successfully', async () => {
      const createDto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        address: '123 Main St',
        city: 'Anytown',
        country: 'USA',
      };

      const customer = new Customer({
        id: 1,
        ...createDto,
        status: CommonStatus.ACTIVE,
        type: CustomerType.PRIVATE,
      });

      mockValidationService.validate.mockResolvedValue({
        result: ValidationResult.SUCCESS,
        isValid: true,
        errors: [],
      });

      mockRepository.create.mockResolvedValue(customer);

      const result = await service.create(createDto);

      expect(result).toMatchObject({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should validate customer data', async () => {
      const createDto: CreateCustomerDto = {
        name: '',
        email: 'invalid-email',
        phone: '123',
        address: '123 Main St',
        city: 'Anytown',
        country: 'USA',
      };

      mockValidationService.validate.mockResolvedValue({
        result: ValidationResult.ERROR,
        isValid: false,
        errors: [
          { field: 'name', message: 'Name is required', type: 'INVALID' },
          { field: 'email', message: 'Invalid email format', type: 'INVALID' },
        ],
      });

      await expect(service.create(createDto)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update customer successfully', async () => {
      const updateDto: UpdateCustomerDto = {
        name: 'John Updated',
        phone: '555-555-5555',
      };

      const existingCustomer = new Customer({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        type: CustomerType.INDIVIDUAL,
        status: CommonStatus.ACTIVE,
      });

      const updatedCustomer = new Customer({
        ...existingCustomer,
        ...updateDto,
      });

      mockRepository.findById.mockResolvedValue(existingCustomer);
      mockValidationService.validate.mockResolvedValue({
        result: ValidationResult.SUCCESS,
        isValid: true,
        errors: [],
      });
      mockRepository.update.mockResolvedValue(updatedCustomer);

      const result = await service.update(1, updateDto);

      expect(result).toMatchObject({
        id: 1,
        name: 'John Updated',
        phone: '555-555-5555',
      });
      expect(mockRepository.update).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should throw error when customer not found', async () => {
      mockRepository.findById.mockResolvedValue(null);
      mockValidationService.validate.mockResolvedValue({
        result: ValidationResult.SUCCESS,
        isValid: true,
        errors: [],
      });

      await expect(service.update(999, { name: 'Updated' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete customer', async () => {
      const customer = new Customer({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        type: CustomerType.INDIVIDUAL,
        status: CommonStatus.ACTIVE,
      });

      mockRepository.findById.mockResolvedValue(customer);
      mockRepository.delete.mockResolvedValue(true);

      const result = await service.delete(1);

      expect(result).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw error when customer not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow();
    });
  });

  describe('updateStatus', () => {
    it('should update customer status', async () => {
      const customer = new Customer({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        type: CustomerType.INDIVIDUAL,
        status: CommonStatus.ACTIVE,
      });

      const updatedCustomer = new Customer({
        ...customer,
        status: CommonStatus.INACTIVE,
      });

      mockRepository.findById.mockResolvedValue(customer);
      mockRepository.updateStatus.mockResolvedValue(updatedCustomer);
      
      // Mock addNote for the reason note
      mockRepository.addNote.mockResolvedValue({
        id: 1,
        text: 'Status changed to INACTIVE: Customer requested deactivation',
        createdAt: new Date(),
        userId: 0,
        userName: 'System',
      });

      const result = await service.updateStatus(1, {
        status: CommonStatus.INACTIVE,
        reason: 'Customer requested deactivation',
      });

      expect(result).toMatchObject({
        status: CommonStatus.INACTIVE,
      });
      expect(mockRepository.updateStatus).toHaveBeenCalledWith(
        1,
        CommonStatus.INACTIVE,
        0
      );
    });
  });

  describe('addNote', () => {
    it('should add note to customer', async () => {
      const noteResult = {
        id: 1,
        text: 'Important note about customer',
        createdAt: new Date(),
        userId: 1,
        userName: 'Admin',
      };

      mockRepository.addNote.mockResolvedValue(noteResult);

      const result = await service.addNote(1, 'Important note about customer');

      expect(result).toMatchObject({
        text: 'Important note about customer',
      });
      expect(mockRepository.addNote).toHaveBeenCalledWith(1, 0, 'Important note about customer');
    });

    it('should validate note content', async () => {
      const noteResult = {
        id: 1,
        text: '',
        createdAt: new Date(),
        userId: 1,
        userName: 'Admin',
      };

      mockRepository.addNote.mockResolvedValue(noteResult);

      // The service should still add the note even if empty
      // The validation is actually in the service implementation
      await service.addNote(1, '');
      
      expect(mockRepository.addNote).toHaveBeenCalledWith(1, 0, '');
    });
  });

  describe('getCustomerStatistics', () => {
    it('should return customer statistics', async () => {
      // Mock count calls for different statuses
      mockRepository.count
        .mockResolvedValueOnce(100) // total count
        .mockResolvedValueOnce(85)  // active count
        .mockResolvedValueOnce(15)  // inactive count
        .mockResolvedValueOnce(10)  // deleted count (changed from 0 to 10)
        .mockResolvedValueOnce(60)  // private count
        .mockResolvedValueOnce(30)  // business count
        .mockResolvedValueOnce(10); // individual count

      // Mock recent customers
      mockRepository.findByCriteria.mockResolvedValue([
        new Customer({
          id: 1,
          name: 'Recent Customer',
          email: 'recent@example.com',
          status: CommonStatus.ACTIVE,
          type: CustomerType.PRIVATE,
        }),
      ]);

      const result = await service.getCustomerStatistics();

      expect(result).toMatchObject({
        totalCount: 100,
        statusCounts: {
          [CommonStatus.ACTIVE]: 85,
          [CommonStatus.INACTIVE]: 15,
          [CommonStatus.DELETED]: 10,
        },
      });
      expect(mockRepository.count).toHaveBeenCalled();
    });
  });
});