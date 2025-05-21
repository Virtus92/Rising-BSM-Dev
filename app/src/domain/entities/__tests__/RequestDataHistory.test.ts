import { RequestDataHistory } from '../RequestDataHistory';

describe('RequestDataHistory', () => {
  let requestDataHistory: RequestDataHistory;
  const defaultId = 1;
  const defaultRequestDataHistoryValues = {
    id: defaultId,
    requestDataId: 123,
    data: { name: 'Jane Doe', email: 'jane@example.com' },
    changedBy: 'user-123',
    changeReason: 'Data updated via form',
    version: 2,
    userId: 456,
    createdAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T10:00:00Z')
  };
  
  beforeEach(() => {
    requestDataHistory = new RequestDataHistory(defaultRequestDataHistoryValues);
  });
  
  describe('constructor', () => {
    it('should initialize with default values', () => {
      const emptyHistory = new RequestDataHistory();
      
      expect(emptyHistory.requestDataId).toBe(0);
      expect(emptyHistory.data).toEqual({});
      expect(emptyHistory.changedBy).toBeUndefined();
      expect(emptyHistory.changeReason).toBeUndefined();
      expect(emptyHistory.version).toBe(1);
      expect(emptyHistory.userId).toBeUndefined();
    });
    
    it('should initialize with provided values', () => {
      expect(requestDataHistory.id).toBe(defaultId);
      expect(requestDataHistory.requestDataId).toBe(123);
      expect(requestDataHistory.data).toEqual({ name: 'Jane Doe', email: 'jane@example.com' });
      expect(requestDataHistory.changedBy).toBe('user-123');
      expect(requestDataHistory.changeReason).toBe('Data updated via form');
      expect(requestDataHistory.version).toBe(2);
      expect(requestDataHistory.userId).toBe(456);
    });
    
    it('should copy createdAt to updatedAt when createdAt exists', () => {
      const specificDate = new Date('2023-02-15T15:30:00Z');
      const history = new RequestDataHistory({ 
        createdAt: specificDate,
        updatedAt: undefined // explicitly undefined
      });
      
      expect(history.updatedAt).toEqual(specificDate);
    });
  });
  
  describe('toObject method', () => {
    it('should convert to plain object with all properties', () => {
      const obj = requestDataHistory.toObject();
      
      // Base properties
      expect(obj).toHaveProperty('id', requestDataHistory.id);
      expect(obj).toHaveProperty('createdAt', requestDataHistory.createdAt);
      expect(obj).toHaveProperty('updatedAt', requestDataHistory.updatedAt);
      
      // RequestDataHistory specific properties
      expect(obj).toHaveProperty('requestDataId', requestDataHistory.requestDataId);
      expect(obj).toHaveProperty('data', requestDataHistory.data);
      expect(obj).toHaveProperty('changedBy', requestDataHistory.changedBy);
      expect(obj).toHaveProperty('changeReason', requestDataHistory.changeReason);
      expect(obj).toHaveProperty('version', requestDataHistory.version);
      expect(obj).toHaveProperty('userId', requestDataHistory.userId);
    });
  });
});