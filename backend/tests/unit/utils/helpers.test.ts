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
import { cache } from '../../../services/cache.service';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock cache service
jest.mock('../../../services/cache.service', () => ({
  cache: {
    getOrExecute: jest.fn(),
    get: jest.fn(),
    set: jest.fn()
  }
}));

// Mock Prisma
import { prismaMock } from '../../mocks/prisma.mock';

jest.mock('../../../utils/prisma.utils', () => ({
  prisma: prismaMock
}));

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
    
    test('should fetch notifications from cache for authenticated user', async () => {
      const mockNotifications = {
        items: [{ id: 1, title: 'Test' }],
        unreadCount: 2,
        totalCount: 5
      };
      
      (cache.getOrExecute as jest.Mock).mockImplementation(() => Promise.resolve(mockNotifications));
      
      const result = await getNotifications({
        session: { user: { id: 1 } }
      });
      
      expect(cache.getOrExecute).toHaveBeenCalled();
      expect(result).toEqual(mockNotifications);
    });
  });
  
  describe('getNewRequestsCount', () => {
    test('should return count of new requests', async () => {
      (cache.getOrExecute as jest.Mock).mockImplementation((key, fn) => {
        if (typeof fn === 'function') {
          return fn();
        }
        return null;
      });
      
      (prisma.contactRequest.count as jest.Mock).mockImplementation(() => Promise.resolve(5));
      
      const count = await getNewRequestsCount();
      
      expect(prisma.contactRequest.count).toHaveBeenCalledWith({
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
      
      expect(truncated).toHaveLength(13); // 10 chars + '...'
      // Fix this expectation to match actual implementation
      expect(truncated).toBe('This is a ...');
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