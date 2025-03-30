import { ValidationUtils } from '../../../src/utils/validation-utils';

describe('ValidationUtils', () => {
  describe('sanitizeFilters', () => {
    it('should only include allowed filter keys', () => {
      // Arrange
      const filters = {
        name: 'Test',
        age: 30,
        email: 'test@example.com',
        role: 'admin',
        unknownField: 'should be excluded'
      };
      const allowedFilters = ['name', 'age', 'email'];

      // Act
      const result = ValidationUtils.sanitizeFilters(filters, allowedFilters);

      // Assert
      expect(result).toEqual({
        name: 'Test',
        age: 30,
        email: 'test@example.com'
      });
      expect(result).not.toHaveProperty('role');
      expect(result).not.toHaveProperty('unknownField');
    });

    it('should apply default values when not provided', () => {
      // Arrange
      const filters = {
        name: 'Test'
      };
      const allowedFilters = ['name', 'age', 'email'];
      const defaults = {
        age: 25,
        email: 'default@example.com'
      };

      // Act
      const result = ValidationUtils.sanitizeFilters(filters, allowedFilters, defaults);

      // Assert
      expect(result).toEqual({
        name: 'Test',
        age: 25,
        email: 'default@example.com'
      });
    });

    it('should override defaults with provided values', () => {
      // Arrange
      const filters = {
        name: 'Test',
        age: 30
      };
      const allowedFilters = ['name', 'age', 'email'];
      const defaults = {
        age: 25,
        email: 'default@example.com'
      };

      // Act
      const result = ValidationUtils.sanitizeFilters(filters, allowedFilters, defaults);

      // Assert
      expect(result).toEqual({
        name: 'Test',
        age: 30,
        email: 'default@example.com'
      });
    });

    it('should handle empty filters object', () => {
      // Arrange
      const filters = {};
      const allowedFilters = ['name', 'age', 'email'];
      const defaults = {
        age: 25,
        email: 'default@example.com'
      };

      // Act
      const result = ValidationUtils.sanitizeFilters(filters, allowedFilters, defaults);

      // Assert
      expect(result).toEqual(defaults);
    });
  });

  describe('parseNumericParam', () => {
    it('should parse valid numeric string', () => {
      // Arrange
      const param = '123';
      const defaultValue = 0;

      // Act
      const result = ValidationUtils.parseNumericParam(param, defaultValue);

      // Assert
      expect(result).toBe(123);
    });

    it('should return default value for undefined', () => {
      // Arrange
      const param = undefined;
      const defaultValue = 42;

      // Act
      const result = ValidationUtils.parseNumericParam(param, defaultValue);

      // Assert
      expect(result).toBe(defaultValue);
    });

    it('should return default value for empty string', () => {
      // Arrange
      const param = '';
      const defaultValue = 42;

      // Act
      const result = ValidationUtils.parseNumericParam(param, defaultValue);

      // Assert
      expect(result).toBe(defaultValue);
    });

    it('should return default value for non-numeric string', () => {
      // Arrange
      const param = 'not-a-number';
      const defaultValue = 42;

      // Act
      const result = ValidationUtils.parseNumericParam(param, defaultValue);

      // Assert
      expect(result).toBe(defaultValue);
    });

    it('should parse and truncate float values', () => {
      // Arrange
      const param = '123.45';
      const defaultValue = 0;

      // Act
      const result = ValidationUtils.parseNumericParam(param, defaultValue);

      // Assert
      expect(result).toBe(123); // parseInt truncates decimal places
    });

    it('should parse negative numbers', () => {
      // Arrange
      const param = '-123';
      const defaultValue = 0;

      // Act
      const result = ValidationUtils.parseNumericParam(param, defaultValue);

      // Assert
      expect(result).toBe(-123);
    });
  });

  describe('parseDateParam', () => {
    it('should parse valid date string', () => {
      // Arrange
      const param = '2023-05-15';
      const expectedDate = new Date('2023-05-15');

      // Act
      const result = ValidationUtils.parseDateParam(param);

      // Assert
      expect(result).toEqual(expectedDate);
    });

    it('should return undefined for undefined input', () => {
      // Arrange
      const param = undefined;

      // Act
      const result = ValidationUtils.parseDateParam(param);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      // Arrange
      const param = '';

      // Act
      const result = ValidationUtils.parseDateParam(param);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid date string', () => {
      // Arrange
      const param = 'not-a-date';

      // Act
      const result = ValidationUtils.parseDateParam(param);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should parse ISO date-time string', () => {
      // Arrange
      const param = '2023-05-15T14:30:45.123Z';
      const expectedDate = new Date('2023-05-15T14:30:45.123Z');

      // Act
      const result = ValidationUtils.parseDateParam(param);

      // Assert
      expect(result).toEqual(expectedDate);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.isValidEmail('user.name@example.co.uk')).toBe(true);
      expect(ValidationUtils.isValidEmail('user+tag@example.org')).toBe(true);
      expect(ValidationUtils.isValidEmail('123@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidEmail('test')).toBe(false);
      expect(ValidationUtils.isValidEmail('test@')).toBe(false);
      expect(ValidationUtils.isValidEmail('@example.com')).toBe(false);
      expect(ValidationUtils.isValidEmail('test@example')).toBe(false);
      expect(ValidationUtils.isValidEmail('test@.com')).toBe(false);
      expect(ValidationUtils.isValidEmail('test@example.')).toBe(false);
      expect(ValidationUtils.isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct phone number formats', () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidPhone('1234567890')).toBe(true);
      expect(ValidationUtils.isValidPhone('123-456-7890')).toBe(true);
      expect(ValidationUtils.isValidPhone('123.456.7890')).toBe(true);
      expect(ValidationUtils.isValidPhone('123 456 7890')).toBe(true);
      expect(ValidationUtils.isValidPhone('(123)456-7890')).toBe(true);
      expect(ValidationUtils.isValidPhone('+11234567890')).toBe(true);
    });

    it('should reject invalid phone number formats', () => {
      // Arrange & Act & Assert
      expect(ValidationUtils.isValidPhone('123')).toBe(false);
      expect(ValidationUtils.isValidPhone('abcdefghij')).toBe(false);
      expect(ValidationUtils.isValidPhone('123-abc-7890')).toBe(false);
      expect(ValidationUtils.isValidPhone('')).toBe(false);
    });
  });

  describe('isValidLength', () => {
    it('should validate strings within length range', () => {
      // Arrange
      const str = 'test';
      const min = 2;
      const max = 10;

      // Act & Assert
      expect(ValidationUtils.isValidLength(str, min, max)).toBe(true);
    });

    it('should validate string at minimum length', () => {
      // Arrange
      const str = 'ab';
      const min = 2;
      const max = 10;

      // Act & Assert
      expect(ValidationUtils.isValidLength(str, min, max)).toBe(true);
    });

    it('should validate string at maximum length', () => {
      // Arrange
      const str = '1234567890';
      const min = 2;
      const max = 10;

      // Act & Assert
      expect(ValidationUtils.isValidLength(str, min, max)).toBe(true);
    });

    it('should reject string below minimum length', () => {
      // Arrange
      const str = 'a';
      const min = 2;
      const max = 10;

      // Act & Assert
      expect(ValidationUtils.isValidLength(str, min, max)).toBe(false);
    });

    it('should reject string above maximum length', () => {
      // Arrange
      const str = '12345678901'; // 11 characters
      const min = 2;
      const max = 10;

      // Act & Assert
      expect(ValidationUtils.isValidLength(str, min, max)).toBe(false);
    });

    it('should handle empty string', () => {
      // Arrange
      const str = '';
      const min = 2;
      const max = 10;

      // Act & Assert
      expect(ValidationUtils.isValidLength(str, min, max)).toBe(false);
    });
  });
});
