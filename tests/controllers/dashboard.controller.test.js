const dashboardController = require('../../controllers/dashboard.controller');
const pool = require('../../services/db.service');
const cacheService = require('../../services/cache.service');

// Mock dependencies
jest.mock('../../services/db.service');
jest.mock('../../services/cache.service');
jest.mock('../../utils/helpers', () => ({
  getNotifications: jest.fn().mockResolvedValue({ notifications: [] })
}));

describe('Dashboard Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request, response
    mockReq = {
      session: {
        user: { id: 1, name: 'Test User' }
      },
      query: {},
      params: {},
      ip: '127.0.0.1'
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Default pool query mock implementation
    pool.query = jest.fn().mockResolvedValue({ rows: [] });

    // Default cache service mock implementation
    cacheService.getOrExecute = jest.fn().mockImplementation((key, callback) => callback());
    cacheService.delete = jest.fn();
  });

  describe('getDashboardData', () => {
    it('should return complete dashboard data', async () => {
      // Mock requests stats
      pool.query.mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ count: '5' }] })
      ).mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ count: '10' }] })
      ).mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ count: '8' }] })
      );

      // Mock projects stats
      pool.query.mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ count: '12' }] })
      ).mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ count: '3' }] })
      ).mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ count: '2' }] })
      );

      // Mock customers stats
      pool.query.mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ count: '50' }] })
      ).mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ count: '45' }] })
      );

      // Mock revenue stats
      pool.query.mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ summe: '15000' }] })
      ).mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ summe: '12000' }] })
      );

      // Mock revenue chart data
      pool.query.mockImplementationOnce(() => 
        Promise.resolve({ rows: [
          { label: 'Jan 23', summe: '5000' },
          { label: 'Feb 23', summe: '6000' },
          { label: 'Mar 23', summe: '7000' }
        ]})
      );

      // Mock services chart data
      pool.query.mockImplementationOnce(() => 
        Promise.resolve({ rows: [
          { service_name: 'Cleaning', summe: '8000' },
          { service_name: 'Security', summe: '5000' },
          { service_name: 'Maintenance', summe: '3000' }
        ]})
      );

      // Mock recent requests
      pool.query.mockImplementationOnce(() => 
        Promise.resolve({ rows: [
          { 
            id: 1, 
            name: 'John Doe', 
            email: 'john@example.com', 
            service: 'facility', 
            status: 'neu', 
            created_at: '2023-06-01T10:00:00Z' 
          },
          { 
            id: 2, 
            name: 'Jane Smith', 
            email: 'jane@example.com', 
            service: 'moving', 
            status: 'in_bearbeitung', 
            created_at: '2023-06-02T09:00:00Z' 
          }
        ]})
      );

      // Mock upcoming appointments
      pool.query.mockImplementationOnce(() => 
        Promise.resolve({ rows: [
          { 
            id: 101, 
            titel: 'Meeting with Client', 
            termin_datum: '2023-06-10T10:30:00Z',
            status: 'geplant',
            kunde_name: 'ACME Inc.' 
          },
          { 
            id: 102, 
            titel: 'Project Review', 
            termin_datum: '2023-06-12T14:00:00Z',
            status: 'bestaetigt',
            kunde_name: 'XYZ Corp' 
          }
        ]})
      );

      // Execute controller method
      const result = await dashboardController.getDashboardData(mockReq);

      // Assertions
      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('charts');
      expect(result).toHaveProperty('notifications');
      expect(result).toHaveProperty('recentRequests');
      expect(result).toHaveProperty('upcomingAppointments');
      expect(result).toHaveProperty('systemStatus');
      expect(result.charts).toHaveProperty('revenue');
      expect(result.charts).toHaveProperty('services');
      expect(result.recentRequests).toHaveLength(2);
      expect(result.upcomingAppointments).toHaveLength(2);
    });
  });

  describe('getDashboardStats', () => {
    it('should return statistics with trends', async () => {
      // Mock cache service
      cacheService.getOrExecute.mockImplementation((key, callback) => {
        if (key === 'dashboard_stats') {
          return callback();
        }
        return null;
      });

      // Mock database queries for stats
      pool.query.mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ count: '5' }] })
      ).mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ count: '10' }] })
      ).mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ count: '8' }] })
      ).mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ count: '12' }] })
      ).mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ count: '3' }] })
      ).mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ count: '2' }] })
      ).mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ count: '50' }] })
      ).mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ count: '45' }] })
      ).mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ summe: '15000' }] })
      ).mockImplementationOnce(() => 
        Promise.resolve({ rows: [{ summe: '12000' }] })
      );

      // Execute controller method
      const stats = await dashboardController.getDashboardStats();

      // Assertions
      expect(stats).toHaveProperty('newRequests');
      expect(stats).toHaveProperty('activeProjects');
      expect(stats).toHaveProperty('totalCustomers');
      expect(stats).toHaveProperty('monthlyRevenue');
      expect(stats.newRequests).toHaveProperty('count');
      expect(stats.newRequests).toHaveProperty('trend');
      expect(stats.activeProjects).toHaveProperty('count');
      expect(stats.totalCustomers).toHaveProperty('count', 50);
      expect(stats.monthlyRevenue).toHaveProperty('amount', 15000);
      expect(cacheService.getOrExecute).toHaveBeenCalledWith(
        'dashboard_stats',
        expect.any(Function),
        300
      );
    });
  });

  describe('globalSearch', () => {
    it('should search across multiple entities', async () => {
      const searchTerm = 'test';

      // Mock customer search results
      pool.query.mockImplementationOnce(() => 
        Promise.resolve({ rows: [
          {
            id: 1,
            name: 'Test Customer',
            email: 'customer@test.com',
            firma: 'Test Corp',
            telefon: '123456789',
            status: 'aktiv'
          }
        ]})
      );

      // Mock project search results
      pool.query.mockImplementationOnce(() => 
        Promise.resolve({ rows: [
          {
            id: 101,
            titel: 'Test Project',
            status: 'in_bearbeitung',
            start_datum: '2023-06-01T00:00:00Z',
            kunde_name: 'Test Customer'
          }
        ]})
      );

      // Mock appointment search results
      pool.query.mockImplementationOnce(() => 
        Promise.resolve({ rows: [
          {
            id: 201,
            titel: 'Test Meeting',
            status: 'geplant',
            termin_datum: '2023-06-10T10:30:00Z',
            kunde_name: 'Test Customer'
          }
        ]})
      );

      // Mock request search results
      pool.query.mockImplementationOnce(() => 
        Promise.resolve({ rows: [
          {
            id: 301,
            name: 'Test Request',
            email: 'request@test.com',
            service: 'facility',
            status: 'neu',
            created_at: '2023-06-01T10:00:00Z'
          }
        ]})
      );

      // Mock service search results
      pool.query.mockImplementationOnce(() => 
        Promise.resolve({ rows: [
          {
            id: 401,
            name: 'Test Service',
            beschreibung: 'A test service',
            preis_basis: '100.00',
            einheit: 'hour',
            aktiv: true
          }
        ]})
      );

      // Execute controller method
      const result = await dashboardController.globalSearch(searchTerm);

      // Assertions
      expect(result).toHaveProperty('customers');
      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('appointments');
      expect(result).toHaveProperty('requests');
      expect(result).toHaveProperty('services');
      expect(result.customers).toHaveLength(1);
      expect(result.projects).toHaveLength(1);
      expect(result.appointments).toHaveLength(1);
      expect(result.requests).toHaveLength(1);
      expect(result.services).toHaveLength(1);
      expect(result.customers[0].name).toBe('Test Customer');
      expect(result.projects[0].title).toBe('Test Project');
      expect(result.services[0].name).toBe('Test Service');
    });

    it('should return empty results for short search terms', async () => {
      // Test with a short search term
      const result = await dashboardController.globalSearch('a');
      
      // Verify that no database queries were made
      expect(pool.query).not.toHaveBeenCalled();
      
      // Assertions for empty results
      expect(result.customers).toHaveLength(0);
      expect(result.projects).toHaveLength(0);
      expect(result.appointments).toHaveLength(0);
      expect(result.requests).toHaveLength(0);
      expect(result.services).toHaveLength(0);
    });
  });

  describe('getNotifications', () => {
    it('should return formatted notifications for a user', async () => {
      const userId = 1;

      // Mock notifications query
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            typ: 'anfrage',
            titel: 'New Contact Request',
            nachricht: 'You received a new contact request',
            erstellt_am: '2023-06-01T10:00:00Z',
            gelesen: false,
            referenz_id: 101
          },
          {
            id: 2,
            typ: 'termin',
            titel: 'Upcoming Appointment',
            nachricht: 'You have an appointment tomorrow',
            erstellt_am: '2023-06-02T09:00:00Z',
            gelesen: true,
            referenz_id: 201
          }
        ]
      });

      // Execute controller method
      const result = await dashboardController.getNotifications(userId);

      // Assertions
      expect(result).toHaveProperty('notifications');
      expect(result.notifications).toHaveLength(2);
      expect(result.notifications[0]).toHaveProperty('id', 1);
      expect(result.notifications[0]).toHaveProperty('type', 'success');
      expect(result.notifications[0]).toHaveProperty('icon', 'envelope');
      expect(result.notifications[0]).toHaveProperty('link', '/dashboard/requests/101');
      expect(result.notifications[1]).toHaveProperty('id', 2);
      expect(result.notifications[1]).toHaveProperty('type', 'primary');
      expect(result.notifications[1]).toHaveProperty('read', true);
    });
  });

  describe('markNotificationsRead', () => {
    it('should mark a specific notification as read', async () => {
      const userId = 1;
      const notificationId = 5;
      
      // Mock update query
      pool.query.mockResolvedValueOnce({
        rowCount: 1
      });

      // Execute controller method
      const result = await dashboardController.markNotificationsRead(userId, notificationId, false);

      // Assertions
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE benachrichtigungen'),
        [notificationId, userId]
      );
      expect(cacheService.delete).toHaveBeenCalledWith(`notifications_${userId}`);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('count', 1);
    });

    it('should mark all notifications as read', async () => {
      const userId = 1;
      
      // Mock update query
      pool.query.mockResolvedValueOnce({
        rowCount: 5
      });

      // Execute controller method
      const result = await dashboardController.markNotificationsRead(userId, null, true);

      // Assertions
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE benachrichtigungen'),
        [userId]
      );
      expect(cacheService.delete).toHaveBeenCalledWith(`notifications_${userId}`);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('count', 5);
    });
  });
});
