import { User, UserRole, UserStatus } from '../User';

describe('User', () => {
  let user: User;
  const defaultUserId = 1;
  const defaultUserData = {
    id: defaultUserId,
    name: 'John Doe',
    email: 'john@example.com',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };
  
  beforeEach(() => {
    user = new User(defaultUserData);
  });
  
  describe('constructor', () => {
    it('should initialize with default values', () => {
      const emptyUser = new User();
      
      expect(emptyUser.name).toBe('');
      expect(emptyUser.email).toBe('');
      expect(emptyUser.role).toBe(UserRole.USER);
      expect(emptyUser.status).toBe(UserStatus.ACTIVE);
      expect(emptyUser.permissions).toEqual([]);
    });
    
    it('should initialize with provided values', () => {
      expect(user.id).toBe(defaultUserId);
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.role).toBe(UserRole.USER);
      expect(user.status).toBe(UserStatus.ACTIVE);
    });
    
    it('should convert date strings to Date objects', () => {
      const dateString = '2023-06-15T10:00:00.000Z';
      const user = new User({
        lastLoginAt: dateString as any,
        resetTokenExpiry: dateString as any
      });
      
      expect(user.lastLoginAt).toBeInstanceOf(Date);
      expect(user.resetTokenExpiry).toBeInstanceOf(Date);
    });
    
    it('should validate and default invalid roles', () => {
      const userWithInvalidRole = new User({
        role: 'invalid-role' as any
      });
      
      expect(userWithInvalidRole.role).toBe(UserRole.USER);
    });
    
    it('should validate and default invalid statuses', () => {
      const userWithInvalidStatus = new User({
        status: 'invalid-status' as any
      });
      
      expect(userWithInvalidStatus.status).toBe(UserStatus.ACTIVE);
    });
  });
  
  describe('firstName and lastName getters', () => {
    it('should return the first name correctly', () => {
      expect(user.firstName).toBe('John');
    });
    
    it('should return the last name correctly', () => {
      expect(user.lastName).toBe('Doe');
    });
    
    it('should handle single name correctly', () => {
      user.name = 'John';
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('');
    });
    
    it('should handle multiple last names correctly', () => {
      user.name = 'John Doe Smith';
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe Smith');
    });
  });
  
  describe('getFullName', () => {
    it('should return the full name', () => {
      expect(user.getFullName()).toBe('John Doe');
    });
    
    it('should trim whitespace', () => {
      user.name = '  John Doe  ';
      expect(user.getFullName()).toBe('John Doe');
    });
  });
  
  describe('status related methods', () => {
    it('isActive should return true for active users', () => {
      user.status = UserStatus.ACTIVE;
      expect(user.isActive()).toBe(true);
    });
    
    it('isActive should return false for inactive users', () => {
      user.status = UserStatus.INACTIVE;
      expect(user.isActive()).toBe(false);
    });
    
    it('updateStatus should update the status and audit data', () => {
      const updatedBy = 2;
      jest.spyOn(user, 'updateAuditData');
      
      user.updateStatus(UserStatus.INACTIVE, updatedBy);
      
      expect(user.status).toBe(UserStatus.INACTIVE);
      expect(user.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
    
    it('deactivate should set status to INACTIVE', () => {
      const updatedBy = 2;
      jest.spyOn(user, 'updateStatus');
      
      user.deactivate(updatedBy);
      
      expect(user.updateStatus).toHaveBeenCalledWith(UserStatus.INACTIVE, updatedBy);
    });
    
    it('activate should set status to ACTIVE', () => {
      const updatedBy = 2;
      jest.spyOn(user, 'updateStatus');
      
      user.activate(updatedBy);
      
      expect(user.updateStatus).toHaveBeenCalledWith(UserStatus.ACTIVE, updatedBy);
    });
    
    it('softDelete should set status to DELETED', () => {
      const updatedBy = 2;
      jest.spyOn(user, 'updateStatus');
      
      user.softDelete(updatedBy);
      
      expect(user.updateStatus).toHaveBeenCalledWith(UserStatus.DELETED, updatedBy);
    });
  });
  
  describe('role related methods', () => {
    it('isAdmin should return true for admin users', () => {
      user.role = UserRole.ADMIN;
      expect(user.isAdmin()).toBe(true);
    });
    
    it('isAdmin should return false for non-admin users', () => {
      user.role = UserRole.USER;
      expect(user.isAdmin()).toBe(false);
    });
    
    it('isManagerOrAbove should return true for admin and manager users', () => {
      user.role = UserRole.ADMIN;
      expect(user.isManagerOrAbove()).toBe(true);
      
      user.role = UserRole.MANAGER;
      expect(user.isManagerOrAbove()).toBe(true);
    });
    
    it('isManagerOrAbove should return false for regular users', () => {
      user.role = UserRole.USER;
      expect(user.isManagerOrAbove()).toBe(false);
      
      user.role = UserRole.EMPLOYEE;
      expect(user.isManagerOrAbove()).toBe(false);
    });
    
    it('hasRole should return true when user has the specified role', () => {
      user.role = UserRole.MANAGER;
      expect(user.hasRole(UserRole.MANAGER)).toBe(true);
    });
    
    it('hasRole should return false when user does not have the specified role', () => {
      user.role = UserRole.USER;
      expect(user.hasRole(UserRole.MANAGER)).toBe(false);
    });
  });
  
  describe('recordLogin', () => {
    it('should update lastLoginAt to current time', () => {
      jest.useFakeTimers();
      const now = new Date();
      jest.setSystemTime(now);
      
      user.recordLogin();
      
      expect(user.lastLoginAt).toEqual(now);
      
      jest.useRealTimers();
    });
    
    it('should return the user instance for chaining', () => {
      const result = user.recordLogin();
      expect(result).toBe(user);
    });
  });
  
  describe('password management', () => {
    it('changePassword should update password and clear reset tokens', () => {
      user.resetToken = 'abc123';
      user.resetTokenExpiry = new Date();
      jest.spyOn(user, 'updateAuditData');
      
      const newPassword = 'newHashedPassword';
      user.changePassword(newPassword);
      
      expect(user.password).toBe(newPassword);
      expect(user.resetToken).toBeUndefined();
      expect(user.resetTokenExpiry).toBeUndefined();
      expect(user.updateAuditData).toHaveBeenCalled();
    });
    
    it('setResetToken should set token and expiry time', () => {
      jest.useFakeTimers();
      const now = new Date('2023-01-01T12:00:00Z');
      jest.setSystemTime(now);
      
      const token = 'reset-token-123';
      user.setResetToken(token, 24);
      
      expect(user.resetToken).toBe(token);
      
      // Expiry should be 24 hours from now
      const expectedExpiry = new Date(now);
      expectedExpiry.setHours(expectedExpiry.getHours() + 24);
      expect(user.resetTokenExpiry).toEqual(expectedExpiry);
      
      jest.useRealTimers();
    });
    
    it('isResetTokenValid should return false if no token exists', () => {
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      
      expect(user.isResetTokenValid('any-token')).toBe(false);
    });
    
    it('isResetTokenValid should return false if tokens do not match', () => {
      user.resetToken = 'actual-token';
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      user.resetTokenExpiry = futureDate;
      
      expect(user.isResetTokenValid('wrong-token')).toBe(false);
    });
    
    it('isResetTokenValid should return false if token has expired', () => {
      user.resetToken = 'valid-token';
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      user.resetTokenExpiry = pastDate;
      
      expect(user.isResetTokenValid('valid-token')).toBe(false);
    });
    
    it('isResetTokenValid should return true for valid non-expired tokens', () => {
      user.resetToken = 'valid-token';
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      user.resetTokenExpiry = futureDate;
      
      expect(user.isResetTokenValid('valid-token')).toBe(true);
    });
  });
  
  describe('email validation', () => {
    it('should validate correct email formats', () => {
      user.email = 'test@example.com';
      expect(user.isValidEmail()).toBe(true);
      
      user.email = 'user.name+tag@example.co.uk';
      expect(user.isValidEmail()).toBe(true);
    });
    
    it('should reject invalid email formats', () => {
      user.email = 'not-an-email';
      expect(user.isValidEmail()).toBe(false);
      
      user.email = 'missing@domain';
      expect(user.isValidEmail()).toBe(false);
      
      user.email = '@missing-username.com';
      expect(user.isValidEmail()).toBe(false);
    });
  });
  
  describe('update', () => {
    it('should update only defined properties', () => {
      const updateData = {
        name: 'New Name',
        email: 'new@example.com'
      };
      
      const originalRole = user.role;
      const originalStatus = user.status;
      
      jest.spyOn(user, 'updateAuditData');
      const updatedBy = 2;
      
      user.update(updateData, updatedBy);
      
      expect(user.name).toBe(updateData.name);
      expect(user.email).toBe(updateData.email);
      // Properties not in updateData should remain unchanged
      expect(user.role).toBe(originalRole);
      expect(user.status).toBe(originalStatus);
      expect(user.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
    
    it('should return the user instance for chaining', () => {
      const result = user.update({ name: 'New Name' });
      expect(result).toBe(user);
    });
  });
  
  describe('toObject', () => {
    it('should convert to plain object without sensitive data', () => {
      user.password = 'hashed-password';
      user.resetToken = 'reset-token';
      user.resetTokenExpiry = new Date();
      
      const obj = user.toObject();
      
      // Sensitive fields should be excluded
      expect(obj).not.toHaveProperty('password');
      expect(obj).not.toHaveProperty('resetToken');
      expect(obj).not.toHaveProperty('resetTokenExpiry');
      
      // Regular fields should be included
      expect(obj).toHaveProperty('id', user.id);
      expect(obj).toHaveProperty('name', user.name);
      expect(obj).toHaveProperty('email', user.email);
      expect(obj).toHaveProperty('role', user.role);
      expect(obj).toHaveProperty('status', user.status);
    });
  });
});
