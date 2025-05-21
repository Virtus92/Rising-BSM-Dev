import { ActivityLog } from '../ActivityLog';
import { EntityType } from '../../enums/EntityTypes';

describe('ActivityLog', () => {
  let activityLog: ActivityLog;
  const defaultId = 1;
  const defaultActivityLogValues = {
    id: defaultId,
    entityType: EntityType.USER,
    entityId: 123,
    userId: 456,
    action: 'login',
    details: { ipAddress: '192.168.1.1', browser: 'Chrome' },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };
  
  beforeEach(() => {
    activityLog = new ActivityLog(defaultActivityLogValues);
  });
  
  describe('constructor', () => {
    it('should initialize with default values', () => {
      const emptyLog = new ActivityLog();
      
      expect(emptyLog.entityType).toBe(EntityType.USER);
      expect(emptyLog.entityId).toBe(0);
      expect(emptyLog.userId).toBeUndefined();
      expect(emptyLog.action).toBe('');
      expect(emptyLog.details).toEqual({});
    });
    
    it('should initialize with provided values', () => {
      expect(activityLog.id).toBe(defaultId);
      expect(activityLog.entityType).toBe(EntityType.USER);
      expect(activityLog.entityId).toBe(123);
      expect(activityLog.userId).toBe(456);
      expect(activityLog.action).toBe('login');
      expect(activityLog.details).toEqual({ ipAddress: '192.168.1.1', browser: 'Chrome' });
    });
  });
  
  describe('addDetail method', () => {
    it('should add a detail to existing details', () => {
      activityLog.addDetail('logoutTime', '2023-01-01T12:00:00Z');
      
      expect(activityLog.details).toEqual({
        ipAddress: '192.168.1.1', 
        browser: 'Chrome',
        logoutTime: '2023-01-01T12:00:00Z'
      });
    });
    
    it('should initialize details object if none exists', () => {
      activityLog.details = undefined;
      
      activityLog.addDetail('status', 'success');
      
      expect(activityLog.details).toEqual({ status: 'success' });
    });
    
    it('should override existing detail with same key', () => {
      activityLog.addDetail('browser', 'Firefox');
      
      expect(activityLog.details?.browser).toBe('Firefox');
    });
    
    it('should return the instance for chaining', () => {
      const result = activityLog.addDetail('key', 'value');
      expect(result).toBe(activityLog);
    });
  });
  
  describe('toObject method', () => {
    it('should convert to plain object with all properties', () => {
      const obj = activityLog.toObject();
      
      // Base properties
      expect(obj).toHaveProperty('id', activityLog.id);
      expect(obj).toHaveProperty('createdAt', activityLog.createdAt);
      expect(obj).toHaveProperty('updatedAt', activityLog.updatedAt);
      
      // ActivityLog specific properties
      expect(obj).toHaveProperty('entityType', activityLog.entityType);
      expect(obj).toHaveProperty('entityId', activityLog.entityId);
      expect(obj).toHaveProperty('userId', activityLog.userId);
      expect(obj).toHaveProperty('action', activityLog.action);
      expect(obj).toHaveProperty('details', activityLog.details);
    });
  });
  
  describe('static factory methods', () => {
    it('createUserLog should create a log with USER entity type', () => {
      const userId = 123;
      const action = 'profile_updated';
      const details = { field: 'email', oldValue: 'old@example.com', newValue: 'new@example.com' };
      const actorId = 456;
      
      const log = ActivityLog.createUserLog(userId, action, details, actorId);
      
      expect(log).toBeInstanceOf(ActivityLog);
      expect(log.entityType).toBe(EntityType.USER);
      expect(log.entityId).toBe(userId);
      expect(log.userId).toBe(actorId);
      expect(log.action).toBe(action);
      expect(log.details).toEqual(details);
    });
    
    it('createCustomerLog should create a log with CUSTOMER entity type', () => {
      const customerId = 123;
      const action = 'customer_created';
      const details = { email: 'customer@example.com' };
      const userId = 456;
      
      const log = ActivityLog.createCustomerLog(customerId, action, details, userId);
      
      expect(log).toBeInstanceOf(ActivityLog);
      expect(log.entityType).toBe(EntityType.CUSTOMER);
      expect(log.entityId).toBe(customerId);
      expect(log.userId).toBe(userId);
      expect(log.action).toBe(action);
      expect(log.details).toEqual(details);
    });
    
    it('createAppointmentLog should create a log with APPOINTMENT entity type', () => {
      const appointmentId = 123;
      const action = 'appointment_rescheduled';
      const details = { oldDate: '2023-01-01', newDate: '2023-01-15' };
      const userId = 456;
      
      const log = ActivityLog.createAppointmentLog(appointmentId, action, details, userId);
      
      expect(log).toBeInstanceOf(ActivityLog);
      expect(log.entityType).toBe(EntityType.APPOINTMENT);
      expect(log.entityId).toBe(appointmentId);
      expect(log.userId).toBe(userId);
      expect(log.action).toBe(action);
      expect(log.details).toEqual(details);
    });
    
    it('createRequestLog should create a log with CONTACT_REQUEST entity type', () => {
      const requestId = 123;
      const action = 'request_status_changed';
      const details = { oldStatus: 'new', newStatus: 'in_progress' };
      const userId = 456;
      
      const log = ActivityLog.createRequestLog(requestId, action, details, userId);
      
      expect(log).toBeInstanceOf(ActivityLog);
      expect(log.entityType).toBe(EntityType.CONTACT_REQUEST);
      expect(log.entityId).toBe(requestId);
      expect(log.userId).toBe(userId);
      expect(log.action).toBe(action);
      expect(log.details).toEqual(details);
    });
    
    it('factory methods should handle undefined details and userId', () => {
      const id = 123;
      const action = 'viewed';
      
      const userLog = ActivityLog.createUserLog(id, action);
      expect(userLog.details).toEqual({});
      expect(userLog.userId).toBeUndefined();
      
      const customerLog = ActivityLog.createCustomerLog(id, action);
      expect(customerLog.details).toEqual({});
      expect(customerLog.userId).toBeUndefined();
      
      const appointmentLog = ActivityLog.createAppointmentLog(id, action);
      expect(appointmentLog.details).toEqual({});
      expect(appointmentLog.userId).toBeUndefined();
      
      const requestLog = ActivityLog.createRequestLog(id, action);
      expect(requestLog.details).toEqual({});
      expect(requestLog.userId).toBeUndefined();
    });
  });
});