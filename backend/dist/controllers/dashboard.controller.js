"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationsRead = exports.getNotifications = exports.globalSearch = exports.getDashboardStats = exports.getDashboardData = void 0;
const prisma_utils_1 = require("../utils/prisma.utils");
const date_fns_1 = require("date-fns");
const cache_service_1 = __importDefault(require("../services/cache.service"));
const helpers_1 = require("../utils/helpers");
const formatters_1 = require("../utils/formatters");
const asyncHandler_1 = require("../utils/asyncHandler");
const type_helpers_1 = require("../utils/type-helpers");
exports.getDashboardData = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user?.id;
    const cacheKey = `dashboard_data_${userId || 'guest'}_${new Date().toISOString().slice(0, 10)}`;
    const dashboardData = await cache_service_1.default.getOrExecute(cacheKey, async () => {
        const notifications = await (0, helpers_1.getNotifications)(req);
        const revenueFilter = req.query.revenueFilter || 'Letzten 6 Monate';
        const servicesFilter = req.query.servicesFilter || 'Diesen Monat';
        const chartFilters = {
            revenue: {
                selected: revenueFilter,
                options: ['Letzten 30 Tage', 'Letzten 3 Monate', 'Letzten 6 Monate', 'Dieses Jahr']
            },
            services: {
                selected: servicesFilter,
                options: ['Diese Woche', 'Diesen Monat', 'Dieses Quartal', 'Dieses Jahr']
            }
        };
        const getStats = async () => {
            const mockReq = {};
            let statsData;
            const mockRes = {
                status: () => ({
                    json: (data) => {
                        statsData = data;
                        return mockRes;
                    }
                })
            };
            await (0, exports.getDashboardStats)(mockReq, mockRes, (() => { }));
            return statsData;
        };
        const [stats, recentRequests, upcomingAppointments, charts] = await Promise.all([
            getStats(),
            getRecentRequests(),
            getUpcomingAppointments(),
            getChartData(revenueFilter, servicesFilter)
        ]);
        const systemStatus = {
            database: 'online',
            lastUpdate: (0, date_fns_1.format)(new Date(), 'dd.MM.yyyy, HH:mm:ss'),
            processing: 'active',
            statistics: 'active'
        };
        return {
            stats,
            chartFilters,
            charts,
            notifications,
            recentRequests,
            upcomingAppointments,
            systemStatus
        };
    }, 300);
    res.status(200).json(dashboardData);
});
exports.getDashboardStats = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const stats = await cache_service_1.default.getOrExecute('dashboard_stats', async () => {
        const newRequestsCount = await prisma_utils_1.prisma.contactRequest.count({
            where: { status: 'neu' }
        });
        const currentWeekRequests = await prisma_utils_1.prisma.contactRequest.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            }
        });
        const prevWeekRequests = await prisma_utils_1.prisma.contactRequest.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                    lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            }
        });
        const activeProjects = await prisma_utils_1.prisma.project.count({
            where: {
                status: {
                    in: ['neu', 'in_bearbeitung']
                }
            }
        });
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        const prevMonth = new Date(currentMonth);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        const currentMonthProjects = await prisma_utils_1.prisma.project.count({
            where: {
                createdAt: {
                    gte: currentMonth
                }
            }
        });
        const prevMonthProjects = await prisma_utils_1.prisma.project.count({
            where: {
                createdAt: {
                    gte: prevMonth,
                    lt: currentMonth
                }
            }
        });
        const totalCustomers = await prisma_utils_1.prisma.customer.count({
            where: { status: 'aktiv' }
        });
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const customersLastYear = await prisma_utils_1.prisma.customer.count({
            where: {
                createdAt: {
                    lt: oneYearAgo
                },
                status: 'aktiv'
            }
        });
        const currentMonthRevenue = await prisma_utils_1.prisma.invoice.aggregate({
            _sum: {
                amount: true
            },
            where: {
                invoiceDate: {
                    gte: currentMonth
                }
            }
        });
        const prevMonthRevenue = await prisma_utils_1.prisma.invoice.aggregate({
            _sum: {
                amount: true
            },
            where: {
                invoiceDate: {
                    gte: prevMonth,
                    lt: currentMonth
                }
            }
        });
        const newRequestsTrend = prevWeekRequests > 0 ?
            Math.round(((currentWeekRequests - prevWeekRequests) / prevWeekRequests) * 100) : 0;
        const activeProjectsTrend = prevMonthProjects > 0 ?
            Math.round(((currentMonthProjects - prevMonthProjects) / prevMonthProjects) * 100) : 0;
        const totalCustomersTrend = customersLastYear > 0 ?
            Math.round(((totalCustomers - customersLastYear) / customersLastYear) * 100) : 0;
        const monthlyRevenue = currentMonthRevenue._sum.amount || 0;
        const prevMonthRevenueAmount = prevMonthRevenue._sum.amount || 0;
        const monthlyRevenueTrend = Number(prevMonthRevenueAmount) > 0 ?
            Math.round(((Number(monthlyRevenue) - Number(prevMonthRevenueAmount)) / Number(prevMonthRevenueAmount)) * 100) : 0;
        return {
            newRequests: { count: newRequestsCount, trend: newRequestsTrend },
            activeProjects: { count: activeProjects, trend: activeProjectsTrend },
            totalCustomers: { count: totalCustomers, trend: totalCustomersTrend },
            monthlyRevenue: { amount: monthlyRevenue, trend: monthlyRevenueTrend }
        };
    }, 300);
    res.status(200).json(stats);
});
async function getChartData(revenueFilter, servicesFilter) {
    const cacheKey = `revenue_chart_${revenueFilter}`;
    const revenueData = await cache_service_1.default.getOrExecute(cacheKey, async () => {
        const { startDate, groupBy, dateFormat } = calculateDateRange(revenueFilter);
        const invoices = await prisma_utils_1.prisma.invoice.findMany({
            where: {
                invoiceDate: {
                    gte: startDate,
                    lte: new Date()
                }
            },
            select: {
                invoiceDate: true,
                amount: true
            }
        });
        const groupedData = new Map();
        invoices.forEach((invoice) => {
            let groupKey;
            const date = new Date(invoice.invoiceDate);
            switch (groupBy) {
                case 'day':
                    groupKey = (0, date_fns_1.format)(date, 'dd.MM');
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    const day = weekStart.getDay();
                    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
                    weekStart.setDate(diff);
                    groupKey = (0, date_fns_1.format)(weekStart, 'dd.MM');
                    break;
                case 'month':
                default:
                    groupKey = (0, date_fns_1.format)(date, 'MMM yy');
            }
            if (groupedData.has(groupKey)) {
                groupedData.set(groupKey, groupedData.get(groupKey) + Number(invoice.amount));
            }
            else {
                groupedData.set(groupKey, Number(invoice.amount));
            }
        });
        const sortedEntries = Array.from(groupedData.entries())
            .sort((a, b) => a[0].localeCompare(b[0]));
        return {
            labels: sortedEntries.map(([label]) => label),
            data: sortedEntries.map(([_, amount]) => amount)
        };
    }, 600);
    const servicesKey = `services_chart_${servicesFilter}`;
    const servicesData = await cache_service_1.default.getOrExecute(servicesKey, async () => {
        let startDate = new Date();
        switch (servicesFilter) {
            case 'Diese Woche':
                startDate.setDate(startDate.getDate() - startDate.getDay() + (startDate.getDay() === 0 ? -6 : 1));
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'Dieses Quartal':
                startDate.setMonth(Math.floor(startDate.getMonth() / 3) * 3, 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'Dieses Jahr':
                startDate.setMonth(0, 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'Diesen Monat':
            default:
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
        }
        const servicesRevenue = await prisma_utils_1.prisma.invoicePosition.groupBy({
            by: ['serviceId'],
            where: {
                Invoice: {
                    invoiceDate: {
                        gte: startDate
                    }
                }
            },
            _sum: {
                quantity: true,
                unitPrice: true
            },
            orderBy: {
                _sum: {
                    quantity: 'desc'
                }
            },
            take: 4
        });
        const serviceNames = await prisma_utils_1.prisma.service.findMany({
            where: {
                id: {
                    in: servicesRevenue.map((item) => item.serviceId)
                }
            },
            select: {
                id: true,
                name: true
            }
        });
        const serviceNameMap = new Map(serviceNames.map((service) => [service.id, service.name]));
        return {
            labels: (0, type_helpers_1.typeSafeMap)(servicesRevenue, item => serviceNameMap.get(item.serviceId) || 'Unknown'),
            data: (0, type_helpers_1.typeSafeMap)(servicesRevenue, item => {
                const quantity = item._sum?.quantity ?? 0;
                const unitPrice = item._sum?.unitPrice ?? 0;
                return (0, type_helpers_1.toNumber)(quantity) * (0, type_helpers_1.toNumber)(unitPrice);
            })
        };
    }, 600);
    return {
        revenue: revenueData,
        services: servicesData
    };
}
function calculateDateRange(filter) {
    const now = new Date();
    let startDate;
    let groupBy;
    let dateFormat;
    switch (filter) {
        case 'Letzten 30 Tage':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 30);
            groupBy = 'day';
            dateFormat = 'DD.MM';
            break;
        case 'Letzten 3 Monate':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 3);
            groupBy = 'week';
            dateFormat = 'DD.MM';
            break;
        case 'Dieses Jahr':
            startDate = new Date(now.getFullYear(), 0, 1);
            groupBy = 'month';
            dateFormat = 'Mon YY';
            break;
        case 'Letzten 6 Monate':
        default:
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 6);
            groupBy = 'month';
            dateFormat = 'Mon YY';
    }
    return { startDate, groupBy, dateFormat };
}
async function getRecentRequests() {
    try {
        return await cache_service_1.default.getOrExecute('recent_requests', async () => {
            const requests = await prisma_utils_1.prisma.contactRequest.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5
            });
            return requests.map((request) => {
                let statusClass;
                let statusLabel;
                switch (request.status) {
                    case 'neu':
                        statusLabel = 'Neu';
                        statusClass = 'warning';
                        break;
                    case 'in_bearbeitung':
                        statusLabel = 'In Bearbeitung';
                        statusClass = 'info';
                        break;
                    case 'beantwortet':
                        statusLabel = 'Beantwortet';
                        statusClass = 'success';
                        break;
                    default:
                        statusLabel = 'Geschlossen';
                        statusClass = 'secondary';
                }
                let serviceLabel;
                switch (request.service) {
                    case 'facility':
                        serviceLabel = 'Facility Management';
                        break;
                    case 'moving':
                        serviceLabel = 'Umzüge & Transporte';
                        break;
                    case 'winter':
                        serviceLabel = 'Winterdienst';
                        break;
                    default:
                        serviceLabel = 'Sonstiges';
                }
                return {
                    id: request.id,
                    name: request.name,
                    email: request.email,
                    serviceLabel,
                    formattedDate: (0, formatters_1.formatDateSafely)(request.createdAt, 'dd.MM.yyyy'),
                    status: statusLabel,
                    statusClass
                };
            });
        }, 120);
    }
    catch (error) {
        console.error('Error fetching recent requests:', error);
        return [];
    }
}
async function getUpcomingAppointments() {
    try {
        return await cache_service_1.default.getOrExecute('upcoming_appointments', async () => {
            const appointments = await prisma_utils_1.prisma.appointment.findMany({
                where: {
                    appointmentDate: {
                        gte: new Date()
                    }
                },
                include: {
                    Customer: true
                },
                orderBy: {
                    appointmentDate: 'asc'
                },
                take: 5
            });
            return appointments.map((appointment) => {
                const datumObj = new Date(appointment.appointmentDate);
                const dateInfo = (0, formatters_1.formatDateWithLabel)(datumObj);
                return {
                    id: appointment.id,
                    title: appointment.title,
                    customer: appointment.Customer?.name || 'Kein Kunde zugewiesen',
                    dateLabel: dateInfo.label,
                    dateClass: dateInfo.class,
                    time: (0, date_fns_1.format)(datumObj, 'HH:mm')
                };
            });
        }, 120);
    }
    catch (error) {
        console.error('Error fetching upcoming appointments:', error);
        return [];
    }
}
exports.globalSearch = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const query = req.query.q;
    if (!query || query.trim().length < 2) {
        res.status(200).json({
            customers: [],
            projects: [],
            appointments: [],
            requests: [],
            services: []
        });
        return;
    }
    try {
        const searchTerm = `%${query.toLowerCase()}%`;
        const [customers, projects, appointments, requests, services] = await Promise.all([
            prisma_utils_1.prisma.customer.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                        { company: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5
            }),
            prisma_utils_1.prisma.project.findMany({
                where: {
                    title: { contains: query, mode: 'insensitive' }
                },
                include: {
                    Customer: true
                },
                take: 5
            }),
            prisma_utils_1.prisma.appointment.findMany({
                where: {
                    title: { contains: query, mode: 'insensitive' }
                },
                include: {
                    Customer: true
                },
                take: 5
            }),
            prisma_utils_1.prisma.contactRequest.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5
            }),
            prisma_utils_1.prisma.service.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5
            })
        ]);
        res.status(200).json({
            customers: customers.map((customer) => ({
                id: customer.id,
                name: customer.name,
                email: customer.email || '',
                firma: customer.company || '',
                telefon: customer.phone || '',
                status: customer.status,
                type: 'Kunde',
                url: `/dashboard/kunden/${customer.id}`
            })),
            projects: projects.map((project) => ({
                id: project.id,
                title: project.title,
                status: project.status,
                date: (0, formatters_1.formatDateSafely)(project.startDate, 'dd.MM.yyyy'),
                kunde: project.Customer?.name || 'Kein Kunde',
                type: 'Projekt',
                url: `/dashboard/projekte/${project.id}`
            })),
            appointments: appointments.map((appointment) => ({
                id: appointment.id,
                title: appointment.title,
                status: appointment.status,
                date: (0, formatters_1.formatDateSafely)(appointment.appointmentDate, 'dd.MM.yyyy, HH:mm'),
                kunde: appointment.Customer?.name || 'Kein Kunde',
                type: 'Termin',
                url: `/dashboard/termine/${appointment.id}`
            })),
            requests: requests.map((request) => ({
                id: request.id,
                name: request.name,
                email: request.email,
                status: request.status,
                date: (0, formatters_1.formatDateSafely)(request.createdAt, 'dd.MM.yyyy'),
                type: 'Anfrage',
                url: `/dashboard/requests/${request.id}`
            })),
            services: services.map((service) => ({
                id: service.id,
                name: service.name,
                preis: service.priceBase,
                einheit: service.unit || '',
                aktiv: service.active,
                type: 'Dienstleistung',
                url: `/dashboard/dienste/${service.id}`
            }))
        });
    }
    catch (error) {
        console.error('Error performing global search:', error);
        throw error;
    }
});
exports.getNotifications = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
        return;
    }
    const userId = req.user.id;
    const notifications = await prisma_utils_1.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
    const formattedNotifications = notifications.map((notification) => {
        let type;
        let icon;
        switch (notification.type) {
            case 'anfrage':
                type = 'success';
                icon = 'envelope';
                break;
            case 'termin':
                type = 'primary';
                icon = 'calendar-check';
                break;
            case 'warnung':
                type = 'warning';
                icon = 'exclamation-triangle';
                break;
            default:
                type = 'info';
                icon = 'bell';
        }
        let link;
        switch (notification.type) {
            case 'anfrage':
                link = `/dashboard/requests/${notification.referenceId}`;
                break;
            case 'termin':
                link = `/dashboard/termine/${notification.referenceId}`;
                break;
            case 'projekt':
                link = `/dashboard/projekte/${notification.referenceId}`;
                break;
            default:
                link = '/dashboard/notifications';
        }
        return {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type,
            icon,
            read: notification.read,
            time: (0, formatters_1.formatRelativeTime)(notification.createdAt),
            timestamp: notification.createdAt,
            link
        };
    });
    res.status(200).json({ notifications: formattedNotifications });
});
exports.markNotificationsRead = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
        return;
    }
    const userId = req.user.id;
    const { notificationId, markAll } = req.body;
    let updatedCount = 0;
    if (markAll) {
        const result = await prisma_utils_1.prisma.notification.updateMany({
            where: {
                userId,
                read: false
            },
            data: {
                read: true
            }
        });
        updatedCount = result.count;
    }
    else if (notificationId) {
        const result = await prisma_utils_1.prisma.notification.updateMany({
            where: {
                id: Number(notificationId),
                userId
            },
            data: {
                read: true
            }
        });
        updatedCount = result.count;
    }
    else {
        throw new Error('Either notification ID or mark all flag is required');
    }
    cache_service_1.default.delete(`notifications_${userId}`);
    res.status(200).json({
        success: true,
        count: updatedCount,
        message: markAll ? 'All notifications marked as read' : 'Notification marked as read'
    });
});
//# sourceMappingURL=dashboard.controller.js.map