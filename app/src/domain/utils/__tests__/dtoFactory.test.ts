import {
  createUserResponseDto,
  createCustomerResponseDto,
  createRequestResponseDto,
  createNotificationResponseDto,
  createPermissionResponseDto
} from '../dtoFactory';

import { UserRole, UserStatus } from '@/domain/enums/UserEnums';
import { 
  CommonStatus, 
  CustomerType, 
  RequestStatus, 
  NotificationType,
  RequestType
} from '@/domain/enums/CommonEnums';
import { EntityType } from '@/domain/enums/EntityTypes';

describe('DtoFactory', () => {
  describe('createUserResponseDto', () => {
    it('should create a dto with default values when no partial data is provided', () => {
      const dto = createUserResponseDto();
      
      expect(dto.id).toBe(0);
      expect(dto.name).toBe('');
      expect(dto.email).toBe('');
      expect(dto.role).toBe(UserRole.USER);
      expect(dto.status).toBe(UserStatus.INACTIVE);
      expect(dto.permissions).toEqual([]);
      expect(dto.phone).toBeUndefined();
      expect(dto.lastLoginAt).toBeUndefined();
      expect(typeof dto.createdAt).toBe('string');
      expect(typeof dto.updatedAt).toBe('string');
    });

    it('should override default values with provided partial data', () => {
      const now = new Date().toISOString();
      const partialData = {
        id: 42,
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        permissions: ['users.view', 'users.edit'],
        phone: '123-456-7890',
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now
      };
      
      const dto = createUserResponseDto(partialData);
      
      expect(dto.id).toBe(42);
      expect(dto.name).toBe('Test User');
      expect(dto.email).toBe('test@example.com');
      expect(dto.role).toBe(UserRole.ADMIN);
      expect(dto.status).toBe(UserStatus.ACTIVE);
      expect(dto.permissions).toEqual(['users.view', 'users.edit']);
      expect(dto.phone).toBe('123-456-7890');
      expect(dto.lastLoginAt).toBe(now);
      expect(dto.createdAt).toBe(now);
      expect(dto.updatedAt).toBe(now);
    });
  });
  
  describe('createCustomerResponseDto', () => {
    it('should create a dto with default values when no partial data is provided', () => {
      const dto = createCustomerResponseDto();
      
      expect(dto.id).toBe(0);
      expect(dto.name).toBe('');
      expect(dto.email).toBeUndefined();
      expect(dto.phone).toBeUndefined();
      expect(dto.postalCode).toBe('');
      expect(dto.country).toBe('');
      expect(dto.newsletter).toBe(false);
      expect(dto.status).toBe(CommonStatus.INACTIVE);
      expect(dto.type).toBe(CustomerType.INDIVIDUAL);
      expect(dto.notes).toEqual([]);
      expect(dto.appointments).toEqual([]);
      expect(typeof dto.createdAt).toBe('string');
      expect(typeof dto.updatedAt).toBe('string');
    });

    it('should override default values with provided partial data', () => {
      const now = new Date().toISOString();
      const partialData = {
        id: 42,
        name: 'Test Request',
        email: 'request@example.com',
        phone: '123-456-7890',
        message: 'Test message',
        service: 'Test service',
        status: CommonStatus.ACTIVE,
        type: CustomerType.BUSINESS,
        source: 'form' as const,
        customerId: 10,
        processorId: 20,
        appointmentId: 30,
        customerName: 'Test Customer',
        processorName: 'Test Processor',
        createdAt: now,
        updatedAt: now
      };
      
      const dto = createCustomerResponseDto(partialData);
      
      expect(dto.id).toBe(42);
      expect(dto.name).toBe('Test Customer');
      expect(dto.email).toBe('customer@example.com');
      expect(dto.phone).toBe('123-456-7890');
      expect(dto.postalCode).toBe('12345');
      expect(dto.country).toBe('USA');
      expect(dto.newsletter).toBe(true);
      expect(dto.status).toBe(CommonStatus.ACTIVE);
      expect(dto.type).toBe(CustomerType.BUSINESS);
      expect(dto.notes).toEqual(['Note 1', 'Note 2']);
      expect(dto.appointments).toEqual([{ id: 1, title: 'Test Appointment' }]);
      expect(dto.createdAt).toBe(now);
      expect(dto.updatedAt).toBe(now);
    });
  });
  
  describe('createRequestResponseDto', () => {
    it('should create a dto with default values when no partial data is provided', () => {
      const dto = createRequestResponseDto();
      
      expect(dto.id).toBe(0);
      expect(dto.name).toBe('');
      expect(dto.email).toBe('');
      expect(dto.phone).toBeUndefined();
      expect(dto.message).toBe('');
      expect(dto.service).toBe('');
      expect(dto.status).toBe(RequestStatus.NEW);
      expect(dto.type).toBe(RequestType.GENERAL);
      expect(dto.source).toBeUndefined();
      expect(dto.customerId).toBeUndefined();
      expect(dto.processorId).toBeUndefined();
      expect(dto.appointmentId).toBeUndefined();
      expect(dto.customerName).toBeUndefined();
      expect(dto.processorName).toBeUndefined();
      expect(typeof dto.createdAt).toBe('string');
      expect(typeof dto.updatedAt).toBe('string');
    });

    it('should override default values with provided partial data', () => {
      const now = new Date().toISOString();
      const partialData = {
        id: 42,
        name: 'Test Request',
        email: 'request@example.com',
        phone: '123-456-7890',
        message: 'Test message',
        service: 'Test service',
        status: RequestStatus.IN_PROGRESS,
        type: RequestType.SUPPORT,
        source: 'form' as const,
        customerId: 10,
        processorId: 20,
        appointmentId: 30,
        customerName: 'Test Customer',
        processorName: 'Test Processor',
        createdAt: now,
        updatedAt: now
      };
      
      const dto = createRequestResponseDto(partialData);
      
      expect(dto.id).toBe(42);
      expect(dto.name).toBe('Test Request');
      expect(dto.email).toBe('request@example.com');
      expect(dto.phone).toBe('123-456-7890');
      expect(dto.message).toBe('Test message');
      expect(dto.service).toBe('Test service');
      expect(dto.status).toBe(RequestStatus.IN_PROGRESS);
      expect(dto.type).toBe(RequestType.SUPPORT);
      expect(dto.source).toBe('website');
      expect(dto.customerId).toBe(10);
      expect(dto.processorId).toBe(20);
      expect(dto.appointmentId).toBe(30);
      expect(dto.customerName).toBe('Test Customer');
      expect(dto.processorName).toBe('Test Processor');
      expect(dto.createdAt).toBe(now);
      expect(dto.updatedAt).toBe(now);
    });
  });
  
  describe('createNotificationResponseDto', () => {
    it('should create a dto with default values when no partial data is provided', () => {
      const dto = createNotificationResponseDto();
      
      expect(dto.id).toBe(0);
      expect(dto.userId).toBe(0);
      expect(dto.title).toBe('');
      expect(dto.message).toBe('');
      expect(dto.type).toBe(NotificationType.INFO);
      expect(dto.isRead).toBe(false);
      expect(dto.link).toBeUndefined();
      expect(dto.customerId).toBeUndefined();
      expect(dto.appointmentId).toBeUndefined();
      expect(dto.contactRequestId).toBeUndefined();
      expect(typeof dto.createdAt).toBe('string');
      expect(typeof dto.updatedAt).toBe('string');
    });

    it('should override default values with provided partial data', () => {
      const now = new Date().toISOString();
      const partialData = {
        id: 42,
        userId: 10,
        title: 'Test Notification',
        message: 'Test message',
        type: NotificationType.WARNING,
        isRead: true,
        link: '/dashboard/test',
        customerId: 20,
        appointmentId: 30,
        contactRequestId: 40,
        createdAt: now,
        updatedAt: now
      };
      
      const dto = createNotificationResponseDto(partialData);
      
      expect(dto.id).toBe(42);
      expect(dto.userId).toBe(10);
      expect(dto.title).toBe('Test Notification');
      expect(dto.message).toBe('Test message');
      expect(dto.type).toBe(NotificationType.WARNING);
      expect(dto.isRead).toBe(true);
      expect(dto.link).toBe('/dashboard/test');
      expect(dto.customerId).toBe(20);
      expect(dto.appointmentId).toBe(30);
      expect(dto.contactRequestId).toBe(40);
      expect(dto.createdAt).toBe(now);
      expect(dto.updatedAt).toBe(now);
    });
  });
  
  describe('createPermissionResponseDto', () => {
    it('should create a dto with default values when no partial data is provided', () => {
      const dto = createPermissionResponseDto();
      
      expect(dto.id).toBe(0);
      expect(dto.code).toBe('');
      expect(dto.name).toBe('');
      expect(dto.description).toBe('');
      expect(dto.category).toBe('general');
      expect(typeof dto.createdAt).toBe('string');
      expect(typeof dto.updatedAt).toBe('string');
    });

    it('should override default values with provided partial data', () => {
      const now = new Date().toISOString();
      const partialData = {
        id: 42,
        code: 'test.permission',
        name: 'Test Permission',
        description: 'Test description',
        category: 'test',
        createdAt: now,
        updatedAt: now
      };
      
      const dto = createPermissionResponseDto(partialData);
      
      expect(dto.id).toBe(42);
      expect(dto.code).toBe('test.permission');
      expect(dto.name).toBe('Test Permission');
      expect(dto.description).toBe('Test description');
      expect(dto.category).toBe('test');
      expect(dto.createdAt).toBe(now);
      expect(dto.updatedAt).toBe(now);
    });
  });
});