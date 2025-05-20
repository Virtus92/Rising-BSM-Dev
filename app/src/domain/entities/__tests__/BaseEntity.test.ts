import { BaseEntity } from '../BaseEntity';

// Konkrete Implementierung der abstrakten BaseEntity-Klasse für Testzwecke
class TestEntity extends BaseEntity {
  name: string;
  
  constructor(data: Partial<TestEntity> = {}) {
    super(data);
    this.name = data.name || 'Test';
  }
  
  override toObject(): Record<string, any> {
    return {
      ...super.toObject(),
      name: this.name
    };
  }
}

describe('BaseEntity', () => {
  let entity: TestEntity;
  const now = new Date();
  const userId = 999;
  
  beforeEach(() => {
    // Mock für Date.now(), damit die Tests deterministisch sind
    jest.useFakeTimers();
    jest.setSystemTime(now);
    
    entity = new TestEntity();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(entity.id).toBe(0);
      expect(entity.createdAt).toEqual(now);
      expect(entity.updatedAt).toEqual(now);
      expect(entity.createdBy).toBeUndefined();
      expect(entity.updatedBy).toBeUndefined();
      expect(entity.name).toBe('Test');
    });
    
    it('should initialize with provided values', () => {
      const customDate = new Date(2023, 1, 1);
      const customEntity = new TestEntity({
        id: 123,
        createdAt: customDate,
        updatedAt: customDate,
        createdBy: 456,
        updatedBy: 789,
        name: 'Custom'
      });
      
      expect(customEntity.id).toBe(123);
      expect(customEntity.createdAt).toEqual(customDate);
      expect(customEntity.updatedAt).toEqual(customDate);
      expect(customEntity.createdBy).toBe(456);
      expect(customEntity.updatedBy).toBe(789);
      expect(customEntity.name).toBe('Custom');
    });

    it('should convert string dates to Date objects', () => {
      const dateString = '2023-01-01T00:00:00.000Z';
      const customEntity = new TestEntity({
        createdAt: dateString as any,
        updatedAt: dateString as any,
      });
      
      expect(customEntity.createdAt).toBeInstanceOf(Date);
      expect(customEntity.updatedAt).toBeInstanceOf(Date);
      expect(customEntity.createdAt.toISOString()).toBe(dateString);
      expect(customEntity.updatedAt.toISOString()).toBe(dateString);
    });
  });
  
  describe('isNew', () => {
    it('should return true when id is 0', () => {
      entity.id = 0;
      expect(entity.isNew()).toBe(true);
    });
    
    it('should return true when id is not set', () => {
      entity.id = undefined as any;
      expect(entity.isNew()).toBe(true);
    });
    
    it('should return false when id is greater than 0', () => {
      entity.id = 1;
      expect(entity.isNew()).toBe(false);
    });
  });
  
  describe('updateAuditData', () => {
    it('should update updatedAt to current time', () => {
      const newTime = new Date(now.getTime() + 60000); // 1 Minute später
      jest.setSystemTime(newTime);
      
      entity.updateAuditData();
      
      expect(entity.updatedAt).toEqual(newTime);
      expect(entity.updatedBy).toBeUndefined();
    });
    
    it('should update updatedAt and updatedBy', () => {
      const newTime = new Date(now.getTime() + 60000); // 1 Minute später
      jest.setSystemTime(newTime);
      
      entity.updateAuditData(userId);
      
      expect(entity.updatedAt).toEqual(newTime);
      expect(entity.updatedBy).toBe(userId);
    });
  });
  
  describe('markAsCreated', () => {
    it('should set createdAt and updatedAt to current time', () => {
      const oldTime = new Date(2020, 1, 1);
      entity.createdAt = oldTime;
      entity.updatedAt = oldTime;
      
      entity.markAsCreated();
      
      expect(entity.createdAt).toEqual(now);
      expect(entity.updatedAt).toEqual(now);
      expect(entity.createdBy).toBeUndefined();
      expect(entity.updatedBy).toBeUndefined();
    });
    
    it('should set createdAt, updatedAt, createdBy, and updatedBy', () => {
      const oldTime = new Date(2020, 1, 1);
      entity.createdAt = oldTime;
      entity.updatedAt = oldTime;
      
      entity.markAsCreated(userId);
      
      expect(entity.createdAt).toEqual(now);
      expect(entity.updatedAt).toEqual(now);
      expect(entity.createdBy).toBe(userId);
      expect(entity.updatedBy).toBe(userId);
    });
  });
  
  describe('toObject', () => {
    it('should return object with base properties', () => {
      const obj = entity.toObject();
      
      expect(obj).toEqual({
        id: 0,
        name: "Test",
        createdAt: now,
        updatedAt: now,
        createdBy: undefined,
        updatedBy: undefined
      });
    });
    
    it('should return object with extended properties in subclass', () => {
      const extendedObj = entity.toObject();
      
      expect(extendedObj).toHaveProperty('name', 'Test');
    });
  });
});
