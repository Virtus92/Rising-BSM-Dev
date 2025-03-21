import {
  getAnfrageStatusInfo,
  getTerminStatusInfo,
  getProjektStatusInfo,
  getBenutzerStatusInfo,
  generateId,
  getNotifications,
  getNewRequestsCount,
  parseFilters,
  sanitizeLikeString,
  truncateHtml,
  groupBy
} from '../../../utils/helpers';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { createTypedMock } from '../../mocks/jest-utils';

// Mock cache service
jest.mock('../../../services/cache.service', () => ({
  cache: {
    getOrExecute: jest.fn(),
    get: jest.fn(),
    set: jest.fn()
  }
}));

// Mock Prisma with direct object instead of importing prismaMock
jest.mock('../../../utils/prisma.utils', () => {
  const countMock = jest.fn();
  return {
    prisma: {
      contactRequest: {
        count: countMock
      }
    },
    __esModule: true,
    default: {
      contactRequest: {
        count: countMock
      }
    }
  };
});

// Create mock implementations for Prisma methods with proper typing
const mockContactRequestCount = createTypedMock<number>();
mockContactRequestCount.mockResolvedValue(5);

// Get the mocked module and replace with our typed mock
const { prisma } = require('../../../utils/prisma.utils');
prisma.contactRequest.count = mockContactRequestCount;

describe('Helper Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('status info helpers', () => {
    test('getAnfrageStatusInfo should return correct status info', () => {
      expect(getAnfrageStatusInfo('neu')).toEqual({
        label: 'Neu',
        className: 'warning'
      });
      
      expect(getAnfrageStatusInfo('beantwortet')).toEqual({
        label: 'Beantwortet',
        className: 'success'
      });
      
      expect(getAnfrageStatusInfo('unknown')).toEqual({
        label: 'Unbekannt',
        className: 'secondary'
      });
    });
    
    test('getTerminStatusInfo should return correct status info', () => {
      expect(getTerminStatusInfo('geplant')).toEqual({
        label: 'Geplant',
        className: 'warning'
      });
      
      expect(getTerminStatusInfo('bestaetigt')).toEqual({
        label: 'Bestätigt',
        className: 'success'
      });
    });
    
    test('getProjektStatusInfo should return correct status info', () => {
      expect(getProjektStatusInfo('neu')).toEqual({
        label: 'Neu',
        className: 'info'
      });
      
      expect(getProjektStatusInfo('abgeschlossen')).toEqual({
        label: 'Abgeschlossen',
        className: 'success'
      });
    });
    
    test('getBenutzerStatusInfo should return correct status info', () => {
      expect(getBenutzerStatusInfo('aktiv')).toEqual({
        label: 'Aktiv',
        className: 'success'
      });
      
      expect(getBenutzerStatusInfo('gesperrt')).toEqual({
        label: 'Gesperrt',
        className: 'danger'
      });
    });
  });
  
  describe('generateId', () => {
    test('should generate random ID with specified length', () => {
      const id = generateId(10);
      
      expect(id).toHaveLength(10);
      expect(typeof id).toBe('string');
    });
    
    test('should generate ID with default length if not specified', () => {
      const id = generateId();
      
      expect(id).toHaveLength(8);
    });
  });
  
  describe('getNotifications', () => {
    test('should return empty result for unauthenticated user', async () => {
      const result = await getNotifications({});
      
      expect(result).toEqual({
        items: [],
        unreadCount: 0,
        totalCount: 0
      });
    });
  });
  
  describe('getNewRequestsCount', () => {
    test('should return count of new requests', async () => {
      const mockExecuteFn = jest.fn().mockImplementation((key, fn) => {
        if (typeof fn === 'function') {
          return fn();
        }
        return null;
      });
      
      // Set up the mock implementation for getOrExecute
      const { cache } = require('../../../services/cache.service');
      cache.getOrExecute.mockImplementation(mockExecuteFn);
      
      const count = await getNewRequestsCount();
      
      expect(mockContactRequestCount).toHaveBeenCalledWith({
        where: { status: 'neu' }
      });
      expect(count).toBe(5);
    });
  });
  
  describe('parseFilters', () => {
    test('should parse and merge filter options', () => {
      const query = {
        page: '2',
        limit: '10',
        sort: 'name:desc',
        start_date: '2023-01-01',
        end_date: '2023-01-31',
        search: 'test query',
        status: 'active'
      };
      
      const defaults = {
        status: 'all'
      };
      
      const result = parseFilters(query, defaults);
      
      expect(result).toEqual({
        page: 2,
        limit: 10,
        sort: {
          field: 'name',
          direction: 'DESC'
        },
        start_date: expect.any(Date),
        end_date: expect.any(Date),
        search: 'test query',
        status: 'active'
      });
    });
    
    test('should use default end_date if only start_date provided', () => {
      const query = {
        start_date: '2023-01-01'
      };
      
      const result = parseFilters(query);
      
      expect(result.start_date).toBeInstanceOf(Date);
      expect(result.end_date).toBeInstanceOf(Date);
      // End date should be today
      const today = new Date();
      expect(result.end_date?.getDate()).toBe(today.getDate());
    });
  });
  
  describe('sanitizeLikeString', () => {
    test('should escape special characters for SQL LIKE', () => {
      expect(sanitizeLikeString('test%_value')).toBe('test\\%\\_value');
    });
    
    test('should handle null or undefined input', () => {
      expect(sanitizeLikeString(null)).toBe('');
      expect(sanitizeLikeString(undefined)).toBe('');
    });
  });
  
  describe('truncateHtml', () => {
    test('should truncate string to specified length', () => {
      const longString = 'This is a very long string that should be truncated';
      const truncated = truncateHtml(longString, 10);
      
      // Verify it truncates appropriately
      expect(truncated.length).toBeLessThan(longString.length);
      expect(truncated).toContain('...');
    });
    
    test('should not truncate strings shorter than maxLength', () => {
      const shortString = 'Short';
      const result = truncateHtml(shortString, 10);
      
      expect(result).toBe(shortString);
    });
    
    test('should handle null or undefined input', () => {
      expect(truncateHtml(null, 10)).toBe('');
      expect(truncateHtml(undefined, 10)).toBe('');
    });
  });
  
  describe('groupBy', () => {
    test('should group array items by specified key', () => {
      const items = [
        { category: 'A', name: 'Item 1' },
        { category: 'B', name: 'Item 2' },
        { category: 'A', name: 'Item 3' },
        { category: 'C', name: 'Item 4' },
        { category: 'B', name: 'Item 5' }
      ];
      
      const grouped = groupBy(items, 'category');
      
      expect(Object.keys(grouped)).toEqual(['A', 'B', 'C']);
      expect(grouped.A).toHaveLength(2);
      expect(grouped.B).toHaveLength(2);
      expect(grouped.C).toHaveLength(1);
    });
  });
});