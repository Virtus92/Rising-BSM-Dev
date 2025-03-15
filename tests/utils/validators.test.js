const validators = require('../../utils/validators');
const validator = require('validator');

// Mock validator module
jest.mock('validator', () => ({
  escape: jest.fn(str => str + '_escaped'),
  isEmail: jest.fn(),
  normalizeEmail: jest.fn(email => email + '_normalized'),
  isMobilePhone: jest.fn()
}));

describe('validateText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should validate required text correctly', () => {
    const result = validators.validateText('Hello', { required: true });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(validator.escape).toHaveBeenCalledWith('Hello');
  });

  test('should reject empty required text', () => {
    const result = validators.validateText('', { required: true });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Input cannot be empty');
  });

  test('should validate text length constraints', () => {
    const result = validators.validateText('abc', { minLength: 5 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Input must be at least 5 characters long');
    
    const result2 = validators.validateText('abcdefghij', { maxLength: 5 });
    expect(result2.isValid).toBe(false);
    expect(result2.errors).toContain('Input must not exceed 5 characters');
  });

  test('should handle null/undefined input', () => {
    const result = validators.validateText(null, { required: true });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Input is required');
    
    const result2 = validators.validateText(null, { required: false });
    expect(result2.isValid).toBe(true);
  });
});

describe('validateEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should validate correct email addresses', () => {
    validator.isEmail.mockReturnValue(true);
    const result = validators.validateEmail('test@example.com');
    expect(result.isValid).toBe(true);
    expect(validator.isEmail).toHaveBeenCalledWith('test@example.com');
    expect(validator.normalizeEmail).toHaveBeenCalledWith('test@example.com');
  });

  test('should reject invalid email addresses', () => {
    validator.isEmail.mockReturnValue(false);
    const result = validators.validateEmail('invalid-email');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid email address');
  });
});

describe('validatePhone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should validate valid phone numbers', () => {
    validator.isMobilePhone.mockReturnValue(true);
    const result = validators.validatePhone('+49 173 1234567');
    expect(result.isValid).toBe(true);
    expect(validator.isMobilePhone).toHaveBeenCalledWith('491731234567', 'any');
  });

  test('should reject invalid phone numbers', () => {
    validator.isMobilePhone.mockReturnValue(false);
    const result = validators.validatePhone('not-a-phone');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid phone number');
  });
});

describe('validateDate', () => {
  test('should validate date format and constraints', () => {
    const result = validators.validateDate('2023-01-01');
    expect(result.isValid).toBe(true);
    expect(result.value).toBeInstanceOf(Date);
    
    const result2 = validators.validateDate('invalid-date');
    expect(result2.isValid).toBe(false);
    expect(result2.errors).toContain('Invalid date format');
  });

  test('should enforce before/after constraints', () => {
    const result = validators.validateDate('2023-01-01', { 
      afterDate: '2023-02-01' 
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Date must be after 2023-02-01');
    
    const result2 = validators.validateDate('2023-03-01', { 
      beforeDate: '2023-02-01' 
    });
    expect(result2.isValid).toBe(false);
    expect(result2.errors).toContain('Date must be before 2023-02-01');
  });
});

describe('validateNumeric', () => {
  test('should validate numeric values and ranges', () => {
    const result = validators.validateNumeric(5, { min: 1, max: 10 });
    expect(result.isValid).toBe(true);
    expect(result.value).toBe(5);
    
    const result2 = validators.validateNumeric(15, { max: 10 });
    expect(result2.isValid).toBe(false);
    expect(result2.errors).toContain('Value must not exceed 10');
    
    const result3 = validators.validateNumeric(0, { min: 1 });
    expect(result3.isValid).toBe(false);
    expect(result3.errors).toContain('Value must be at least 1');
  });

  test('should validate integer constraint', () => {
    const result = validators.validateNumeric(1.5, { integer: true });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Value must be an integer');
    
    const result2 = validators.validateNumeric(2, { integer: true });
    expect(result2.isValid).toBe(true);
  });
});

describe('validateInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should validate multiple fields according to schema', () => {
    validator.isEmail.mockReturnValue(true);
    validator.isMobilePhone.mockReturnValue(true);
    
    const data = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+49 123 4567890'
    };
    
    const schema = {
      name: { type: 'text', required: true },
      email: { type: 'email' },
      phone: { type: 'phone' }
    };
    
    const result = validators.validateInput(data, schema);
    expect(result.isValid).toBe(true);
    expect(result.validatedData).toHaveProperty('name');
    expect(result.validatedData).toHaveProperty('email');
    expect(result.validatedData).toHaveProperty('phone');
  });

  test('should collect errors from all invalid fields', () => {
    validator.isEmail.mockReturnValue(false);
    validator.isMobilePhone.mockReturnValue(false);
    
    const data = {
      name: '',
      email: 'invalid-email',
      phone: 'invalid-phone'
    };
    
    const schema = {
      name: { type: 'text', required: true },
      email: { type: 'email' },
      phone: { type: 'phone' }
    };
    
    const result = validators.validateInput(data, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(3);
  });
});
