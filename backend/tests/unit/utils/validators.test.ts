import { 
  validateText, 
  validateEmail, 
  validatePhone, 
  validateDate, 
  validateNumeric, 
  validatePassword, 
  validateTimeFormat, 
  validateInput
} from '../../../utils/validators';
import { ValidationError} from '../../../utils/errors';
import { describe, test, expect } from '@jest/globals';



describe('Validators', () => {
  describe('validateText', () => {
    test('should validate and sanitize valid text', () => {
      const result = validateText('Test text', { 
        required: true, 
        minLength: 3, 
        maxLength: 20 
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.value).toBe('Test text');
    });
    
    test('should reject text that is too short', () => {
      const result = validateText('Hi', { 
        required: true, 
        minLength: 3
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('at least 3 characters'));
    });
    
    test('should escape HTML in text when requested', () => {
      const result = validateText('<script>alert("XSS")</script>', { 
        escape: true 
      });
      
      expect(result.isValid).toBe(true);
      expect(result.value).not.toContain('<script>');
      expect(result.value).toContain('&lt;script&gt;');
    });

    test('should handle null input when not required', () => {
      const result = validateText(null, { required: false });
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBe('');
    });
  });
  
  describe('validateEmail', () => {
    test('should validate valid email addresses', () => {
      const result = validateEmail('test@example.com');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should reject invalid email formats', () => {
      const result = validateEmail('not-an-email');
      
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(expect.stringContaining('Invalid email'));
      });
      
      test('should handle null/empty email when not required', () => {
        const result = validateEmail(null, { required: false });
        
        expect(result.isValid).toBe(true);
        expect(result.value).toBe('');
      });
  
      test('should reject null/empty email when required', () => {
        const result = validateEmail(null, { required: true });
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(expect.stringContaining('required'));
      });
    });
  
    describe('validatePhone', () => {
      test('should validate valid phone numbers', () => {
        const result = validatePhone('+49 123 4567890');
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
      
      test('should handle null/empty phone when not required', () => {
        const result = validatePhone(null, { required: false });
        
        expect(result.isValid).toBe(true);
        expect(result.value).toBe('');
      });
    });
  
    describe('validateDate', () => {
      test('should validate valid date', () => {
        const result = validateDate('2023-01-15');
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.value).toBeInstanceOf(Date);
      });
      
      test('should reject invalid date format', () => {
        const result = validateDate('not-a-date');
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(expect.stringContaining('Invalid date'));
      });
      
      test('should validate date is after specified date', () => {
        const result = validateDate('2023-01-15', {
          afterDate: '2023-01-01'
        });
        
        expect(result.isValid).toBe(true);
        
        const invalidResult = validateDate('2022-12-15', {
          afterDate: '2023-01-01'
        });
        
        expect(invalidResult.isValid).toBe(false);
        expect(invalidResult.errors).toContain(expect.stringContaining('must be after'));
      });
    });
  
    describe('validateNumeric', () => {
      test('should validate valid numbers', () => {
        const result = validateNumeric(123.45);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.value).toBe(123.45);
      });
      
      test('should convert string numbers', () => {
        const result = validateNumeric('123.45');
        
        expect(result.isValid).toBe(true);
        expect(result.value).toBe(123.45);
      });
      
      test('should validate integer constraint', () => {
        const result = validateNumeric(123, { integer: true });
        
        expect(result.isValid).toBe(true);
        
        const invalidResult = validateNumeric(123.45, { integer: true });
        
        expect(invalidResult.isValid).toBe(false);
        expect(invalidResult.errors).toContain(expect.stringContaining('integer'));
      });
      
      test('should validate min/max constraints', () => {
        const result = validateNumeric(50, { min: 0, max: 100 });
        
        expect(result.isValid).toBe(true);
        
        const minInvalidResult = validateNumeric(-10, { min: 0 });
        expect(minInvalidResult.isValid).toBe(false);
        expect(minInvalidResult.errors).toContain(expect.stringContaining('at least'));
        
        const maxInvalidResult = validateNumeric(150, { max: 100 });
        expect(maxInvalidResult.isValid).toBe(false);
        expect(maxInvalidResult.errors).toContain(expect.stringContaining('not exceed'));
      });
    });
  
    describe('validatePassword', () => {
      test('should validate strong password', () => {
        const result = validatePassword('StrongP@ssword123');
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
      
      test('should reject weak passwords', () => {
        const result = validatePassword('weak');
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
      
      test('should check for specific character requirements', () => {
        // Missing uppercase
        const missingUpper = validatePassword('nouppercases123!');
        expect(missingUpper.isValid).toBe(false);
        expect(missingUpper.errors).toContain(expect.stringContaining('uppercase'));
        
        // Missing number
        const missingNumber = validatePassword('NoNumbers!');
        expect(missingNumber.isValid).toBe(false);
        expect(missingNumber.errors).toContain(expect.stringContaining('number'));
        
        // Missing special character
        const missingSpecial = validatePassword('NoSpecialChars123');
        expect(missingSpecial.isValid).toBe(false);
        expect(missingSpecial.errors).toContain(expect.stringContaining('special character'));
      });
    });
    
    describe('validateTimeFormat', () => {
      test('should validate valid 24-hour time format', () => {
        const result = validateTimeFormat('14:30');
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
      
      test('should reject invalid time format', () => {
        const result = validateTimeFormat('25:70');
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(expect.stringContaining('Invalid time format'));
      });
      
      test('should validate 12-hour format when specified', () => {
        const result = validateTimeFormat('02:30 PM', { format: '12h' });
        
        expect(result.isValid).toBe(true);
        
        const invalidResult = validateTimeFormat('14:30', { format: '12h' });
        
        expect(invalidResult.isValid).toBe(false);
      });
    });
  
    describe('validateInput', () => {
      test('should validate object against schema', () => {
        const data = {
          name: 'Test User',
          email: 'test@example.com',
          age: '30'
        };
        
        const schema = {
          name: { type: 'text', required: true, minLength: 2 },
          email: { type: 'email', required: true },
          age: { type: 'numeric', required: true }
        };
        
        const result = validateInput(data, schema);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.validatedData).toEqual({
          name: 'Test User',
          email: expect.any(String),
          age: 30  // Converted to number
        });
      });
      
      test('should collect all validation errors', () => {
        const data = {
          name: '',
          email: 'invalid',
          age: 'not-a-number'
        };
        
        const schema = {
          name: { type: 'text', required: true, minLength: 2 },
          email: { type: 'email', required: true },
          age: { type: 'numeric', required: true }
        };
        
        const result = validateInput(data, schema);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors).toEqual(expect.arrayContaining([
          expect.stringContaining('name'),
          expect.stringContaining('email'),
          expect.stringContaining('age')
        ]));
      });
      
      test('should throw ValidationError when throwOnError option is used', () => {
        const data = {
          name: '',
        };
        
        const schema = {
          name: { type: 'text', required: true }
        };
        
        expect(() => validateInput(data, schema, { throwOnError: true }))
          .toThrow(ValidationError);
      });
    });
  });