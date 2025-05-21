import { ValidationService } from '../ValidationService';
import { ValidationResult } from '../IValidationService';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
    
    // Mock the logger
    (validationService as any).logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validate', () => {
    it('should validate required fields correctly', () => {
      const schema = {
        properties: {
          name: { type: 'string' },
          email: { type: 'string' }
        },
        required: ['name', 'email']
      };

      // Valid data
      const validData = { name: 'John', email: 'john@example.com' };
      const validResult = validationService.validate(validData, schema);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Invalid data - missing required field
      const invalidData = { name: 'John' };
      const invalidResult = validationService.validate(invalidData, schema);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('email is required');
    });

    it('should validate string length correctly', () => {
      const schema = {
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 10 }
        }
      };

      // Valid data
      const validResult = validationService.validate({ name: 'John' }, schema);
      expect(validResult.isValid).toBe(true);

      // Too short
      const tooShortResult = validationService.validate({ name: 'Jo' }, schema);
      expect(tooShortResult.isValid).toBe(false);
      expect(tooShortResult.errors).toContain('name must be at least 3 characters');

      // Too long
      const tooLongResult = validationService.validate({ name: 'JohnDoeWithVeryLongName' }, schema);
      expect(tooLongResult.isValid).toBe(false);
      expect(tooLongResult.errors).toContain('name must not exceed 10 characters');
    });

    it('should validate numeric ranges correctly', () => {
      const schema = {
        properties: {
          age: { type: 'number', minimum: 18, maximum: 65 }
        }
      };

      // Valid data
      const validResult = validationService.validate({ age: 30 }, schema);
      expect(validResult.isValid).toBe(true);

      // Too low
      const tooLowResult = validationService.validate({ age: 16 }, schema);
      expect(tooLowResult.isValid).toBe(false);
      expect(tooLowResult.errors).toContain('age must be at least 18');

      // Too high
      const tooHighResult = validationService.validate({ age: 70 }, schema);
      expect(tooHighResult.isValid).toBe(false);
      expect(tooHighResult.errors).toContain('age must not exceed 65');
    });

    it('should validate enum values correctly', () => {
      const schema = {
        properties: {
          status: { type: 'string', enum: ['active', 'inactive', 'pending'] }
        }
      };

      // Valid data
      const validResult = validationService.validate({ status: 'active' }, schema);
      expect(validResult.isValid).toBe(true);

      // Invalid enum value
      const invalidResult = validationService.validate({ status: 'deleted' }, schema);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors[0]).toContain('status must be one of:');
      expect(invalidResult.errors[0]).toContain('active');
      expect(invalidResult.errors[0]).toContain('inactive');
      expect(invalidResult.errors[0]).toContain('pending');
    });

    it('should validate data types correctly', () => {
      const schema = {
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          isActive: { type: 'boolean' }
        }
      };

      // Valid data
      const validResult = validationService.validate(
        { name: 'John', age: 30, isActive: true }, 
        schema
      );
      expect(validResult.isValid).toBe(true);

      // Invalid types
      const invalidResult = validationService.validate(
        { name: 123, age: '30', isActive: 'yes' }, 
        schema
      );
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('name must be of type string');
      expect(invalidResult.errors).toContain('age must be of type number');
      expect(invalidResult.errors).toContain('isActive must be of type boolean');
    });
  });

  describe('validateField', () => {
    it('should validate a single field correctly', () => {
      const schema = { type: 'string', minLength: 3, maxLength: 10 };
      
      // Valid field
      const validResult = validationService.validateField('name', 'John', schema);
      expect(validResult.isValid).toBe(true);
      
      // Invalid field
      const invalidResult = validationService.validateField('name', 'Jo', schema);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('name must be at least 3 characters');
    });
    
    it('should handle required fields', () => {
      const schema = { type: 'string', required: true };
      
      // Valid field
      const validResult = validationService.validateField('name', 'John', schema);
      expect(validResult.isValid).toBe(true);
      
      // Empty value for required field
      const emptyResult = validationService.validateField('name', '', schema);
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors).toContain('name is required');
      
      // Null value for required field
      const nullResult = validationService.validateField('name', null, schema);
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.errors).toContain('name is required');
    });
    
    it('should validate pattern matching', () => {
      const schema = { type: 'string', pattern: '^[A-Z][a-z]+$' };
      
      // Valid field
      const validResult = validationService.validateField('name', 'John', schema);
      expect(validResult.isValid).toBe(true);
      
      // Invalid pattern
      const invalidResult = validationService.validateField('name', 'john', schema);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('name has invalid format');
    });
    
    it('should validate numbers correctly', () => {
      const schema = { type: 'number', min: 18, max: 65 };
      
      // Valid field
      const validResult = validationService.validateField('age', 30, schema);
      expect(validResult.isValid).toBe(true);
      
      // Too low
      const tooLowResult = validationService.validateField('age', 16, schema);
      expect(tooLowResult.isValid).toBe(false);
      expect(tooLowResult.errors).toContain('age must be at least 18');
      
      // Too high
      const tooHighResult = validationService.validateField('age', 70, schema);
      expect(tooHighResult.isValid).toBe(false);
      expect(tooHighResult.errors).toContain('age must not exceed 65');
    });
  });

  describe('cast', () => {
    it('should cast values to the correct types', () => {
      expect(validationService.cast('123', 'number')).toBe(123);
      expect(validationService.cast(123, 'string')).toBe('123');
      expect(validationService.cast('true', 'boolean')).toBe(true);
      expect(validationService.cast('2023-01-01', 'date')).toBeInstanceOf(Date);
      expect(validationService.cast('item', 'array')).toEqual(['item']);
      expect(validationService.cast(['item'], 'array')).toEqual(['item']);
    });
    
    it('should handle null and undefined values', () => {
      expect(validationService.cast(null, 'string')).toBeNull();
      expect(validationService.cast(undefined, 'number')).toBeUndefined();
    });
    
    it('should return original value for unknown types', () => {
      const complexObj = { id: 1, name: 'Test' };
      expect(validationService.cast(complexObj, 'unknown')).toBe(complexObj);
    });
  });

  describe('validateEmail', () => {
    it('should validate email addresses correctly', () => {
      expect(validationService.validateEmail('john@example.com')).toBe(true);
      expect(validationService.validateEmail('john.doe@example.co.uk')).toBe(true);
      expect(validationService.validateEmail('john+tag@example.com')).toBe(true);
      
      expect(validationService.validateEmail('john@')).toBe(false);
      expect(validationService.validateEmail('john@example')).toBe(false);
      expect(validationService.validateEmail('johnexample.com')).toBe(false);
      expect(validationService.validateEmail('')).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate phone numbers correctly', () => {
      expect(validationService.validatePhoneNumber('1234567890')).toBe(true);
      expect(validationService.validatePhoneNumber('123-456-7890')).toBe(true);
      expect(validationService.validatePhoneNumber('(123) 456-7890')).toBe(true);
      expect(validationService.validatePhoneNumber('+11234567890')).toBe(true);
      
      expect(validationService.validatePhoneNumber('123')).toBe(false);
      expect(validationService.validatePhoneNumber('abcdefghij')).toBe(false);
      expect(validationService.validatePhoneNumber('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate passwords correctly', () => {
      // Valid password
      const validResult = validationService.validatePassword('Password123');
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
      
      // Too short
      const tooShortResult = validationService.validatePassword('Pass1');
      expect(tooShortResult.isValid).toBe(false);
      expect(tooShortResult.errors).toContain('Password must be at least 8 characters');
      
      // No uppercase
      const noUpperResult = validationService.validatePassword('password123');
      expect(noUpperResult.isValid).toBe(false);
      expect(noUpperResult.errors).toContain('Password must contain at least one uppercase letter');
      
      // No lowercase
      const noLowerResult = validationService.validatePassword('PASSWORD123');
      expect(noLowerResult.isValid).toBe(false);
      expect(noLowerResult.errors).toContain('Password must contain at least one lowercase letter');
      
      // No number
      const noNumberResult = validationService.validatePassword('PasswordAbc');
      expect(noNumberResult.isValid).toBe(false);
      expect(noNumberResult.errors).toContain('Password must contain at least one number');
      
      // Empty password
      const emptyResult = validationService.validatePassword('');
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors).toContain('Password is required');
    });
  });

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const html = '<p>Hello</p><script>alert("XSS");</script>';
      expect(validationService.sanitizeHtml(html)).toBe('<p>Hello</p>');
    });
    
    it('should remove iframe tags', () => {
      const html = '<p>Hello</p><iframe src="https://evil.com"></iframe>';
      expect(validationService.sanitizeHtml(html)).toBe('<p>Hello</p>');
    });
    
    it('should remove object tags', () => {
      const html = '<p>Hello</p><object data="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="></object>';
      expect(validationService.sanitizeHtml(html)).toBe('<p>Hello</p>');
    });
    
    it('should remove embed tags', () => {
      const html = '<p>Hello</p><embed src="https://evil.com/evil.swf"></embed>';
      expect(validationService.sanitizeHtml(html)).toBe('<p>Hello</p>');
    });
    
    it('should preserve safe HTML', () => {
      const html = '<p>Hello <strong>world</strong>!</p><a href="https://example.com">Link</a>';
      expect(validationService.sanitizeHtml(html)).toBe(html);
    });
  });

  describe('validateDate', () => {
    it('should validate Date objects correctly', () => {
      expect(validationService.validateDate(new Date())).toBe(true);
      expect(validationService.validateDate(new Date('invalid'))).toBe(false);
    });
    
    it('should validate date strings correctly', () => {
      expect(validationService.validateDate('2023-01-01')).toBe(true);
      expect(validationService.validateDate('2023/01/01')).toBe(true);
      expect(validationService.validateDate('January 1, 2023')).toBe(true);
      expect(validationService.validateDate('not a date')).toBe(false);
    });
  });

  describe('isEmpty', () => {
    it('should detect empty values correctly', () => {
      expect(validationService.isEmpty(null)).toBe(true);
      expect(validationService.isEmpty(undefined)).toBe(true);
      expect(validationService.isEmpty('')).toBe(true);
      expect(validationService.isEmpty(' ')).toBe(true);
      expect(validationService.isEmpty([])).toBe(true);
      expect(validationService.isEmpty({})).toBe(true);
      
      expect(validationService.isEmpty('text')).toBe(false);
      expect(validationService.isEmpty(0)).toBe(false);
      expect(validationService.isEmpty(false)).toBe(false);
      expect(validationService.isEmpty([1, 2, 3])).toBe(false);
      expect(validationService.isEmpty({ key: 'value' })).toBe(false);
    });
  });

  describe('validateCreateUser', () => {
    it('should validate user creation data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        role: 'user'
      };
      
      const result = validationService.validateCreateUser(validData);
      expect(result.isValid).toBe(true);
    });
    
    it('should reject invalid user creation data', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'short',
        role: 'invalid-role'
      };
      
      const result = validationService.validateCreateUser(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Invalid email format');
      expect(result.errors).toContain('Password must be at least 8 characters');
    });
  });

  describe('validateUpdateUser', () => {
    it('should validate user update data', () => {
      const validData = {
        name: 'John Doe Updated',
        email: 'john.updated@example.com',
        role: 'admin'
      };
      
      const result = validationService.validateUpdateUser(validData);
      expect(result.isValid).toBe(true);
    });
    
    it('should reject invalid user update data', () => {
      const invalidData = {
        email: 'invalid-email',
        role: 'invalid-role'
      };
      
      const result = validationService.validateUpdateUser(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Invalid email format');
    });
  });
});