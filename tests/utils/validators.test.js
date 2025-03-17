const validators = require('../../utils/validators');

describe('Validation Utilities', () => {
    describe('validateText', () => {
        it('should validate text input with default options', () => {
            const result = validators.validateText('test');
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
            expect(result.value).toBe('test');
        });

        it('should validate required text input', () => {
            const result = validators.validateText('', { required: true });
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Input cannot be empty']);
        });

        it('should validate minimum text length', () => {
            const result = validators.validateText('te', { minLength: 3 });
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Input must be at least 3 characters long']);
        });

        it('should validate maximum text length', () => {
            const result = validators.validateText('testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttest', { maxLength: 5 });
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Input must not exceed 5 characters']);
        });

        it('should trim text input', () => {
            const result = validators.validateText('  test  ');
            expect(result.value).toBe('test');
        });

        it('should not trim text input if trim is false', () => {
            const result = validators.validateText('  test  ', { trim: false });
            expect(result.value).toBe('  test  ');
        });

        it('should escape text input', () => {
            const result = validators.validateText('<script>alert("test")</script>');
            expect(result.value).toBe('&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;');
        });

        it('should not escape text input if escape is false', () => {
            const result = validators.validateText('<script>alert("test")</script>', { escape: false });
            expect(result.value).toBe('<script>alert("test")</script>');
        });
    });

    describe('validateEmail', () => {
        it('should validate a valid email address', () => {
            const result = validators.validateEmail('test@example.com');
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
            expect(result.value).toBe('test@example.com');
        });

        it('should invalidate an invalid email address', () => {
            const result = validators.validateEmail('invalid-email');
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Invalid email address']);
        });

        it('should invalidate an empty email address', () => {
            const result = validators.validateEmail('');
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Invalid email address']);
        });
    });

    describe('validatePhone', () => {
        it('should validate a valid phone number', () => {
            const result = validators.validatePhone('123-456-7890');
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
            expect(result.value).toBe('1234567890');
        });

        it('should invalidate an invalid phone number', () => {
            const result = validators.validatePhone('123');
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Invalid phone number']);
        });

        it('should handle empty phone number', () => {
            const result = validators.validatePhone('');
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
            expect(result.value).toBe('');
        });
    });

    describe('validateDate', () => {
        it('should validate a valid date', () => {
            const result = validators.validateDate('2023-01-01');
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
            expect(result.value).toEqual(new Date('2023-01-01T00:00:00.000Z'));
        });

        it('should invalidate an invalid date', () => {
            const result = validators.validateDate('invalid-date');
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Invalid date format']);
        });

        it('should validate required date', () => {
            const result = validators.validateDate(null, { required: true });
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Date is required']);
        });

        it('should invalidate past date when not allowed', () => {
            const result = validators.validateDate('2020-01-01', { pastAllowed: false });
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Date cannot be in the past']);
        });

        it('should invalidate future date when not allowed', () => {
            const result = validators.validateDate('2100-01-01', { futureAllowed: false });
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Date cannot be in the future']);
        });

        it('should invalidate date before beforeDate', () => {
            const result = validators.validateDate('2100-01-01', { beforeDate: '2024-01-01' });
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Date must be before 2024-01-01']);
        });

        it('should invalidate date after afterDate', () => {
            const result = validators.validateDate('2020-01-01', { afterDate: '2023-01-01' });
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Date must be after 2023-01-01']);
        });
    });

    describe('validateTimeFormat', () => {
        it('should validate a valid time format', () => {
            const result = validators.validateTimeFormat('12:30');
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
            expect(result.value).toBe('12:30');
        });

        it('should invalidate an invalid time format', () => {
            const result = validators.validateTimeFormat('25:00');
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Invalid time format. Use 24-hour format (HH:MM)']);
        });

        it('should invalidate an invalid time format', () => {
            const result = validators.validateTimeFormat('1:30');
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Invalid time format. Use 24-hour format (HH:MM)']);
        });

        it('should validate required time', () => {
            const result = validators.validateTimeFormat(null, { required: true });
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Time is required']);
        });
    });

    describe('validateNumeric', () => {
        it('should validate a valid numeric value', () => {
            const result = validators.validateNumeric(123);
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
            expect(result.value).toBe(123);
        });

        it('should invalidate a non-numeric value', () => {
            const result = validators.validateNumeric('abc');
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Value must be a number']);
        });

        it('should validate required value', () => {
            const result = validators.validateNumeric(null, { required: true });
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Value is required']);
        });

        it('should invalidate value less than min', () => {
            const result = validators.validateNumeric(1, { min: 2 });
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Value must be at least 2']);
        });

        it('should invalidate value greater than max', () => {
            const result = validators.validateNumeric(3, { max: 2 });
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Value must not exceed 2']);
        });

        it('should invalidate non-integer value when integer is true', () => {
            const result = validators.validateNumeric(1.5, { integer: true });
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(['Value must be an integer']);
        });
    });

    describe('validateInput', () => {
        it('should validate input data against a schema', () => {
            const schema = {
                name: { type: 'text', required: true },
                email: { type: 'email' },
                age: { type: 'numeric', integer: true, min: 18 }
            };
            const data = {
                name: 'John Doe',
                email: 'john.doe@example.com',
                age: 25
            };
            const result = validators.validateInput(data, schema);
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
            expect(result.validatedData).toEqual({
                name: 'John Doe',
                email: 'john.doe@example.com',
                age: 25
            });
        });

        it('should return errors for invalid input data', () => {
            const schema = {
                name: { type: 'text', required: true },
                email: { type: 'email' },
                age: { type: 'numeric', integer: true, min: 18 }
            };
            const data = {
                name: '',
                email: 'invalid-email',
                age: 15
            };
            const result = validators.validateInput(data, schema);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                'name: Input cannot be empty',
                'email: Invalid email address',
                'age: Value must be at least 18'
            ]);
            expect(result.validatedData).toEqual({
                name: '',
                email: 'invalid-email',
                age: 15
            });
        });
    });
});