const formatters = require('../../utils/formatters');
const { format, formatDistanceToNow, isToday, isTomorrow } = require('date-fns');
const { de } = require('date-fns/locale');

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn(),
  formatDistanceToNow: jest.fn(),
  isToday: jest.fn(),
  isTomorrow: jest.fn()
}));

jest.mock('date-fns/locale', () => ({
  de: 'de-locale-mock'
}));

describe('formatDateSafely', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    format.mockImplementation((date, formatString) => `Formatted: ${formatString}`);
  });

  test('formats valid date correctly', () => {
    const result = formatters.formatDateSafely('2023-01-01', 'dd.MM.yyyy');
    expect(format).toHaveBeenCalledWith(expect.any(Date), 'dd.MM.yyyy', { locale: 'de-locale-mock' });
    expect(result).toBe('Formatted: dd.MM.yyyy');
  });

  test('returns default value for invalid date', () => {
    const result = formatters.formatDateSafely('invalid-date', 'dd.MM.yyyy');
    expect(result).toBe('Unbekannt');
  });

  test('returns custom default value when provided', () => {
    const result = formatters.formatDateSafely(null, 'dd.MM.yyyy', 'Custom Default');
    expect(result).toBe('Custom Default');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    formatDistanceToNow.mockReturnValue('2 days ago');
  });

  test('formats valid date as relative time', () => {
    const result = formatters.formatRelativeTime('2023-01-01');
    expect(formatDistanceToNow).toHaveBeenCalledWith(expect.any(Date), { 
      addSuffix: true, 
      locale: 'de-locale-mock' 
    });
    expect(result).toBe('2 days ago');
  });

  test('returns error message for invalid date', () => {
    const result = formatters.formatRelativeTime('invalid-date');
    expect(result).toBe('Ungültiges Datum');
  });

  test('returns unknown for null date', () => {
    const result = formatters.formatRelativeTime(null);
    expect(result).toBe('Unbekannt');
  });
});

describe('formatDateWithLabel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isToday.mockReturnValue(false);
    isTomorrow.mockReturnValue(false);
    format.mockImplementation((date, formatString) => `Formatted: ${formatString}`);
  });

  test('formats regular date correctly', () => {
    const result = formatters.formatDateWithLabel('2023-01-01');
    expect(result).toEqual({
      label: 'Formatted: dd.MM.yyyy',
      fullDate: 'Formatted: dd.MM.yyyy',
      class: 'secondary'
    });
  });

  test('formats today with special label', () => {
    isToday.mockReturnValue(true);
    
    const result = formatters.formatDateWithLabel('2023-01-01');
    expect(result).toEqual({
      label: 'Heute',
      fullDate: 'Formatted: dd.MM.yyyy',
      class: 'primary'
    });
  });

  test('formats tomorrow with special label', () => {
    isTomorrow.mockReturnValue(true);
    
    const result = formatters.formatDateWithLabel('2023-01-01');
    expect(result).toEqual({
      label: 'Morgen',
      fullDate: 'Formatted: dd.MM.yyyy',
      class: 'success'
    });
  });

  test('handles invalid date', () => {
    const result = formatters.formatDateWithLabel('invalid-date');
    expect(result).toEqual({
      label: 'Ungültiges Datum',
      class: 'danger'
    });
  });
});

describe('formatCurrency', () => {
  test('formats currency amount correctly', () => {
    // Mock Intl.NumberFormat
    const mockFormat = jest.fn().mockReturnValue('€1.234,56');
    global.Intl.NumberFormat = jest.fn().mockImplementation(() => ({
      format: mockFormat
    }));
    
    const result = formatters.formatCurrency(1234.56);
    
    expect(global.Intl.NumberFormat).toHaveBeenCalledWith('de-DE', {
      style: 'currency',
      currency: 'EUR'
    });
    expect(mockFormat).toHaveBeenCalledWith(1234.56);
    expect(result).toBe('€1.234,56');
  });

  test('handles null/undefined values', () => {
    expect(formatters.formatCurrency(null)).toBe('-');
    expect(formatters.formatCurrency(undefined)).toBe('-');
  });

  test('formats currency value correctly', () => {
    const mockFormat = jest.fn().mockReturnValue('1.234,56 €');
    global.Intl.NumberFormat = jest.fn().mockImplementation(() => ({
      format: mockFormat
    }));
    
    const result = formatters.formatCurrency(1234.56);
    
    expect(global.Intl.NumberFormat).toHaveBeenCalledWith('de-DE', {
      style: 'currency',
      currency: 'EUR'
    });
    expect(result).toBe('1.234,56 €');
  });
  
  test('handles zero and invalid values', () => {
    const mockFormat = jest.fn().mockReturnValue('0,00 €');
    global.Intl.NumberFormat = jest.fn().mockImplementation(() => ({
      format: mockFormat
    }));
    
    expect(formatters.formatCurrency(0)).toBe('0,00 €');
    expect(formatters.formatCurrency(null)).toBe('-');
    expect(formatters.formatCurrency(undefined)).toBe('-');
  });
});

