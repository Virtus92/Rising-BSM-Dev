import { Permission, UserPermission } from '../Permission';

describe('Permission', () => {
  let permission: Permission;
  const defaultPermissionId = 1;
  const defaultPermissionData = {
    id: defaultPermissionId,
    code: 'users.view',
    name: 'View Users',
    description: 'Allows viewing the list of users',
    category: 'Users',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };
  
  beforeEach(() => {
    permission = new Permission(defaultPermissionData);
  });
  
  describe('constructor', () => {
    it('should initialize with default values', () => {
      const emptyPermission = new Permission();
      
      expect(emptyPermission.code).toBe('');
      expect(emptyPermission.name).toBe('');
      expect(emptyPermission.description).toBe('');
      expect(emptyPermission.category).toBe('General');
    });
    
    it('should initialize with provided values', () => {
      expect(permission.id).toBe(defaultPermissionId);
      expect(permission.code).toBe('users.view');
      expect(permission.name).toBe('View Users');
      expect(permission.description).toBe('Allows viewing the list of users');
      expect(permission.category).toBe('Users');
    });
  });
  
  describe('isValidCode', () => {
    it('should return true for valid permission codes', () => {
      permission.code = 'users.view';
      expect(permission.isValidCode()).toBe(true);
      
      permission.code = 'customers.edit';
      expect(permission.isValidCode()).toBe(true);
    });
    
    it('should return false for invalid permission codes', () => {
      permission.code = '';
      expect(permission.isValidCode()).toBe(false);
      
      permission.code = 'users';
      expect(permission.isValidCode()).toBe(false);
      
      permission.code = 'users.';
      expect(permission.isValidCode()).toBe(false);
      
      permission.code = '.view';
      expect(permission.isValidCode()).toBe(false);
      
      permission.code = 'users.view.extra';
      expect(permission.isValidCode()).toBe(false);
      
      permission.code = 'Users.View';
      expect(permission.isValidCode()).toBe(false);
      
      permission.code = 'users-view';
      expect(permission.isValidCode()).toBe(false);
    });
  });
});

describe('UserPermission', () => {
  let userPermission: UserPermission;
  const userId = 1;
  const permissionId = 2;
  const grantedBy = 3;
  const defaultUserPermissionData = {
    userId,
    permissionId,
    grantedAt: new Date('2023-01-01'),
    grantedBy,
    isDenied: false
  };
  
  beforeEach(() => {
    userPermission = new UserPermission(defaultUserPermissionData);
  });
  
  describe('constructor', () => {
    it('should initialize with provided values', () => {
      expect(userPermission.userId).toBe(userId);
      expect(userPermission.permissionId).toBe(permissionId);
      expect(userPermission.grantedAt).toEqual(defaultUserPermissionData.grantedAt);
      expect(userPermission.grantedBy).toBe(grantedBy);
      expect(userPermission.isDenied).toBe(false);
    });
    
    it('should set default values for optional fields', () => {
      const minimalUserPermission = new UserPermission({
        userId,
        permissionId
      });
      
      expect(minimalUserPermission.userId).toBe(userId);
      expect(minimalUserPermission.permissionId).toBe(permissionId);
      expect(minimalUserPermission.grantedAt).toBeInstanceOf(Date);
      expect(minimalUserPermission.grantedBy).toBeUndefined();
      expect(minimalUserPermission.isDenied).toBe(false);
    });
    
    it('should throw error for invalid userId', () => {
      expect(() => {
        new UserPermission({
          permissionId
        });
      }).toThrow('UserPermission requires a valid userId');
      
      expect(() => {
        new UserPermission({
          userId: 0,
          permissionId
        });
      }).toThrow('UserPermission requires a valid userId');
      
      expect(() => {
        new UserPermission({
          userId: -1,
          permissionId
        });
      }).toThrow('UserPermission requires a valid userId');
    });
    
    it('should throw error for invalid permissionId', () => {
      expect(() => {
        new UserPermission({
          userId
        });
      }).toThrow('UserPermission requires a valid permissionId');
      
      expect(() => {
        new UserPermission({
          userId,
          permissionId: 0
        });
      }).toThrow('UserPermission requires a valid permissionId');
      
      expect(() => {
        new UserPermission({
          userId,
          permissionId: -1
        });
      }).toThrow('UserPermission requires a valid permissionId');
    });
  });
  
  describe('static methods', () => {
    it('grant should create a granted permission', () => {
      jest.useFakeTimers();
      const now = new Date();
      jest.setSystemTime(now);
      
      const grantedPermission = UserPermission.grant(userId, permissionId, grantedBy);
      
      expect(grantedPermission.userId).toBe(userId);
      expect(grantedPermission.permissionId).toBe(permissionId);
      expect(grantedPermission.grantedAt).toEqual(now);
      expect(grantedPermission.grantedBy).toBe(grantedBy);
      expect(grantedPermission.isDenied).toBe(false);
      
      jest.useRealTimers();
    });
    
    it('deny should create a denied permission', () => {
      jest.useFakeTimers();
      const now = new Date();
      jest.setSystemTime(now);
      
      const deniedPermission = UserPermission.deny(userId, permissionId, grantedBy);
      
      expect(deniedPermission.userId).toBe(userId);
      expect(deniedPermission.permissionId).toBe(permissionId);
      expect(deniedPermission.grantedAt).toEqual(now);
      expect(deniedPermission.grantedBy).toBe(grantedBy);
      expect(deniedPermission.isDenied).toBe(true);
      
      jest.useRealTimers();
    });
  });
});
