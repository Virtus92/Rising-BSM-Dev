import { RequestData, RequestDataType } from '../RequestData';

describe('RequestData', () => {
  let requestData: RequestData;
  const defaultRequestId = 1;
  const defaultRequestDataValues = {
    id: defaultRequestId,
    requestId: 123,
    category: 'customer-info',
    label: 'Customer Information',
    order: 1,
    dataType: 'json' as RequestDataType,
    data: { name: 'John Doe', email: 'john@example.com' },
    isValid: true,
    processedBy: 'ai-agent-1',
    version: 1,
    createdById: 456,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };
  
  beforeEach(() => {
    requestData = new RequestData(defaultRequestDataValues);
  });
  
  describe('constructor', () => {
    it('should initialize with default values', () => {
      const emptyRequestData = new RequestData();
      
      expect(emptyRequestData.requestId).toBe(0);
      expect(emptyRequestData.category).toBe('');
      expect(emptyRequestData.label).toBe('');
      expect(emptyRequestData.order).toBe(0);
      expect(emptyRequestData.dataType).toBe('json');
      expect(emptyRequestData.data).toEqual({});
      expect(emptyRequestData.isValid).toBe(true);
      expect(emptyRequestData.version).toBe(1);
    });
    
    it('should initialize with provided values', () => {
      expect(requestData.id).toBe(defaultRequestId);
      expect(requestData.requestId).toBe(123);
      expect(requestData.category).toBe('customer-info');
      expect(requestData.label).toBe('Customer Information');
      expect(requestData.order).toBe(1);
      expect(requestData.dataType).toBe('json');
      expect(requestData.data).toEqual({ name: 'John Doe', email: 'john@example.com' });
      expect(requestData.isValid).toBe(true);
      expect(requestData.processedBy).toBe('ai-agent-1');
      expect(requestData.version).toBe(1);
      expect(requestData.createdById).toBe(456);
    });
  });
  
  describe('validate method', () => {
    it('should return true for valid data', () => {
      expect(requestData.validate()).toBe(true);
    });
    
    it('should return false when requestId is invalid', () => {
      requestData.requestId = 0;
      expect(requestData.validate()).toBe(false);
      
      requestData.requestId = -1;
      expect(requestData.validate()).toBe(false);
    });
    
    it('should return false when category is empty', () => {
      requestData.category = '';
      expect(requestData.validate()).toBe(false);
      
      requestData.category = '   ';
      expect(requestData.validate()).toBe(false);
    });
    
    it('should return false when data is null or undefined', () => {
      requestData.data = null as any;
      expect(requestData.validate()).toBe(false);
      
      requestData.data = undefined as any;
      expect(requestData.validate()).toBe(false);
    });
    
    it('should validate JSON data correctly', () => {
      requestData.dataType = 'json';
      requestData.data = { test: 'value' };
      expect(requestData.validate()).toBe(true);
      
      requestData.data = 'not an object';
      expect(requestData.validate()).toBe(false);
    });
    
    it('should validate conversation data correctly', () => {
      requestData.dataType = 'conversation';
      requestData.data = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'How can I help you?' }
      ];
      expect(requestData.validate()).toBe(true);
      
      // Invalid conversation format (missing role)
      requestData.data = [
        { content: 'Hello' },
        { role: 'assistant', content: 'How can I help you?' }
      ];
      expect(requestData.validate()).toBe(false);
      
      // Invalid conversation format (missing content)
      requestData.data = [
        { role: 'user' },
        { role: 'assistant', content: 'How can I help you?' }
      ];
      expect(requestData.validate()).toBe(false);
      
      // Not an array
      requestData.data = { role: 'user', content: 'Hello' };
      expect(requestData.validate()).toBe(false);
    });
    
    it('should accept other data types without specific validation', () => {
      // Text type
      requestData.dataType = 'text';
      requestData.data = 'This is some text';
      expect(requestData.validate()).toBe(true);
      
      // HTML type
      requestData.dataType = 'html';
      requestData.data = '<p>This is HTML</p>';
      expect(requestData.validate()).toBe(true);
      
      // Markdown type
      requestData.dataType = 'markdown';
      requestData.data = '# Heading\nThis is a paragraph';
      expect(requestData.validate()).toBe(true);
      
      // File type
      requestData.dataType = 'file';
      requestData.data = { path: '/uploads/file.pdf', size: 1024 };
      expect(requestData.validate()).toBe(true);
    });
  });
  
  describe('incrementVersion method', () => {
    it('should increment the version number', () => {
      const initialVersion = requestData.version;
      
      requestData.incrementVersion();
      expect(requestData.version).toBe(initialVersion + 1);
      
      requestData.incrementVersion();
      expect(requestData.version).toBe(initialVersion + 2);
    });
    
    it('should return the instance for chaining', () => {
      const result = requestData.incrementVersion();
      expect(result).toBe(requestData);
    });
  });
  
  describe('toObject method', () => {
    it('should convert to plain object with all properties except history', () => {
      const obj = requestData.toObject();
      
      // Base properties
      expect(obj).toHaveProperty('id', requestData.id);
      expect(obj).toHaveProperty('createdAt', requestData.createdAt);
      expect(obj).toHaveProperty('updatedAt', requestData.updatedAt);
      
      // RequestData specific properties
      expect(obj).toHaveProperty('requestId', requestData.requestId);
      expect(obj).toHaveProperty('category', requestData.category);
      expect(obj).toHaveProperty('label', requestData.label);
      expect(obj).toHaveProperty('order', requestData.order);
      expect(obj).toHaveProperty('dataType', requestData.dataType);
      expect(obj).toHaveProperty('data', requestData.data);
      expect(obj).toHaveProperty('isValid', requestData.isValid);
      expect(obj).toHaveProperty('processedBy', requestData.processedBy);
      expect(obj).toHaveProperty('version', requestData.version);
      expect(obj).toHaveProperty('createdById', requestData.createdById);
      
      // history should be omitted
      expect(obj).not.toHaveProperty('history');
    });
  });
});