describe('formatNumber', () => {
  beforeEach(() => {
    // Mock Intl.NumberFormat
    const mockFormat = jest.fn().mockReturnValue('1.234,56');
    global.Intl.NumberFormat = jest.fn().mockImplementation(() => ({
      format: mockFormat
    }));
  });

  test('formats number with correct decimals', () => {
    const result = formatters.formatNumber(1234.56);
    
    expect(global.Intl.NumberFormat).toHaveBeenCalledWith('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    expect(result).toBe('1.234,56');
  });

  test('uses custom decimal places', () => {
    const mockFormat = jest.fn().mockReturnValue('1.234,6');
    global.Intl.NumberFormat = jest.fn().mockImplementation(() => ({
      format: mockFormat
    }));
    
    formatters.formatNumber(1234.56, 1);
    
    expect(global.Intl.NumberFormat).toHaveBeenCalledWith('de-DE', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
  });
});

describe('formatFileSize', () => {
  test('formats file size with appropriate unit', () => {
    expect(formatters.formatFileSize(0)).toBe('0 Bytes');
    expect(formatters.formatFileSize(1024)).toBe('1 KB');
    expect(formatters.formatFileSize(1048576)).toBe('1 MB');
    expect(formatters.formatFileSize(1073741824)).toBe('1 GB');
    expect(formatters.formatFileSize(1099511627776)).toBe('1 TB');
  });

  test('handles decimal precision', () => {
    expect(formatters.formatFileSize(1500)).toMatch(/^1\.46\d* KB$/);
  });

  test('handles null/undefined', () => {
    expect(formatters.formatFileSize(null)).toBe('-');
    expect(formatters.formatFileSize(undefined)).toBe('-');
  });
});

describe('formatPhone', () => {
  test('formatiert leere oder ungültige Eingaben', () => {
    expect(formatters.formatPhone('')).toBe('-');
    expect(formatters.formatPhone(null)).toBe('-');
    expect(formatters.formatPhone(undefined)).toBe('-');
    expect(formatters.formatPhone('abc')).toBe('-');
    expect(formatters.formatPhone('   ')).toBe('-');
  });

  test('formatiert internationale Nummern korrekt', () => {
    expect(formatters.formatPhone('+49123456789')).toBe('49 123 456 789');
    expect(formatters.formatPhone('0049123456789')).toBe('49 123 456 789');
    expect(formatters.formatPhone('+1415')).toBe('14 15');
    expect(formatters.formatPhone('+44 20 1234 5678')).toBe('44 201 234 567 8');
  });

  test('formatiert nationale Nummern korrekt', () => {
    expect(formatters.formatPhone('07211234567')).toBe('0721 123 456 7');
    expect(formatters.formatPhone('06221987654')).toBe('0622 198 765 4');
    expect(formatters.formatPhone('0123456')).toBe('0123 456');
  });

  test('bereinigt Sonderzeichen korrekt', () => {
    expect(formatters.formatPhone('+49 (123) 456-789')).toBe('49 123 456 789');
    expect(formatters.formatPhone('0721 / 123.456-7')).toBe('0721 123 456 7');
  });
});

describe('formatDate', () => {
  test('formats date in German format', () => {
    const mockFormat = jest.fn().mockReturnValue('01.02.2023');
    global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
      format: mockFormat
    }));
    
    const date = new Date('2023-02-01T12:00:00Z');
    const result = formatters.formatDate(date);
    
    expect(global.Intl.DateTimeFormat).toHaveBeenCalledWith('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    expect(result).toBe('01.02.2023');
  });
  
  test('handles invalid date input', () => {
    expect(formatters.formatDate(null)).toBe('-');
    expect(formatters.formatDate('not-a-date')).toBe('-');
  });
});

describe('formatTime', () => {
  test('formats time correctly', () => {
    const mockFormat = jest.fn().mockReturnValue('14:30');
    global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
      format: mockFormat
    }));
    
    const date = new Date('2023-02-01T14:30:00Z');
    const result = formatters.formatTime(date);
    
    expect(global.Intl.DateTimeFormat).toHaveBeenCalledWith('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
    expect(result).toBe('14:30');
  });
});
