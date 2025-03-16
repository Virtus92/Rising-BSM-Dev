const {
  validateInput,
  validateText,
  validateEmail,
  validatePhone,
  validateDate,
  validateNumeric,
  validateBoolean
} = require('../../utils/validators');
const validator = require('validator');

// Mock validator module
jest.mock('validator', () => ({
  escape: jest.fn(str => str + '_escaped'),
  isEmail: jest.fn(),
  normalizeEmail: jest.fn(email => email + '_normalized'),
  isMobilePhone: jest.fn()
}));

describe('Validators', () => {
  describe('validateText', () => {
    test('should validate required text input', () => {
      const result = validateText('Test', { required: true });
      expect(result.isValid).toBe(true);
      expect(result.value).toBe('Test');
    });

    test('should handle empty required input', () => {
      const result = validateText('', { required: true });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input cannot be empty');
    });

    test('should validate length constraints', () => {
      const result = validateText('Test', { minLength: 5 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input must be at least 5 characters long');
    });

    test('should escape HTML content', () => {
      const result = validateText('<script>alert("XSS")</script>');
      expect(result.value).not.toContain('<script>');
    });
  });

  describe('validateEmail', () => {
    test('should validate correct email', () => {
      const result = validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.value).toBeTruthy();
    });

    test('should reject invalid email', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email address');
    });

    test('should handle required email', () => {
      const result = validateEmail('', true);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });
  });

  describe('validatePhone', () => {
    test('should validate German phone number', () => {
      const result = validatePhone('030 123 45678');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe('03012345678');
    });

    test('should validate international phone number', () => {
      const result = validatePhone('+49 30 123 45678');
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid phone number', () => {
      const result = validatePhone('123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Phone number must be between 8 and 15 digits');
    });
  });

  describe('validateDate', () => {
    test('should validate valid date', () => {
      const result = validateDate('2024-03-20');
      expect(result.isValid).toBe(true);
      expect(result.value instanceof Date).toBe(true);
    });

    test('should reject invalid date', () => {
      const result = validateDate('invalid-date');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid date format');
    });

    test('should validate date constraints', () => {
      const result = validateDate('2024-03-20', { 
        beforeDate: '2024-03-19'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Date must be before 2024-03-19');
    });
  });

  describe('validateNumeric', () => {
    test('should validate numeric input', () => {
      const result = validateNumeric('123.45');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(123.45);
    });

    test('should validate integer constraint', () => {
      const result = validateNumeric(123.45, { integer: true });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Value must be an integer');
    });

    test('should validate range constraints', () => {
      const result = validateNumeric(5, { min: 10, max: 20 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Value must be at least 10');
    });
  });

  describe('validateBoolean', () => {
    test('should validate boolean input', () => {
      expect(validateBoolean(true).value).toBe(true);
      expect(validateBoolean(false).value).toBe(false);
    });

    test('should validate string boolean input', () => {
      expect(validateBoolean('true').value).toBe(true);
      expect(validateBoolean('yes').value).toBe(true);
      expect(validateBoolean('false').value).toBe(false);
      expect(validateBoolean('no').value).toBe(false);
    });

    test('should reject invalid boolean', () => {
      const result = validateBoolean('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Value must be a boolean');
    });
  });

  describe('validateInput', () => {
    test('should validate against schema', () => {
      const schema = {
        name: { type: 'text', required: true },
        email: { type: 'email', required: true },
        age: { type: 'numeric', min: 18 },
        newsletter: { type: 'boolean' }
      };

      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        age: '25',
        newsletter: 'yes'
      };

      const result = validateInput(data, schema);
      expect(result.isValid).toBe(true);
      expect(result.data.name).toBe('John Doe');
      expect(result.data.age).toBe(25);
      expect(result.data.newsletter).toBe(true);
    });

    test('should collect all validation errors', () => {
      const schema = {
        name: { type: 'text', required: true },
        email: { type: 'email', required: true }
      };

      const data = {
        name: '',
        email: 'invalid-email'
      };

      const result = validateInput(data, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeDefined();
    });

    test('should handle invalid field type', () => {
      const schema = {
        field: { type: 'invalid' }
      };

      const result = validateInput({ field: 'value' }, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.field).toContain('Invalid field type');
    });
  });
});
