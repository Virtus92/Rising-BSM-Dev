const {
    formatDateSafely,
    formatRelativeTime,
    formatDateWithLabel,
    formatCurrency,
    formatNumber,
    formatPercentage,
    formatFileSize,
    formatPhone,
} = require('../../utils/formatters');

describe('Formatter Utilities', () => {
    describe('formatDateSafely', () => {
        it('should format a valid date', () => {
            expect(formatDateSafely('2024-01-20', 'dd.MM.yyyy')).toBe('20.01.2024');
        });

        it('should return the default value for an invalid date', () => {
            expect(formatDateSafely('invalid-date', 'dd.MM.yyyy')).toBe('Unbekannt');
        });

        it('should return the default value if an error occurs during date formatting', () => {
            expect(formatDateSafely('2024-01-40', 'dd.MM.yyyy')).toBe('Unbekannt');
        });

        it('should return the default value if the date is null or undefined', () => {
            expect(formatDateSafely(null, 'dd.MM.yyyy')).toBe('Unbekannt');
            expect(formatDateSafely(undefined, 'dd.MM.yyyy')).toBe('Unbekannt');
        });

        it('should format a date object', () => {
            const date = new Date(2024, 0, 20); // Month is 0-indexed
            expect(formatDateSafely(date, 'dd.MM.yyyy')).toBe('20.01.2024');
        });
    });

    describe('formatRelativeTime', () => {
        it('should return a relative time string for a valid date', () => {
            const now = new Date();
            const futureDate = new Date(now.getTime() + 60000); // 1 minute in the future
            expect(typeof formatRelativeTime(futureDate)).toBe('string');
        });

        it('should return a relative time string for a past date', () => {
            const now = new Date();
            const pastDate = new Date(now.getTime() - 60000); // 1 minute in the past
            expect(typeof formatRelativeTime(pastDate)).toBe('string');
        });

        it('should return "Ungültiges Datum" for an invalid date', () => {
            expect(formatRelativeTime('invalid-date')).toBe('Ungültiges Datum');
        });

        it('should return "Unbekannt" for an invalid date due to error', () => {
            const invalidDate = new Date('invalid-date');
            const result = formatRelativeTime(invalidDate);
            expect(result).toBe('Ungültiges Datum');
        });

        it('should return "Unbekannt" if the date is null or undefined', () => {
            expect(formatRelativeTime(null)).toBe('Unbekannt');
            expect(formatRelativeTime(undefined)).toBe('Unbekannt');
        });
    });

    describe('formatDateWithLabel', () => {
        it('should return "Heute" label for today\'s date', () => {
            const today = new Date();
            const result = formatDateWithLabel(today.toISOString());
            expect(result.label).toBe('Heute');
            expect(result.class).toBe('primary');
        });

        it('should return "Morgen" label for tomorrow\'s date', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const result = formatDateWithLabel(tomorrow.toISOString());
            expect(result.label).toBe('Morgen');
            expect(result.class).toBe('success');
        });

        it('should return "Gestern" label for yesterday\'s date', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const result = formatDateWithLabel(yesterday.toISOString());
            expect(result.label).toBe('Gestern');
            expect(result.class).toBe('warning');
        });

        it('should format other dates with "dd.MM.yyyy" format', () => {
            expect(formatDateWithLabel('2024-01-20').label).toBe('20.01.2024');
        });

        it('should return "Unbekannt" label for null or undefined date', () => {
            expect(formatDateWithLabel(null).label).toBe('Unbekannt');
            expect(formatDateWithLabel(undefined).label).toBe('Unbekannt');
        });

        it('should handle errors and return a default value', () => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
            const result = formatDateWithLabel(() => { throw new Error('Test error'); });
            expect(result.label).toBe('Unbekannt');
            expect(result.class).toBe('secondary');
            console.error.mockRestore();
        });

        it('should return "Ungültiges Datum" label for invalid date', () => {
            expect(formatDateWithLabel('invalid-date').label).toBe('Ungültiges Datum');
            expect(formatDateWithLabel('invalid-date').class).toBe('danger');
        });
    });

    describe('formatCurrency', () => {
        it('should format a number as currency', () => {
            expect(formatCurrency(1234.56)).toBe('1.234,56 €');
        });

        it('should format a number as currency with a specific currency code', () => {
            expect(formatCurrency(1234.56, 'USD')).toBe('1.234,56 $');
        });

        it('should format zero as currency', () => {
            expect(formatCurrency(0)).toBe('0,00 €');
        });

        it('should return "-" if the amount is null or undefined', () => {
            expect(formatCurrency(null)).toBe('-');
            expect(formatCurrency(undefined)).toBe('-');
        });
    });

    describe('formatNumber', () => {
        it('should format a number with thousand separators and default decimals', () => {
            expect(formatNumber(1234.567)).toBe('1.234,57');
        });

        it('should format a number with a specified number of decimals', () => {
            expect(formatNumber(1234.567, 3)).toBe('1.234,567');
        });

        it('should format zero with default decimals', () => {
            expect(formatNumber(0)).toBe('0,00');
        });

        it('should return "-" if the number is null or undefined', () => {
            expect(formatNumber(null)).toBe('-');
            expect(formatNumber(undefined)).toBe('-');
        });
    });

    describe('formatPercentage', () => {
        it('should format a number as a percentage with default decimals', () => {
            expect(formatPercentage(0.567)).toBe('56,7 %');
        });

        it('should format a number as a percentage with a specified number of decimals', () => {
            expect(formatPercentage(0.567, 2)).toBe('56,70 %');
        });

        it('should format zero as a percentage with default decimals', () => {
            expect(formatPercentage(0)).toBe('0,0 %');
        });

        it('should return "-" if the value is null or undefined', () => {
            expect(formatPercentage(null)).toBe('-');
            expect(formatPercentage(undefined)).toBe('-');
        });
    });

    describe('formatFileSize', () => {
        it('should format bytes to KB', () => {
            expect(formatFileSize(1024)).toBe('1 KB');
        });

        it('should format bytes to MB', () => {
            expect(formatFileSize(1048576)).toBe('1 MB');
        });

        it('should format bytes to GB', () => {
            expect(formatFileSize(1073741824)).toBe('1 GB');
        });

        it('should format bytes less than 1024 to Bytes', () => {
            expect(formatFileSize(512)).toBe('512 Bytes');
        });

        it('should return "0 Bytes" for 0 bytes', () => {
            expect(formatFileSize(0)).toBe('0 Bytes');
        });

        it('should return "-" if the bytes is null or undefined', () => {
            expect(formatFileSize(null)).toBe('-');
            expect(formatFileSize(undefined)).toBe('-');
        });
    });

    describe('formatPhone', () => {
        it('should format a phone number with 4 digits or less', () => {
            expect(formatPhone('1234')).toBe('1234');
        });

        it('should format a phone number with 7 digits or less', () => {
            expect(formatPhone('1234567')).toBe('123 4567');
        });

        it('should format a phone number with 10 digits or less', () => {
            expect(formatPhone('1234567890')).toBe('123 456 7890');
        });

        it('should format a phone number with more than 10 digits', () => {
            expect(formatPhone('123456789012')).toBe('123 456 78 9012');
        });

        it('should remove non-digit characters before formatting', () => {
            expect(formatPhone('+49 (0) 123-4567-89')).toBe('490 123 45 6789');
        });

        it('should return "-" if the number is null or undefined', () => {
            expect(formatPhone(null)).toBe('-');
            expect(formatPhone(undefined)).toBe('-');
        });

        it('should return "-" if the number is an empty string', () => {
            expect(formatPhone('')).toBe('-');
        });
    });

});

