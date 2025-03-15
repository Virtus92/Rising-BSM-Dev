const helpers = require('../../utils/helpers');
const cache = require('../../services/cache.service');
const db = require('../../services/db.service');

// Mock the dependencies
jest.mock('../../services/cache.service', () => ({
  getOrExecute: jest.fn()
}));

jest.mock('../../services/db.service', () => ({
  query: jest.fn()
}));

describe('Status Info Functions', () => {
  test('getAnfrageStatusInfo returns correct status information', () => {
    const newStatus = helpers.getAnfrageStatusInfo('neu');
    expect(newStatus).toEqual({ label: 'Neu', className: 'warning' });
    
    const unknownStatus = helpers.getAnfrageStatusInfo('unknown_status');
    expect(unknownStatus).toEqual({ label: 'Unbekannt', className: 'secondary' });
  });

  test('getTerminStatusInfo returns correct status information', () => {
    const plannedStatus = helpers.getTerminStatusInfo('geplant');
    expect(plannedStatus).toEqual({ label: 'Geplant', className: 'warning' });
    
    const confirmedStatus = helpers.getTerminStatusInfo('bestaetigt');
    expect(confirmedStatus).toEqual({ label: 'Bestätigt', className: 'success' });
  });

  test('getProjektStatusInfo returns correct status information', () => {
    const newProject = helpers.getProjektStatusInfo('neu');
    expect(newProject).toEqual({ label: 'Neu', className: 'info' });
    
    const inProgress = helpers.getProjektStatusInfo('in_bearbeitung');
    expect(inProgress).toEqual({ label: 'In Bearbeitung', className: 'primary' });
  });
});

describe('generateId', () => {
  test('generates id with correct length', () => {
    const id = helpers.generateId(10);
    expect(id.length).toBe(10);
    
    const defaultId = helpers.generateId();
    expect(defaultId.length).toBe(8);
  });

  test('generates different ids on each call', () => {
    const id1 = helpers.generateId();
    const id2 = helpers.generateId();
    expect(id1).not.toBe(id2);
  });
});

describe('getNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns empty notifications when no user session', async () => {
    const req = { session: null };
    const result = await helpers.getNotifications(req);
    
    expect(result).toEqual({ items: [], unreadCount: 0, totalCount: 0 });
    expect(cache.getOrExecute).not.toHaveBeenCalled();
  });

  test('fetches notifications from cache', async () => {
    const mockNotifications = {
      items: [{ id: 1, title: 'Test Notification' }],
      unreadCount: 5,
      totalCount: 10
    };
    
    cache.getOrExecute.mockResolvedValue(mockNotifications);
    
    const req = { session: { user: { id: 123 } } };
    const result = await helpers.getNotifications(req);
    
    expect(result).toEqual(mockNotifications);
    expect(cache.getOrExecute).toHaveBeenCalledWith(
      'notifications_123',
      expect.any(Function),
      30
    );
  });
});

describe('getNewRequestsCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns count from cache', async () => {
    cache.getOrExecute.mockResolvedValue(10);
    
    const count = await helpers.getNewRequestsCount();
    expect(count).toBe(10);
    expect(cache.getOrExecute).toHaveBeenCalledWith(
      'new_requests_count',
      expect.any(Function),
      60
    );
  });

  test('returns 0 on error', async () => {
    cache.getOrExecute.mockRejectedValue(new Error('Test error'));
    
    const count = await helpers.getNewRequestsCount();
    expect(count).toBe(0);
  });
});

describe('parseFilters', () => {
  test('parses query parameters into filters', () => {
    const query = {
      page: '2',
      limit: '10',
      sort: 'name:desc',
      start_date: '2023-01-01',
      end_date: '2023-01-31',
      search: ' searchTerm ',
      status: 'active',
      type: 'project'
    };
    
    const filters = helpers.parseFilters(query);
    
    expect(filters.page).toBe(2);
    expect(filters.limit).toBe(10);
    expect(filters.sort).toEqual({ field: 'name', direction: 'DESC' });
    expect(filters.start_date).toBeInstanceOf(Date);
    expect(filters.end_date).toBeInstanceOf(Date);
    expect(filters.search).toBe('searchTerm');
    expect(filters.status).toBe('active');
    expect(filters.type).toBe('project');
  });

  test('applies default values', () => {
    const query = {};
    const defaults = { status: 'new' };
    
    const filters = helpers.parseFilters(query, defaults);
    
    expect(filters.page).toBe(1);
    expect(filters.limit).toBe(20);
    expect(filters.status).toBe('new');
  });
});

describe('sanitizeLikeString', () => {
  test('escapes special characters for SQL LIKE', () => {
    const result = helpers.sanitizeLikeString('test%_test');
    expect(result).toBe('test\\%\\_test');
  });

  test('handles empty input', () => {
    expect(helpers.sanitizeLikeString('')).toBe('');
    expect(helpers.sanitizeLikeString(null)).toBe('');
    expect(helpers.sanitizeLikeString(undefined)).toBe('');
  });
});

describe('groupBy', () => {
  test('groups array items by key', () => {
    const items = [
      { id: 1, category: 'A', name: 'Item 1' },
      { id: 2, category: 'B', name: 'Item 2' },
      { id: 3, category: 'A', name: 'Item 3' },
      { id: 4, category: 'C', name: 'Item 4' },
      { id: 5, category: 'B', name: 'Item 5' }
    ];
    
    const result = helpers.groupBy(items, 'category');
    
    expect(Object.keys(result)).toEqual(['A', 'B', 'C']);
    expect(result.A).toHaveLength(2);
    expect(result.B).toHaveLength(2);
    expect(result.C).toHaveLength(1);
    expect(result.A[0].id).toBe(1);
    expect(result.A[1].id).toBe(3);
  });
});
