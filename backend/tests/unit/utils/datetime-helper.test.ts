import { jest } from '@jest/globals';
import { DateTimeHelper } from '../../../src/utils/datetime-helper';

describe('DateTimeHelper', () => {
  describe('formatDate', () => {
    it('should return empty string for null or undefined', () => {
      // Act & Assert
      expect(DateTimeHelper.formatDate(null)).toBe('');
      expect(DateTimeHelper.formatDate(undefined)).toBe('');
    });

    it('should format date as yyyy-MM-dd by default', () => {
      // Arrange
      const date = new Date('2023-05-15T14:30:00Z');

      // Act
      const result = DateTimeHelper.formatDate(date);

      // Assert
      expect(result).toBe('2023-05-15');
    });

    it('should format date as dd.MM.yyyy', () => {
      // Arrange
      const date = new Date('2023-05-15T14:30:00Z');

      // Act
      const result = DateTimeHelper.formatDate(date, 'dd.MM.yyyy');

      // Assert
      expect(result).toBe('15.05.2023');
    });

    it('should format date as yyyy-MM-dd HH:mm', () => {
      // Arrange
      const date = new Date('2023-05-15T14:30:00Z');

      // Act
      const result = DateTimeHelper.formatDate(date, 'yyyy-MM-dd HH:mm');

      // Assert
      // Note: The exact result will depend on the timezone where the test is run
      // This test might need adjustment based on your environment
      expect(result).toMatch(/^2023-05-15 \d{2}:\d{2}$/);
    });

    it('should format date as dd.MM.yyyy HH:mm', () => {
      // Arrange
      const date = new Date('2023-05-15T14:30:00Z');

      // Act
      const result = DateTimeHelper.formatDate(date, 'dd.MM.yyyy HH:mm');

      // Assert
      // Note: The exact result will depend on the timezone where the test is run
      expect(result).toMatch(/^15.05.2023 \d{2}:\d{2}$/);
    });

    it('should format date as ISO', () => {
      // Arrange
      const date = new Date('2023-05-15T14:30:00Z');

      // Act
      const result = DateTimeHelper.formatDate(date, 'ISO');

      // Assert
      expect(result).toBe('2023-05-15T14:30:00.000Z');
    });

    it('should handle string dates', () => {
      // Arrange
      const dateString = '2023-05-15T14:30:00Z';

      // Act
      const result = DateTimeHelper.formatDate(dateString);

      // Assert
      expect(result).toBe('2023-05-15');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      // Mock Date.now() to avoid timing issues in tests
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-01-01T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return empty string for null or undefined', () => {
      // Act & Assert
      expect(DateTimeHelper.formatRelativeTime(null)).toBe('');
      expect(DateTimeHelper.formatRelativeTime(undefined)).toBe('');
    });

    it('should format as "just now" for less than a minute ago', () => {
      // Arrange
      const date = new Date('2023-01-01T11:59:30Z'); // 30 seconds ago

      // Act
      const result = DateTimeHelper.formatRelativeTime(date);

      // Assert
      expect(result).toBe('just now');
    });

    it('should format as "X minutes ago" for less than an hour ago', () => {
      // Arrange
      const date1 = new Date('2023-01-01T11:45:00Z'); // 15 minutes ago
      const date2 = new Date('2023-01-01T11:58:00Z'); // 2 minutes ago

      // Act
      const result1 = DateTimeHelper.formatRelativeTime(date1);
      const result2 = DateTimeHelper.formatRelativeTime(date2);

      // Assert
      expect(result1).toBe('15 minutes ago');
      expect(result2).toBe('2 minutes ago');
    });

    it('should format as "X hours ago" for less than a day ago', () => {
      // Arrange
      const date1 = new Date('2023-01-01T08:00:00Z'); // 4 hours ago
      const date2 = new Date('2023-01-01T11:00:00Z'); // 1 hour ago

      // Act
      const result1 = DateTimeHelper.formatRelativeTime(date1);
      const result2 = DateTimeHelper.formatRelativeTime(date2);

      // Assert
      expect(result1).toBe('4 hours ago');
      expect(result2).toBe('1 hour ago');
    });

    it('should format as "X days ago" for more than a day ago', () => {
      // Arrange
      const date1 = new Date('2022-12-30T12:00:00Z'); // 2 days ago
      const date2 = new Date('2022-12-31T12:00:00Z'); // 1 day ago

      // Act
      const result1 = DateTimeHelper.formatRelativeTime(date1);
      const result2 = DateTimeHelper.formatRelativeTime(date2);

      // Assert
      expect(result1).toBe('2 days ago');
      expect(result2).toBe('1 day ago');
    });

    it('should handle string dates', () => {
      // Arrange
      const dateString = '2023-01-01T11:45:00Z'; // 15 minutes ago

      // Act
      const result = DateTimeHelper.formatRelativeTime(dateString);

      // Assert
      expect(result).toBe('15 minutes ago');
    });
  });

  describe('formatDuration', () => {
    beforeEach(() => {
      // Mock Date.now() to avoid timing issues in tests
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-01-01T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return empty string for null or undefined', () => {
      // Act & Assert
      expect(DateTimeHelper.formatDuration(null)).toBe('');
      expect(DateTimeHelper.formatDuration(undefined)).toBe('');
    });

    it('should return "past date" for dates in the past', () => {
      // Arrange
      const date = new Date('2022-12-31T12:00:00Z'); // 1 day ago

      // Act
      const result = DateTimeHelper.formatDuration(date);

      // Assert
      expect(result).toBe('past date');
    });

    it('should format as "X minutes" for less than an hour in the future', () => {
      // Arrange
      const date1 = new Date('2023-01-01T12:15:00Z'); // 15 minutes in the future
      const date2 = new Date('2023-01-01T12:01:00Z'); // 1 minute in the future

      // Act
      const result1 = DateTimeHelper.formatDuration(date1);
      const result2 = DateTimeHelper.formatDuration(date2);

      // Assert
      expect(result1).toBe('15 minutes');
      expect(result2).toBe('1 minute');
    });

    it('should format as "X hours" for less than a day in the future', () => {
      // Arrange
      const date1 = new Date('2023-01-01T16:00:00Z'); // 4 hours in the future
      const date2 = new Date('2023-01-01T13:00:00Z'); // 1 hour in the future

      // Act
      const result1 = DateTimeHelper.formatDuration(date1);
      const result2 = DateTimeHelper.formatDuration(date2);

      // Assert
      expect(result1).toBe('4 hours');
      expect(result2).toBe('1 hour');
    });

    it('should format as "X days" for more than a day in the future', () => {
      // Arrange
      const date1 = new Date('2023-01-03T12:00:00Z'); // 2 days in the future
      const date2 = new Date('2023-01-02T12:00:00Z'); // 1 day in the future

      // Act
      const result1 = DateTimeHelper.formatDuration(date1);
      const result2 = DateTimeHelper.formatDuration(date2);

      // Assert
      expect(result1).toBe('2 days');
      expect(result2).toBe('1 day');
    });

    it('should handle string dates', () => {
      // Arrange
      const dateString = '2023-01-01T13:00:00Z'; // 1 hour in the future

      // Act
      const result = DateTimeHelper.formatDuration(dateString);

      // Assert
      expect(result).toBe('1 hour');
    });
  });

  describe('startOfDay', () => {
    it('should set time to start of day', () => {
      // Arrange
      const date = new Date('2023-05-15T14:30:45.123Z');

      // Act
      const result = DateTimeHelper.startOfDay(date);

      // Assert
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(4); // May is month 4 (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    it('should use current date if no date provided', () => {
      // Arrange
      const realDate = Date;
      const mockDate = new Date('2023-05-15T14:30:45.123Z');
      global.Date = class extends Date {
        constructor() {
          super();
          return mockDate;
        }
      } as any;

      // Act
      const result = DateTimeHelper.startOfDay();

      // Assert
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(4);
      expect(result.getDate()).toBe(15);

      // Cleanup
      global.Date = realDate;
    });
  });

  describe('endOfDay', () => {
    it('should set time to end of day', () => {
      // Arrange
      const date = new Date('2023-05-15T14:30:45.123Z');

      // Act
      const result = DateTimeHelper.endOfDay(date);

      // Assert
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(4);
      expect(result.getDate()).toBe(15);
    });

    it('should use current date if no date provided', () => {
      // Arrange
      const realDate = Date;
      const mockDate = new Date('2023-05-15T14:30:45.123Z');
      global.Date = class extends Date {
        constructor() {
          super();
          return mockDate;
        }
      } as any;

      // Act
      const result = DateTimeHelper.endOfDay();

      // Assert
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(4);
      expect(result.getDate()).toBe(15);

      // Cleanup
      global.Date = realDate;
    });
  });

  describe('startOfMonth', () => {
    it('should set date to start of month', () => {
      // Arrange
      const date = new Date('2023-05-15T14:30:45.123Z');

      // Act
      const result = DateTimeHelper.startOfMonth(date);

      // Assert
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(4);
    });
  });

  describe('endOfMonth', () => {
    it('should set date to end of month for 31-day month', () => {
      // Arrange
      const date = new Date('2023-05-15T14:30:45.123Z'); // May has 31 days

      // Act
      const result = DateTimeHelper.endOfMonth(date);

      // Assert
      expect(result.getDate()).toBe(31);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(4);
    });

    it('should set date to end of month for 30-day month', () => {
      // Arrange
      const date = new Date('2023-04-15T14:30:45.123Z'); // April has 30 days

      // Act
      const result = DateTimeHelper.endOfMonth(date);

      // Assert
      expect(result.getDate()).toBe(30);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(3); // April is month 3 (0-indexed)
    });

    it('should set date to end of month for February in a non-leap year', () => {
      // Arrange
      const date = new Date('2023-02-15T14:30:45.123Z'); // February 2023 has 28 days (non-leap year)

      // Act
      const result = DateTimeHelper.endOfMonth(date);

      // Assert
      expect(result.getDate()).toBe(28);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(1); // February is month 1 (0-indexed)
    });

    it('should set date to end of month for February in a leap year', () => {
      // Arrange
      const date = new Date('2024-02-15T14:30:45.123Z'); // February 2024 has 29 days (leap year)

      // Act
      const result = DateTimeHelper.endOfMonth(date);

      // Assert
      expect(result.getDate()).toBe(29);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // February is month 1 (0-indexed)
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with default locale and currency (EUR)', () => {
      // Arrange
      const amount = 1234.56;
      
      // Mock Intl.NumberFormat
      const originalNumberFormat = Intl.NumberFormat;
      const mockFormat = jest.fn().mockReturnValue('1.234,56 €');
      global.Intl.NumberFormat = jest.fn().mockImplementation(() => ({
        format: mockFormat
      })) as any;

      // Act
      const result = DateTimeHelper.formatCurrency(amount);

      // Assert
      expect(Intl.NumberFormat).toHaveBeenCalledWith('de-DE', {
        style: 'currency',
        currency: 'EUR'
      });
      expect(mockFormat).toHaveBeenCalledWith(amount);
      expect(result).toBe('1.234,56 €');

      // Cleanup
      global.Intl.NumberFormat = originalNumberFormat;
    });

    it('should format currency with custom locale and currency', () => {
      // Arrange
      const amount = 1234.56;
      const locale = 'en-US';
      const currency = 'USD';
      
      // Mock Intl.NumberFormat
      const originalNumberFormat = Intl.NumberFormat;
      const mockFormat = jest.fn().mockReturnValue('$1,234.56');
      global.Intl.NumberFormat = jest.fn().mockImplementation(() => ({
        format: mockFormat
      })) as any;

      // Act
      const result = DateTimeHelper.formatCurrency(amount, locale, currency);

      // Assert
      expect(Intl.NumberFormat).toHaveBeenCalledWith(locale, {
        style: 'currency',
        currency
      });
      expect(mockFormat).toHaveBeenCalledWith(amount);
      expect(result).toBe('$1,234.56');

      // Cleanup
      global.Intl.NumberFormat = originalNumberFormat;
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with default locale and 2 decimal places', () => {
      // Arrange
      const value = 75.5; // 75.5%
      
      // Mock Intl.NumberFormat
      const originalNumberFormat = Intl.NumberFormat;
      const mockFormat = jest.fn().mockReturnValue('75,50 %');
      global.Intl.NumberFormat = jest.fn().mockImplementation(() => ({
        format: mockFormat
      })) as any;

      // Act
      const result = DateTimeHelper.formatPercentage(value);

      // Assert
      expect(Intl.NumberFormat).toHaveBeenCalledWith('de-DE', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      expect(mockFormat).toHaveBeenCalledWith(value / 100);
      expect(result).toBe('75,50 %');

      // Cleanup
      global.Intl.NumberFormat = originalNumberFormat;
    });

    it('should format percentage with custom locale and decimal places', () => {
      // Arrange
      const value = 75.5; // 75.5%
      const locale = 'en-US';
      const digits = 1;
      
      // Mock Intl.NumberFormat
      const originalNumberFormat = Intl.NumberFormat;
      const mockFormat = jest.fn().mockReturnValue('75.5%');
      global.Intl.NumberFormat = jest.fn().mockImplementation(() => ({
        format: mockFormat
      })) as any;

      // Act
      const result = DateTimeHelper.formatPercentage(value, locale, digits);

      // Assert
      expect(Intl.NumberFormat).toHaveBeenCalledWith(locale, {
        style: 'percent',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      });
      expect(mockFormat).toHaveBeenCalledWith(value / 100);
      expect(result).toBe('75.5%');

      // Cleanup
      global.Intl.NumberFormat = originalNumberFormat;
    });
  });
});