describe('Error Handling Tests', () => {
    let consoleErrorSpy;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        // Mock the entire date-fns module to avoid redefining properties
        jest.mock('date-fns', () => {
            const actual = jest.requireActual('date-fns');
            return {
                ...actual,
                format: jest.fn().mockImplementation(() => { throw new Error('Mock format error'); }),
                formatDistanceToNow: jest.fn().mockImplementation(() => { throw new Error('Mock formatDistanceToNow error'); }),
                isToday: jest.fn().mockImplementation(() => { throw new Error('Mock isToday error'); }),
                // ...add other mocks as needed...
            };
        });
        jest.resetModules();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        jest.unmock('date-fns');
        jest.restoreAllMocks();
    });

    describe('formatDateSafely error handling', () => {
        it('should handle errors thrown by date-fns format function', () => {
            const { formatDateSafely } = require('../../utils/formatters');
            const result = formatDateSafely(new Date(), 'yyyy-MM-dd');
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(result).toBe('Unbekannt');
        });
    });

    describe('formatRelativeTime error handling', () => {
        it('should handle errors thrown by date-fns formatDistanceToNow function', () => {
            const { formatRelativeTime } = require('../../utils/formatters');
            const result = formatRelativeTime(new Date());
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(result).toBe('Unbekannt');
        });
    });

    describe('formatDateWithLabel error handling', () => {
        it('should handle errors thrown by date-fns format function in result object', () => {
            const { formatDateWithLabel } = require('../../utils/formatters');
            const result = formatDateWithLabel(new Date());
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(result.label).toBe('Unbekannt');
        });

        it('should handle errors with isToday function', () => {
            const { formatDateWithLabel } = require('../../utils/formatters');
            const result = formatDateWithLabel(new Date());
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(result.label).toBe('Unbekannt');
        });
    });

    describe('formatCurrency error handling', () => {
        it('should handle errors thrown by Intl.NumberFormat', () => {
            const originalNumberFormat = Intl.NumberFormat;
            // Create a Jest mock function for Intl.NumberFormat
            const numberFormatMock = jest.fn().mockImplementation(() => {
                throw new Error('Mock NumberFormat error');
            });
            Intl.NumberFormat = numberFormatMock;
            
            // Clear the require cache to get a fresh import with new mocks
            jest.resetModules();
            
            const { formatCurrency } = require('../../utils/formatters');
            const result = formatCurrency(1000);
            
            expect(numberFormatMock).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(result).toBe('-');
            
            Intl.NumberFormat = originalNumberFormat;
        });

        it('should handle errors thrown by format method', () => {
            const mockFormat = jest.fn().mockImplementation(() => {
                throw new Error('Mock format method error');
            });
            
            const originalNumberFormat = Intl.NumberFormat;
            Intl.NumberFormat = jest.fn().mockImplementation(() => ({
                format: mockFormat
            }));
            
            jest.resetModules();
            
            const { formatCurrency } = require('../../utils/formatters');
            const result = formatCurrency(1000);
            
            expect(Intl.NumberFormat).toHaveBeenCalled();
            expect(mockFormat).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(result).toBe('-');
            
            Intl.NumberFormat = originalNumberFormat;
        });
    });

    describe('formatNumber error handling', () => {
        it('should handle errors thrown by Intl.NumberFormat', () => {
            const originalNumberFormat = Intl.NumberFormat;
            const numberFormatMock = jest.fn().mockImplementation(() => {
                throw new Error('Mock NumberFormat error');
            });
            Intl.NumberFormat = numberFormatMock;
            
            jest.resetModules();
            
            const { formatNumber } = require('../../utils/formatters');
            const result = formatNumber(1000);
            
            expect(numberFormatMock).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(result).toBe('-');
            
            Intl.NumberFormat = originalNumberFormat;
        });
    });

    describe('formatPercentage error handling', () => {
        it('should handle errors thrown by Intl.NumberFormat', () => {
            const originalNumberFormat = Intl.NumberFormat;
            const numberFormatMock = jest.fn().mockImplementation(() => {
                throw new Error('Mock NumberFormat error');
            });
            Intl.NumberFormat = numberFormatMock;
            
            jest.resetModules();
            
            const { formatPercentage } = require('../../utils/formatters');
            const result = formatPercentage(0.5);
            
            expect(numberFormatMock).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(result).toBe('-');
            
            Intl.NumberFormat = originalNumberFormat;
        });
    });

    describe('formatFileSize error handling', () => {
        it('should handle errors thrown by Math functions', () => {
            const originalMathLog = Math.log;
            const mathLogMock = jest.fn().mockImplementation(() => {
                throw new Error('Mock Math.log error');
            });
            Math.log = mathLogMock;
            
            jest.resetModules();
            
            const { formatFileSize } = require('../../utils/formatters');
            const result = formatFileSize(1024);
            
            expect(mathLogMock).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(result).toBe('-');
            
            Math.log = originalMathLog;
        });
    });

    describe('formatPhone error handling', () => {
        it('should handle errors thrown by replace method', () => {
            const originalReplace = String.prototype.replace;
            const replaceMock = jest.fn().mockImplementation(() => {
                throw new Error('Mock replace error');
            });
            String.prototype.replace = replaceMock;
            
            jest.resetModules();
            
            const { formatPhone } = require('../../utils/formatters');
            const result = formatPhone('1234567890');
            
            expect(replaceMock).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(result).toBe('1234567890');
            
            String.prototype.replace = originalReplace;
        });
    });
});