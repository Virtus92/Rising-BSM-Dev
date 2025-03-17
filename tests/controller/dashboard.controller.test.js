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
        
        it('should properly handle chart data generation', async () => {
            // Mock helper function
            getNotificationsHelper.mockResolvedValue([{ id: 1, text: 'Notification' }]);
            
            // Setup different chart data mock responses
            const mockRevenueChartData = { labels: ['Jan', 'Feb', 'Mar'], data: [1000, 1500, 2000] };
            const mockServicesChartData = { labels: ['Service A', 'Service B'], data: [500, 300] };
            
            // Mock database queries that would be used in chart generation
            pool.query
                .mockResolvedValueOnce({ rows: [{ label: 'Jan', summe: '1000' }, { label: 'Feb', summe: '1500' }, { label: 'Mar', summe: '2000' }] }) // Revenue chart query
                .mockResolvedValueOnce({ rows: [{ service_name: 'Service A', summe: '500' }, { service_name: 'Service B', summe: '300' }] }); // Services chart query
            
            // Mock cache service with custom implementation for charts
            cacheService.getOrExecute.mockImplementation((key, callback) => {
                if (key === 'dashboard_stats') return Promise.resolve({ stats: 'data' });
                if (key === 'recent_requests') return Promise.resolve([{ id: 1 }]);
                if (key === 'upcoming_appointments') return Promise.resolve([{ id: 1 }]);
                if (key.includes('revenue_chart')) {
                    // Execute the callback to test chart generation logic
                    return callback();
                }
                if (key.includes('services_chart')) {
                    // Execute the callback to test chart generation logic
                    return callback();
                }
                return Promise.resolve({});
            });

            await getDashboardData(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
            expect(pool.query).toHaveBeenCalledTimes(2); // Two chart queries
            
            // Verify the returned data structure includes charts
            const responseData = res.json.mock.calls[0][0];
            expect(responseData).toHaveProperty('charts');
        });
        
        it('should handle recent requests data', async () => {
            // Mock helper function
            getNotificationsHelper.mockResolvedValue([]);
            
            // Mock recent requests data
            const mockRecentRequests = [
                { 
                    id: 1, 
                    name: 'Test Customer', 
                    email: 'test@example.com',
                    service: 'facility',
                    status: 'neu',
                    created_at: new Date()
                }
            ];
            
            // Mock database query
            pool.query.mockResolvedValueOnce({ rows: mockRecentRequests });
            
            // Mock cache service
            cacheService.getOrExecute.mockImplementation((key, callback) => {
                if (key === 'dashboard_stats') return Promise.resolve({ stats: 'data' });
                if (key === 'recent_requests') {
                    // Execute the callback to test request formatting logic
                    return callback();
                }
                if (key === 'upcoming_appointments') return Promise.resolve([]);
                if (key.includes('chart')) return Promise.resolve({ labels: [], data: [] });
                return Promise.resolve({});
            });

            await getDashboardData(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(pool.query).toHaveBeenCalled();
            
            // Verify response contains formatted recent requests
            const responseData = res.json.mock.calls[0][0];
            expect(responseData).toHaveProperty('recentRequests');
            expect(Array.isArray(responseData.recentRequests)).toBe(true);
            expect(responseData.recentRequests[0]).toHaveProperty('serviceLabel', 'Facility Management');
            expect(responseData.recentRequests[0]).toHaveProperty('status', 'Neu');
            expect(responseData.recentRequests[0]).toHaveProperty('statusClass', 'warning');
        });
        
        it('should handle upcoming appointments data', async () => {
            // Mock helper function
            getNotificationsHelper.mockResolvedValue([]);
            
            // Mock upcoming appointments data
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const mockAppointments = [
                { 
                    id: 1, 
                    titel: 'Client Meeting', 
                    termin_datum: tomorrow,
                    status: 'geplant',
                    kunde_name: 'Test Client'
                }
            ];
            
            // Mock database query
            pool.query.mockResolvedValueOnce({ rows: mockAppointments });
            
            // Mock cache service
            cacheService.getOrExecute.mockImplementation((key, callback) => {
                if (key === 'dashboard_stats') return Promise.resolve({ stats: 'data' });
                if (key === 'recent_requests') return Promise.resolve([]);
                if (key === 'upcoming_appointments') {
                    // Execute the callback to test appointment formatting logic
                    return callback();
                }
                if (key.includes('chart')) return Promise.resolve({ labels: [], data: [] });
                return Promise.resolve({});
            });

            await getDashboardData(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(pool.query).toHaveBeenCalled();
            
            // Verify response contains formatted appointments
            const responseData = res.json.mock.calls[0][0];
            expect(responseData).toHaveProperty('upcomingAppointments');
            expect(Array.isArray(responseData.upcomingAppointments)).toBe(true);
            expect(responseData.upcomingAppointments[0]).toHaveProperty('title', 'Client Meeting');
            expect(responseData.upcomingAppointments[0]).toHaveProperty('customer', 'Test Client');
            expect(responseData.upcomingAppointments[0]).toHaveProperty('time');
            expect(responseData.upcomingAppointments[0]).toHaveProperty('dateLabel');
        });
        
        it('should handle all chart date ranges', async () => {
            // Tests different date range calculations
            req.query = {
                revenueFilter: 'Letzten 30 Tage',
                servicesFilter: 'Diese Woche'
            };
            
            // Mock helper function
            getNotificationsHelper.mockResolvedValue([]);
            
            // Mock cache service that executes callbacks for chart data
            cacheService.getOrExecute.mockImplementation((key, callback) => {
                if (key.includes('chart')) {
                    // Make sure we're actually executing the date range logic
                    return callback();
                }
                return Promise.resolve({});
            });
            
            // Mock database queries
            pool.query.mockResolvedValue({ rows: [] });

            await getDashboardData(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            
            // Change filters and test again
            req.query = {
                revenueFilter: 'Dieses Jahr',
                servicesFilter: 'Dieses Quartal'
            };
            
            await getDashboardData(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
            
            const responseData = res.json.mock.calls[1][0];
            expect(responseData.chartFilters.revenue.selected).toBe('Dieses Jahr');
            expect(responseData.chartFilters.services.selected).toBe('Dieses Quartal');
        });
        
        it('should handle errors in getRecentRequests', async () => {
            // Mock helper function
            getNotificationsHelper.mockResolvedValue([]);
            
            // Make getRecentRequests fail
            cacheService.getOrExecute.mockImplementation((key, callback) => {
                if (key === 'dashboard_stats') return Promise.resolve({ stats: 'data' });
                if (key === 'recent_requests') {
                    // Simulate an error in the recent requests function
                    throw new Error('Database error in recent requests');
                }
                if (key === 'upcoming_appointments') return Promise.resolve([]);
                if (key.includes('chart')) return Promise.resolve({ labels: [], data: [] });
                return Promise.resolve({});
            });

            await getDashboardData(req, res, next);

            // Should still return 200 with empty recent requests
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
            expect(res.json.mock.calls[0][0].recentRequests).toEqual([]);
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

        it('should handle errors in statistics fetching', async () => {
            // Mock cache to execute callback and simulate error
            cacheService.getOrExecute.mockImplementation((key, callback) => {
                if (key === 'dashboard_stats') {
                    return Promise.reject(new Error('Database connection error'));
                }
                return Promise.resolve({});
            });

            await expect(getDashboardStats()).rejects.toThrow('Database connection error');
        });
    });

    
    describe('chart data generation', () => {
        beforeEach(() => {
            pool.query.mockClear();
            pool.query.mockResolvedValue({ rows: [] });
        });

        it('should handle "Dieses Jahr" filter for services chart', async () => {
            // Mock request with specific filter
            req.query = {
                revenueFilter: 'Letzten 6 Monate',
                servicesFilter: 'Dieses Jahr'
            };
            
            // Mock helper
            getNotificationsHelper.mockResolvedValue([]);
            
            // Mock cache to execute callbacks for chart data
            cacheService.getOrExecute.mockImplementation((key, callback) => {
                if (key.includes('services_chart_Dieses Jahr')) {
                    return callback();
                }
                return Promise.resolve({});
            });

            await getDashboardData(req, res, next);

            // Verify that the query contains the correct date filter for "Dieses Jahr"
            const serviceChartQuery = pool.query.mock.calls[0][0];
            expect(serviceChartQuery).toContain("AND rechnungsdatum >= DATE_TRUNC('year', CURRENT_DATE)");
        });

        it('should handle "Letzten 3 Monate" revenue chart configuration', async () => {
            // Mock request with specific filter
            req.query = {
                revenueFilter: 'Letzten 3 Monate',
                servicesFilter: 'Diesen Monat'
            };
            
            // Mock helper
            getNotificationsHelper.mockResolvedValue([]);
            
            // Mock cache to execute callbacks for chart data
            cacheService.getOrExecute.mockImplementation((key, callback) => {
                if (key.includes('revenue_chart_Letzten 3 Monate')) {
                    return callback();
                }
                return Promise.resolve({});
            });

            await getDashboardData(req, res, next);

            // Verify that the query contains the correct grouping and format parameters
            const [groupBy, dateFormat] = pool.query.mock.calls[0][1];
            expect(groupBy).toBe('week');
            expect(dateFormat).toBe('DD.MM');
        });

        it('should handle errors in chart data fetching', async () => {
            // Mock request
            req.query = {
                revenueFilter: 'Letzten 30 Tage',
                servicesFilter: 'Diese Woche'
            };
            
            // Mock helper
            getNotificationsHelper.mockResolvedValue([]);
            
            // Mock the dashboard data components
            cacheService.getOrExecute.mockImplementation((key, callback) => {
                if (key === 'dashboard_stats') return Promise.resolve({ stats: 'data' });
                if (key === 'recent_requests') return Promise.resolve([]);
                if (key === 'upcoming_appointments') return Promise.resolve([]);
                
                // For chart data, we'll throw an error inside the callback execution
                // rather than rejecting the Promise outright
                if (key.includes('revenue_chart')) {
                    if (callback) {
                        // This simulates an error happening during chart data generation
                        // but allows the cacheService.getOrExecute call itself to resolve
                        throw new Error('Chart data error');
                    }
                    return Promise.resolve({ labels: [], data: [] });
                }
                if (key.includes('services_chart')) {
                    if (callback) {
                        throw new Error('Chart data error');
                    }
                    return Promise.resolve({ labels: [], data: [] });
                }
                return Promise.resolve({});
            });

            await getDashboardData(req, res, next);

            // Should cause error to be passed to next()
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
            expect(next.mock.calls[0][0].message).toContain('Chart data error');
        });
    });

    
    describe('formatting helpers', () => {
        beforeEach(() => {
            pool.query.mockClear();
        });

        it('should correctly map different request statuses', async () => {
            // Mock recent requests data with different statuses
            const mockRequests = [
                { id: 1, name: 'Customer 1', email: 'c1@example.com', service: 'facility', status: 'in_bearbeitung', created_at: new Date() },
                { id: 2, name: 'Customer 2', email: 'c2@example.com', service: 'moving', status: 'beantwortet', created_at: new Date() },
                { id: 3, name: 'Customer 3', email: 'c3@example.com', service: 'winter', status: 'abgeschlossen', created_at: new Date() }
            ];
            
            // Mock database query
            pool.query.mockResolvedValueOnce({ rows: mockRequests });
            
            // Mock cache service
            cacheService.getOrExecute.mockImplementation((key, callback) => {
                if (key === 'recent_requests') {
                    return callback();
                }
                return Promise.resolve({});
            });
            
            // Mock notifications
            getNotificationsHelper.mockResolvedValue([]);

            await getDashboardData(req, res, next);
            
            // Verify correct status mapping
            const recentRequests = res.json.mock.calls[0][0].recentRequests;
            
            expect(recentRequests[0].status).toBe('In Bearbeitung');
            expect(recentRequests[0].statusClass).toBe('info');
            
            expect(recentRequests[1].status).toBe('Beantwortet');
            expect(recentRequests[1].statusClass).toBe('success');
            
            expect(recentRequests[2].status).toBe('Geschlossen');
            expect(recentRequests[2].statusClass).toBe('secondary');
            
            // Also verify correct service type mapping
            expect(recentRequests[0].serviceLabel).toBe('Facility Management');
            expect(recentRequests[1].serviceLabel).toBe('Umzüge & Transporte');
            expect(recentRequests[2].serviceLabel).toBe('Winterdienst');
        });
        
        it('should handle default service type', async () => {
            // Mock request with unknown service type
            const mockRequests = [
                { id: 1, name: 'Customer', email: 'c@example.com', service: 'unknown_type', status: 'neu', created_at: new Date() }
            ];
            
            pool.query.mockResolvedValueOnce({ rows: mockRequests });
            
            cacheService.getOrExecute.mockImplementation((key, callback) => {
                if (key === 'recent_requests') {
                    return callback();
                }
                return Promise.resolve({});
            });
            
            getNotificationsHelper.mockResolvedValue([]);

            await getDashboardData(req, res, next);
            
            const recentRequests = res.json.mock.calls[0][0].recentRequests;
            expect(recentRequests[0].serviceLabel).toBe('Sonstiges');
        });
        
        it('should handle errors in upcoming appointments', async () => {
            // Mock helper
            getNotificationsHelper.mockResolvedValue([]);
            
            // Mock cache with error for upcoming appointments
            cacheService.getOrExecute.mockImplementation((key, callback) => {
                if (key === 'upcoming_appointments') {
                    throw new Error('Database error in appointments');
                }
                return Promise.resolve({});
            });

            await getDashboardData(req, res, next);

            // Should still respond with empty upcoming appointments
            expect(res.status).toHaveBeenCalledWith(200);
            const responseData = res.json.mock.calls[0][0];
            expect(responseData.upcomingAppointments).toEqual([]);
        });
    });
    
    describe('notifications formatting', () => {
        it('should correctly format different notification types', async () => {
            // Mock notifications with different types
            pool.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        typ: 'warnung',
                        titel: 'Warning notification',
                        nachricht: 'This is a warning',
                        erstellt_am: new Date(),
                        gelesen: false,
                        referenz_id: 100
                    },
                    {
                        id: 2,
                        typ: 'projekt',
                        titel: 'Project notification',
                        nachricht: 'Project update',
                        erstellt_am: new Date(),
                        gelesen: false,
                        referenz_id: 200
                    },
                    {
                        id: 3,
                        typ: 'unknown',
                        titel: 'Unknown type',
                        nachricht: 'Unknown notification type',
                        erstellt_am: new Date(),
                        gelesen: false,
                        referenz_id: 300
                    }
                ]
            });

            await getNotifications(req, res, next);
            
            const notifications = res.json.mock.calls[0][0].notifications;
            
            // Check warning type formatting
            expect(notifications[0].type).toBe('warning');
            expect(notifications[0].icon).toBe('exclamation-triangle');
            
            // Check project type link
            expect(notifications[1].link).toBe('/dashboard/projekte/200');
            
            // Check default type and link
            expect(notifications[2].type).toBe('info');
            expect(notifications[2].icon).toBe('bell');
            expect(notifications[2].link).toBe('/dashboard/notifications');
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