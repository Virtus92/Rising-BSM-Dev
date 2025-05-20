import { Notification } from '../Notification';
import { NotificationType } from '../../enums/CommonEnums';

describe('Notification', () => {
  let notification: Notification;
  const defaultNotificationId = 1;
  const defaultNotificationData = {
    id: defaultNotificationId,
    userId: 2,
    type: NotificationType.INFO,
    title: 'Wichtige Information',
    message: 'Dies ist eine wichtige Mitteilung.',
    isRead: false,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };
  
  beforeEach(() => {
    notification = new Notification(defaultNotificationData);
  });
  
  describe('constructor', () => {
    it('should initialize with default values', () => {
      const emptyNotification = new Notification();
      
      expect(emptyNotification.type).toBe(NotificationType.INFO);
      expect(emptyNotification.title).toBe('');
      expect(emptyNotification.isRead).toBe(false);
    });
    
    it('should initialize with provided values', () => {
      expect(notification.id).toBe(defaultNotificationId);
      expect(notification.userId).toBe(2);
      expect(notification.type).toBe(NotificationType.INFO);
      expect(notification.title).toBe('Wichtige Information');
      expect(notification.message).toBe('Dies ist eine wichtige Mitteilung.');
      expect(notification.isRead).toBe(false);
    });
    
    it('should handle optional reference IDs', () => {
      const notificationWithRefs = new Notification({
        ...defaultNotificationData,
        customerId: 3,
        appointmentId: 4,
        contactRequestId: 5,
        link: '/dashboard/customers/3'
      });
      
      expect(notificationWithRefs.customerId).toBe(3);
      expect(notificationWithRefs.appointmentId).toBe(4);
      expect(notificationWithRefs.contactRequestId).toBe(5);
      expect(notificationWithRefs.link).toBe('/dashboard/customers/3');
    });
  });
  
  describe('markAsRead', () => {
    it('should mark notification as read and update audit data', () => {
      const updatedBy = 2;
      jest.spyOn(notification, 'updateAuditData');
      
      notification.markAsRead(updatedBy);
      
      expect(notification.isRead).toBe(true);
      expect(notification.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
    
    it('should return the notification instance for chaining', () => {
      const result = notification.markAsRead();
      expect(result).toBe(notification);
    });
  });
  
  describe('markAsUnread', () => {
    it('should mark notification as unread and update audit data', () => {
      notification.isRead = true;
      
      const updatedBy = 2;
      jest.spyOn(notification, 'updateAuditData');
      
      notification.markAsUnread(updatedBy);
      
      expect(notification.isRead).toBe(false);
      expect(notification.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
    
    it('should return the notification instance for chaining', () => {
      const result = notification.markAsUnread();
      expect(result).toBe(notification);
    });
  });
  
  describe('update', () => {
    it('should update only defined properties', () => {
      const updateData = {
        title: 'Neuer Titel',
        message: 'Neue Nachricht'
      };
      
      const originalType = notification.type;
      const originalIsRead = notification.isRead;
      
      jest.spyOn(notification, 'updateAuditData');
      const updatedBy = 2;
      
      notification.update(updateData, updatedBy);
      
      expect(notification.title).toBe(updateData.title);
      expect(notification.message).toBe(updateData.message);
      // Properties not in updateData should remain unchanged
      expect(notification.type).toBe(originalType);
      expect(notification.isRead).toBe(originalIsRead);
      expect(notification.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
    
    it('should update isRead if provided', () => {
      notification.isRead = false;
      
      notification.update({ isRead: true });
      
      expect(notification.isRead).toBe(true);
    });
    
    it('should update type if provided', () => {
      notification.type = NotificationType.INFO;
      
      notification.update({ type: NotificationType.WARNING });
      
      expect(notification.type).toBe(NotificationType.WARNING);
    });
    
    it('should return the notification instance for chaining', () => {
      const result = notification.update({ title: 'New Title' });
      expect(result).toBe(notification);
    });
  });
  
  describe('toObject', () => {
    it('should convert to plain object with all properties', () => {
      const obj = notification.toObject();
      
      // Base properties
      expect(obj).toHaveProperty('id', notification.id);
      expect(obj).toHaveProperty('createdAt', notification.createdAt);
      expect(obj).toHaveProperty('updatedAt', notification.updatedAt);
      
      // Notification specific properties
      expect(obj).toHaveProperty('userId', notification.userId);
      expect(obj).toHaveProperty('type', notification.type);
      expect(obj).toHaveProperty('title', notification.title);
      expect(obj).toHaveProperty('message', notification.message);
      expect(obj).toHaveProperty('isRead', notification.isRead);
    });
    
    it('should include reference IDs if they exist', () => {
      notification.customerId = 3;
      notification.appointmentId = 4;
      notification.contactRequestId = 5;
      notification.link = '/dashboard/customers/3';
      
      const obj = notification.toObject();
      
      expect(obj).toHaveProperty('customerId', 3);
      expect(obj).toHaveProperty('appointmentId', 4);
      expect(obj).toHaveProperty('contactRequestId', 5);
      expect(obj).toHaveProperty('link', '/dashboard/customers/3');
    });
  });
});
