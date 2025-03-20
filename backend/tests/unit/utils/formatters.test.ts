import {
    formatDateSafely,
    formatRelativeTime,
    formatDateWithLabel,
    formatCurrency,
    formatNumber,
    formatPercentage,
    formatFileSize,
    formatPhone
  } from '../../../utils/formatters';

  import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
  
  describe('Formatter Utilities', () => {
    describe('formatDateSafely', () => {
      test('should format valid date', () => {
        const date = new Date(2023, 0, 15); // January 15, 2023
        const formatted = formatDateSafely(date, 'dd.MM.yyyy');
        
        expect(formatted).toBe('15.01.2023');
      });
      
      test('should format date from string', () => {
        const formatted = formatDateSafely('2023-01-15', 'dd.MM.yyyy');
        
        expect(formatted).toBe('15.01.2023');
      });
      
      test('should return default value for invalid date', () => {
        const formatted = formatDateSafely('invalid-date', 'dd.MM.yyyy');
        
        expect(formatted).toBe('Unbekannt');
      });
      
      test('should return custom default value when specified', () => {
        const formatted = formatDateSafely(null, 'dd.MM.yyyy', 'Nicht verfügbar');
        
        expect(formatted).toBe('Nicht verfügbar');
      });
      
      test('should handle errors gracefully', () => {
        // Spy on console.error to suppress it
        jest.spyOn(console, 'error').mockImplementation(() => {});
        
        const formatted = formatDateSafely({} as any, 'dd.MM.yyyy');
        
        expect(formatted).toBe('Unbekannt');
        expect(console.error).toHaveBeenCalled();
      });
    });
    
    describe('formatRelativeTime', () => {
      test('should format relative time for past date', () => {
        // Mock the formatDistanceToNow function result
        jest.mock('date-fns', () => ({
          ...(jest.requireActual('date-fns') as object),
          formatDistanceToNow: jest.fn().mockReturnValue('2 Tage')
        }));
        
        const date = new Date();
        date.setDate(date.getDate() - 2); // 2 days ago
        
        const formatted = formatRelativeTime(date);
        
        expect(formatted).toContain('ago');
      });
      
      test('should return default value for invalid date', () => {
        const formatted = formatRelativeTime('invalid-date');
        
        expect(formatted).toBe('Ungültiges Datum');
      });
      
      test('should return default value for null date', () => {
        const formatted = formatRelativeTime(null);
        
        expect(formatted).toBe('Unbekannt');
      });
    });
    
    describe('formatDateWithLabel', () => {
      const realDate = Date;
      let mockDate: Date;
      
      beforeEach(() => {
        // Set a fixed date for testing "today", "tomorrow", etc.
        mockDate = new Date(2023, 0, 15, 12, 0, 0); // January 15, 2023, noon
        global.Date = class extends Date {
          constructor(...args: any[]) {
            if (args.length === 0) {
              super(mockDate.getTime());
            } else {
              super(...(args as unknown as []));
            }
          }
          static now() {
            return mockDate.getTime();
          }
        } as any;
      });
      
      afterEach(() => {
        global.Date = realDate;
      });
      
      test('should return "Heute" for today', () => {
        const today = new Date(2023, 0, 15); // Same day as mock date
        const result = formatDateWithLabel(today);
        
        expect(result.label).toBe('Heute');
        expect(result.class).toBe('primary');
      });
      
      test('should return "Morgen" for tomorrow', () => {
        const tomorrow = new Date(2023, 0, 16); // Next day from mock date
        const result = formatDateWithLabel(tomorrow);
        
        expect(result.label).toBe('Morgen');
        expect(result.class).toBe('success');
      });
      
      test('should return "Gestern" for yesterday', () => {
        const yesterday = new Date(2023, 0, 14); // Previous day from mock date
        const result = formatDateWithLabel(yesterday);
        
        expect(result.label).toBe('Gestern');
        expect(result.class).toBe('warning');
      });
      
      test('should return formatted date for other dates', () => {
        const otherDate = new Date(2023, 1, 1); // February 1, 2023
        const result = formatDateWithLabel(otherDate);
        
        expect(result.label).toBe('01.02.2023');
        expect(result.class).toBe('secondary');
      });
      
      test('should handle invalid date', () => {
        const result = formatDateWithLabel('invalid-date');
        
        expect(result.label).toBe('Ungültiges Datum');
        expect(result.class).toBe('danger');
      });
    });
    
    describe('formatCurrency', () => {
      test('should format number as currency', () => {
        const result = formatCurrency(1234.56);
        
        expect(result).toContain('1.234,56');
        expect(result).toContain('€'); // Default currency symbol
      });
      
      test('should use provided currency', () => {
        const result = formatCurrency(1234.56, 'USD');
        
        expect(result).toContain('$');
      });
      
      test('should handle null input', () => {
        const result = formatCurrency(null);
        
        expect(result).toBe('-');
      });
    });
    
    describe('formatNumber', () => {
      test('should format number with thousands separator', () => {
        const result = formatNumber(1234567.89);
        
        expect(result).toBe('1.234.567,89');
      });
      
      test('should respect decimals parameter', () => {
        const result = formatNumber(1234.5678, 3);
        
        expect(result).toBe('1.234,568');
      });
      
      test('should handle null input', () => {
        const result = formatNumber(null);
        
        expect(result).toBe('-');
      });
    });
    
    describe('formatPercentage', () => {
      test('should format number as percentage', () => {
        const result = formatPercentage(75.5);
        
        expect(result).toBe('75,5%');
      });
      
      test('should respect decimals parameter', () => {
        const result = formatPercentage(75.5678, 2);
        
        expect(result).toBe('75,57%');
      });
      
      test('should handle null input', () => {
        const result = formatPercentage(null);
        
        expect(result).toBe('-');
      });
    });
    
    describe('formatFileSize', () => {
      test('should format bytes as human-readable size', () => {
        expect(formatFileSize(0)).toBe('0 Bytes');
        expect(formatFileSize(1023)).toBe('1023 Bytes');
        expect(formatFileSize(1024)).toBe('1 KB');
        expect(formatFileSize(1024 * 1024)).toBe('1 MB');
        expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      });
      
      test('should handle decimal values', () => {
        expect(formatFileSize(1536)).toBe('1.5 KB');
      });
      
      test('should handle null input', () => {
        const result = formatFileSize(null);
        
        expect(result).toBe('-');
      });
    });
    
    describe('formatPhone', () => {
      test('should format phone number with spaces', () => {
        const result = formatPhone('1234567890');
        
        expect(result).toContain(' '); // Should contain spaces as separators
      });
      
      test('should handle null input', () => {
        const result = formatPhone(null);
        
        expect(result).toBe('-');
      });
    });
  });
