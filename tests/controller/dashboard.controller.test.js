const { getDashboardData, getDashboardStats, globalSearch, getNotifications, markNotificationsRead } = require('../../controllers/dashboard.controller');
const pool = require('../../services/db.service');
const cacheService = require('../../services/cache.service');
const { getNotifications: getNotificationsHelper } = require('../../utils/helpers');

// Mock dependencies
jest.mock('../../services/db.service', () => ({
    query: jest.fn()
}));
jest.mock('../../services/cache.service', () => ({
    getOrExecute: jest.fn(),
    delete: jest.fn()
}));
jest.mock('../../utils/helpers', () => ({
    getNotifications: jest.fn()
}));

describe('Dashboard Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            query: {},
            session: {
                user: { id: 1 }
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('getDashboardData', () => {
        it('should return dashboard data successfully', async () => {
            // Mock helper function
            getNotificationsHelper.mockResolvedValue([{ id: 1, text: 'Notification' }]);
            // Mock cache service
            cacheService.getOrExecute
                .mockImplementation((key, callback) => {
                    if (key === 'dashboard_stats') {
                        return Promise.resolve({ stats: 'data' });
                    }
                    if (key === 'recent_requests') {
                        return Promise.resolve([{ id: 1 }]);
                    }
                    if (key === 'upcoming_appointments') {
                        return Promise.resolve([{ id: 1 }]);
                    }
                    if (key.includes('revenue_chart')) {
                        return Promise.resolve({ labels: [], data: [] });
                    }
                    if (key.includes('services_chart')) {
                        return Promise.resolve({ labels: [], data: [] });
                    }
                    return Promise.resolve({});
                });

            await getDashboardData(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
            expect(getNotificationsHelper).toHaveBeenCalledWith(req);
        });

        it('should handle errors', async () => {
            getNotificationsHelper.mockRejectedValue(new Error('Test error'));

            await getDashboardData(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        });

        it('should handle different chart filter parameters', async () => {
            // Setup query parameters
            req.query = {
                revenueFilter: 'Letzten 30 Tage',
                servicesFilter: 'Diese Woche'
            };
            
            // Mock helper function
            getNotificationsHelper.mockResolvedValue([{ id: 1, text: 'Notification' }]);
            
            // Setup cache responses for different filters
            cacheService.getOrExecute.mockImplementation((key, callback) => {
                if (key === 'dashboard_stats') return Promise.resolve({ stats: 'data' });
                if (key === 'recent_requests') return Promise.resolve([{ id: 1 }]);
                if (key === 'upcoming_appointments') return Promise.resolve([{ id: 1 }]);
                if (key === 'revenue_chart_Letzten 30 Tage') return Promise.resolve({ labels: [], data: [] });
                if (key === 'services_chart_Diese Woche') return Promise.resolve({ labels: [], data: [] });
                return Promise.resolve({});
            });

            await getDashboardData(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
            expect(res.json.mock.calls[0][0]).toHaveProperty('chartFilters');
            expect(res.json.mock.calls[0][0].chartFilters.revenue.selected).toBe('Letzten 30 Tage');
            expect(res.json.mock.calls[0][0].chartFilters.services.selected).toBe('Diese Woche');
        });
    });

    describe('getDashboardStats', () => {
        it('should return dashboard statistics from cache', async () => {
            const mockStats = { newRequests: { count: 5, trend: 10 } };
            cacheService.getOrExecute.mockResolvedValue(mockStats);

            const result = await getDashboardStats();

            expect(cacheService.getOrExecute).toHaveBeenCalledWith('dashboard_stats', expect.any(Function), 300);
            expect(result).toEqual(mockStats);
        });

        it('should fetch dashboard statistics from database when not in cache', async () => {
            // Mock the DB responses for all queries
            pool.query
                .mockResolvedValueOnce({ rows: [{ count: '5' }] }) // newRequestsQuery
                .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // currentWeekRequestsQuery
                .mockResolvedValueOnce({ rows: [{ count: '8' }] }) // prevWeekRequestsQuery
                .mockResolvedValueOnce({ rows: [{ count: '15' }] }) // activeProjectsQuery
                .mockResolvedValueOnce({ rows: [{ count: '4' }] }) // currentMonthProjectsQuery
                .mockResolvedValueOnce({ rows: [{ count: '3' }] }) // prevMonthProjectsQuery
                .mockResolvedValueOnce({ rows: [{ count: '100' }] }) // totalCustomersQuery
                .mockResolvedValueOnce({ rows: [{ count: '90' }] }) // customersLastYearQuery
                .mockResolvedValueOnce({ rows: [{ summe: '5000' }] }) // monthlyRevenueQuery
                .mockResolvedValueOnce({ rows: [{ summe: '4500' }] }); // prevMonthRevenueQuery

            // Mock cache service to execute callback
            cacheService.getOrExecute.mockImplementation((key, callback) => callback());

            const result = await getDashboardStats();

            expect(pool.query).toHaveBeenCalledTimes(10);
            expect(result).toHaveProperty('newRequests');
            expect(result).toHaveProperty('activeProjects');
            expect(result).toHaveProperty('totalCustomers');
            expect(result).toHaveProperty('monthlyRevenue');
        });
    });

    describe('globalSearch', () => {
        it('should return empty results for short queries', async () => {
            req.query.q = 'a';

            await globalSearch(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                customers: [],
                projects: [],
                appointments: [],
                requests: [],
                services: []
            });
            expect(pool.query).not.toHaveBeenCalled();
        });

        it('should search across all entities', async () => {
            req.query.q = 'test';

            pool.query
                .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test Customer' }] }) // customers
                .mockResolvedValueOnce({ rows: [{ id: 1, titel: 'Test Project' }] }) // projects
                .mockResolvedValueOnce({ rows: [{ id: 1, titel: 'Test Appointment' }] }) // appointments
                .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test Request' }] }) // requests
                .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test Service' }] }); // services

            await globalSearch(req, res, next);

            expect(pool.query).toHaveBeenCalledTimes(5);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
            expect(res.json.mock.calls[0][0]).toHaveProperty('customers');
            expect(res.json.mock.calls[0][0]).toHaveProperty('projects');
            expect(res.json.mock.calls[0][0]).toHaveProperty('appointments');
            expect(res.json.mock.calls[0][0]).toHaveProperty('requests');
            expect(res.json.mock.calls[0][0]).toHaveProperty('services');
        });

        it('should handle search errors', async () => {
            req.query.q = 'test';
            pool.query.mockRejectedValue(new Error('Database error'));

            await globalSearch(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        });

        it('should properly format search results with URLs', async () => {
            req.query.q = 'test';

            // Mock specific data to verify formatting
            pool.query
                .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test Customer', email: 'test@example.com' }] })
                .mockResolvedValueOnce({ rows: [{ id: 1, titel: 'Test Project', start_datum: new Date('2023-01-01') }] })
                .mockResolvedValueOnce({ rows: [{ id: 1, titel: 'Test Appointment', termin_datum: new Date('2023-01-01T10:00:00') }] })
                .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test Request', created_at: new Date('2023-01-01') }] })
                .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test Service', preis_basis: '100', einheit: 'Stunde' }] });

            await globalSearch(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
            
            // Check URL formatting in results
            const results = res.json.mock.calls[0][0];
            expect(results.customers[0].url).toBe('/dashboard/kunden/1');
            expect(results.projects[0].url).toBe('/dashboard/projekte/1');
            expect(results.appointments[0].url).toBe('/dashboard/termine/1');
            expect(results.requests[0].url).toBe('/dashboard/requests/1');
        });
    });

    describe('getNotifications', () => {
        it('should return formatted notifications', async () => {
            pool.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        typ: 'anfrage',
                        titel: 'New Request',
                        nachricht: 'You have a new request',
                        erstellt_am: new Date(),
                        gelesen: false,
                        referenz_id: 123
                    },
                    {
                        id: 2,
                        typ: 'termin',
                        titel: 'Meeting reminder',
                        nachricht: 'Upcoming meeting',
                        erstellt_am: new Date(),
                        gelesen: true,
                        referenz_id: 456
                    }
                ]
            });

            await getNotifications(req, res, next);

            expect(pool.query).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
            expect(res.json.mock.calls[0][0]).toHaveProperty('notifications');
            expect(res.json.mock.calls[0][0].notifications).toHaveLength(2);
            expect(res.json.mock.calls[0][0].notifications[0]).toHaveProperty('id', 1);
            expect(res.json.mock.calls[0][0].notifications[0]).toHaveProperty('link', '/dashboard/requests/123');
        });

        it('should handle notification fetch errors', async () => {
            pool.query.mockRejectedValue(new Error('Database error'));

            await getNotifications(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        });
    });

    describe('markNotificationsRead', () => {
        it('should mark a specific notification as read', async () => {
            req.body = { notificationId: 1 };
            pool.query.mockResolvedValue({ rowCount: 1 });

            await markNotificationsRead(req, res, next);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE benachrichtigungen'),
                [1, 1]
            );
            expect(cacheService.delete).toHaveBeenCalledWith('notifications_1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                count: 1
            }));
        });

        it('should mark all notifications as read', async () => {
            req.body = { markAll: true };
            pool.query.mockResolvedValue({ rowCount: 5 });

            await markNotificationsRead(req, res, next);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE benachrichtigungen'),
                [1]
            );
            expect(cacheService.delete).toHaveBeenCalledWith('notifications_1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                count: 5,
                message: 'All notifications marked as read'
            }));
        });

        it('should throw an error when neither notificationId nor markAll is provided', async () => {
            req.body = {};

            await markNotificationsRead(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
            expect(next.mock.calls[0][0].message).toBe('Either notification ID or mark all flag is required');
        });
    });
});