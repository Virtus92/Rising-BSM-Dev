import { ContactRequest } from '../ContactRequest';
import { RequestStatus } from '../../enums/CommonEnums';

describe('ContactRequest', () => {
  let contactRequest: ContactRequest;
  const defaultRequestId = 1;
  const defaultRequestData = {
    id: defaultRequestId,
    name: 'Max Mustermann',
    email: 'max@example.com',
    phone: '0123456789',
    service: 'Beratung',
    message: 'Ich hätte gerne Informationen zu Ihren Dienstleistungen.',
    status: RequestStatus.NEW,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };
  
  beforeEach(() => {
    contactRequest = new ContactRequest(defaultRequestData);
  });
  
  describe('constructor', () => {
    it('should initialize with default values', () => {
      const emptyRequest = new ContactRequest();
      
      expect(emptyRequest.name).toBe('');
      expect(emptyRequest.email).toBe('');
      expect(emptyRequest.service).toBe('');
      expect(emptyRequest.message).toBe('');
      expect(emptyRequest.status).toBe(RequestStatus.NEW);
      expect(emptyRequest.requestData).toEqual([]);
      expect(emptyRequest.metadata).toEqual({});
    });
    
    it('should initialize with provided values', () => {
      expect(contactRequest.id).toBe(defaultRequestId);
      expect(contactRequest.name).toBe('Max Mustermann');
      expect(contactRequest.email).toBe('max@example.com');
      expect(contactRequest.phone).toBe('0123456789');
      expect(contactRequest.service).toBe('Beratung');
      expect(contactRequest.message).toBe('Ich hätte gerne Informationen zu Ihren Dienstleistungen.');
      expect(contactRequest.status).toBe(RequestStatus.NEW);
    });
  });
  
  describe('status check methods', () => {
    it('isNew should return true for new requests', () => {
      contactRequest.status = RequestStatus.NEW;
      expect(contactRequest.isNew()).toBe(true);
    });
    
    it('isInProgress should return true for in-progress requests', () => {
      contactRequest.status = RequestStatus.IN_PROGRESS;
      expect(contactRequest.isInProgress()).toBe(true);
    });
    
    it('isCompleted should return true for completed requests', () => {
      contactRequest.status = RequestStatus.COMPLETED;
      expect(contactRequest.isCompleted()).toBe(true);
    });
    
    it('isCancelled should return true for cancelled requests', () => {
      contactRequest.status = RequestStatus.CANCELLED;
      expect(contactRequest.isCancelled()).toBe(true);
    });
  });
  
  describe('relation check methods', () => {
    it('isAssigned should return true when processorId is set', () => {
      contactRequest.processorId = undefined;
      expect(contactRequest.isAssigned()).toBe(false);
      
      contactRequest.processorId = 1;
      expect(contactRequest.isAssigned()).toBe(true);
    });
    
    it('isLinkedToCustomer should return true when customerId is set', () => {
      contactRequest.customerId = undefined;
      expect(contactRequest.isLinkedToCustomer()).toBe(false);
      
      contactRequest.customerId = 1;
      expect(contactRequest.isLinkedToCustomer()).toBe(true);
    });
    
    it('isLinkedToAppointment should return true when appointmentId is set', () => {
      contactRequest.appointmentId = undefined;
      expect(contactRequest.isLinkedToAppointment()).toBe(false);
      
      contactRequest.appointmentId = 1;
      expect(contactRequest.isLinkedToAppointment()).toBe(true);
    });
  });
  
  describe('AI related methods', () => {
    it('isAIProcessed should return true when AI has processed the request', () => {
      contactRequest.metadata = undefined;
      expect(contactRequest.isAIProcessed()).toBe(false);
      
      contactRequest.metadata = {};
      expect(contactRequest.isAIProcessed()).toBe(false);
      
      contactRequest.metadata = { aiProcessed: false };
      expect(contactRequest.isAIProcessed()).toBe(false);
      
      contactRequest.metadata = { aiProcessed: true };
      expect(contactRequest.isAIProcessed()).toBe(true);
    });
    
    it('getDataByCategory should filter requestData by category', () => {
      contactRequest.requestData = [
        { id: 1, requestId: 1, key: 'field1', value: 'value1', category: 'category1' } as any,
        { id: 2, requestId: 1, key: 'field2', value: 'value2', category: 'category1' } as any,
        { id: 3, requestId: 1, key: 'field3', value: 'value3', category: 'category2' } as any
      ];
      
      const category1Data = contactRequest.getDataByCategory('category1');
      expect(category1Data).toHaveLength(2);
      expect(category1Data[0].key).toBe('field1');
      expect(category1Data[1].key).toBe('field2');
      
      const category2Data = contactRequest.getDataByCategory('category2');
      expect(category2Data).toHaveLength(1);
      expect(category2Data[0].key).toBe('field3');
      
      const nonExistentCategory = contactRequest.getDataByCategory('category3');
      expect(nonExistentCategory).toHaveLength(0);
    });
    
    it('addMetadata should add key-value pairs to metadata', () => {
      contactRequest.metadata = {};
      
      contactRequest.addMetadata('key1', 'value1');
      expect(contactRequest.metadata.key1).toBe('value1');
      
      contactRequest.addMetadata('key2', { nestedKey: 'nestedValue' });
      expect(contactRequest.metadata.key2).toEqual({ nestedKey: 'nestedValue' });
      
      // Should overwrite existing keys
      contactRequest.addMetadata('key1', 'newValue');
      expect(contactRequest.metadata.key1).toBe('newValue');
    });
    
    it('addMetadata should create metadata object if not exists', () => {
      contactRequest.metadata = undefined;
      
      contactRequest.addMetadata('key1', 'value1');
      expect(contactRequest.metadata).toEqual({ key1: 'value1' });
    });
    
    it('addProcessingStep should add a processing step to metadata', () => {
      contactRequest.metadata = {};
      jest.useFakeTimers();
      const now = new Date();
      jest.setSystemTime(now);
      
      contactRequest.addProcessingStep('agent1', 'classify', 'success');
      
      expect(contactRequest.metadata.processingSteps).toHaveLength(1);
      expect(contactRequest.metadata.processingSteps[0]).toEqual({
        agentId: 'agent1',
        timestamp: now.toISOString(),
        action: 'classify',
        result: 'success'
      });
      
      // Add another step
      contactRequest.addProcessingStep('agent2', 'extract', 'partial');
      
      expect(contactRequest.metadata.processingSteps).toHaveLength(2);
      expect(contactRequest.metadata.processingSteps[1].agentId).toBe('agent2');
      
      jest.useRealTimers();
    });
    
    it('addProcessingStep should create metadata and processingSteps array if not exists', () => {
      contactRequest.metadata = undefined;
      
      contactRequest.addProcessingStep('agent1', 'classify', 'success');
      
      expect(contactRequest.metadata).toBeDefined();
      expect(contactRequest.metadata?.processingSteps).toBeInstanceOf(Array);
      expect(contactRequest.metadata?.processingSteps).toHaveLength(1);
    });
  });
  
  describe('status update methods', () => {
    it('updateStatus should update status and audit data', () => {
      const updatedBy = 2;
      jest.spyOn(contactRequest, 'updateAuditData');
      
      contactRequest.updateStatus(RequestStatus.IN_PROGRESS, updatedBy);
      
      expect(contactRequest.status).toBe(RequestStatus.IN_PROGRESS);
      expect(contactRequest.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
    
    it('markAsInProgress should set status to IN_PROGRESS and update processorId', () => {
      const processorId = 2;
      const updatedBy = 3;
      jest.spyOn(contactRequest, 'updateAuditData');
      
      contactRequest.markAsInProgress(processorId, updatedBy);
      
      expect(contactRequest.status).toBe(RequestStatus.IN_PROGRESS);
      expect(contactRequest.processorId).toBe(processorId);
      expect(contactRequest.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
    
    it('markAsCompleted should set status to COMPLETED', () => {
      const updatedBy = 2;
      jest.spyOn(contactRequest, 'updateAuditData');
      
      contactRequest.markAsCompleted(updatedBy);
      
      expect(contactRequest.status).toBe(RequestStatus.COMPLETED);
      expect(contactRequest.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
    
    it('markAsCancelled should set status to CANCELLED', () => {
      const updatedBy = 2;
      jest.spyOn(contactRequest, 'updateAuditData');
      
      contactRequest.markAsCancelled(updatedBy);
      
      expect(contactRequest.status).toBe(RequestStatus.CANCELLED);
      expect(contactRequest.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
  });
  
  describe('assignment and linking methods', () => {
    it('assignTo should update processorId and audit data', () => {
      const processorId = 2;
      const updatedBy = 3;
      jest.spyOn(contactRequest, 'updateAuditData');
      
      contactRequest.assignTo(processorId, updatedBy);
      
      expect(contactRequest.processorId).toBe(processorId);
      expect(contactRequest.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
    
    it('linkToCustomer should update customerId and audit data', () => {
      const customerId = 2;
      const updatedBy = 3;
      jest.spyOn(contactRequest, 'updateAuditData');
      
      contactRequest.linkToCustomer(customerId, updatedBy);
      
      expect(contactRequest.customerId).toBe(customerId);
      expect(contactRequest.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
    
    it('linkToAppointment should update appointmentId and audit data', () => {
      const appointmentId = 2;
      const updatedBy = 3;
      jest.spyOn(contactRequest, 'updateAuditData');
      
      contactRequest.linkToAppointment(appointmentId, updatedBy);
      
      expect(contactRequest.appointmentId).toBe(appointmentId);
      expect(contactRequest.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
  });
  
  describe('update', () => {
    it('should update only defined properties', () => {
      const updateData = {
        name: 'Erika Musterfrau',
        email: 'erika@example.com'
      };
      
      const originalPhone = contactRequest.phone;
      const originalService = contactRequest.service;
      
      jest.spyOn(contactRequest, 'updateAuditData');
      const updatedBy = 2;
      
      contactRequest.update(updateData, updatedBy);
      
      expect(contactRequest.name).toBe(updateData.name);
      expect(contactRequest.email).toBe(updateData.email);
      // Properties not in updateData should remain unchanged
      expect(contactRequest.phone).toBe(originalPhone);
      expect(contactRequest.service).toBe(originalService);
      expect(contactRequest.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
    
    it('should return the contact request instance for chaining', () => {
      const result = contactRequest.update({ name: 'New Name' });
      expect(result).toBe(contactRequest);
    });
  });
  
  describe('email validation', () => {
    it('should validate correct email formats', () => {
      contactRequest.email = 'test@example.com';
      expect(contactRequest.isValidEmail()).toBe(true);
      
      contactRequest.email = 'user.name+tag@example.co.uk';
      expect(contactRequest.isValidEmail()).toBe(true);
    });
    
    it('should reject invalid email formats', () => {
      contactRequest.email = 'not-an-email';
      expect(contactRequest.isValidEmail()).toBe(false);
      
      contactRequest.email = 'missing@domain';
      expect(contactRequest.isValidEmail()).toBe(false);
      
      contactRequest.email = '@missing-username.com';
      expect(contactRequest.isValidEmail()).toBe(false);
    });
  });
  
  describe('toObject', () => {
    it('should convert to plain object with all properties except requestData', () => {
      contactRequest.metadata = { processed: true };
      contactRequest.requestData = [{ id: 1, requestId: 1, key: 'field1', value: 'value1', category: 'category1' } as any];
      
      const obj = contactRequest.toObject();
      
      // Base properties
      expect(obj).toHaveProperty('id', contactRequest.id);
      expect(obj).toHaveProperty('createdAt', contactRequest.createdAt);
      expect(obj).toHaveProperty('updatedAt', contactRequest.updatedAt);
      
      // ContactRequest specific properties
      expect(obj).toHaveProperty('name', contactRequest.name);
      expect(obj).toHaveProperty('email', contactRequest.email);
      expect(obj).toHaveProperty('phone', contactRequest.phone);
      expect(obj).toHaveProperty('service', contactRequest.service);
      expect(obj).toHaveProperty('message', contactRequest.message);
      expect(obj).toHaveProperty('status', contactRequest.status);
      expect(obj).toHaveProperty('metadata', contactRequest.metadata);
      
      // requestData should be omitted
      expect(obj).not.toHaveProperty('requestData');
    });
  });
});
