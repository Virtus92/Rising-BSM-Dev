const helpers = require('../../utils/helpers');
const cache = require('../../services/cache.service');
const db = require('../../services/db.service');

// Mock the cache and db services
jest.mock('../../services/cache.service');
jest.mock('../../services/db.service');

describe('Helper Functions Tests', () => {
    describe('getAnfrageStatusInfo', () => {
        it('should return the correct status info for "neu"', () => {
            expect(helpers.getAnfrageStatusInfo('neu')).toEqual({ label: 'Neu', className: 'warning' });
        });

        it('should return the correct status info for "in_bearbeitung"', () => {
            expect(helpers.getAnfrageStatusInfo('in_bearbeitung')).toEqual({ label: 'In Bearbeitung', className: 'info' });
        });

        it('should return the correct status info for "beantwortet"', () => {
            expect(helpers.getAnfrageStatusInfo('beantwortet')).toEqual({ label: 'Beantwortet', className: 'success' });
        });

        it('should return the correct status info for "geschlossen"', () => {
            expect(helpers.getAnfrageStatusInfo('geschlossen')).toEqual({ label: 'Geschlossen', className: 'secondary' });
        });

        it('should return default status info for unknown status', () => {
            expect(helpers.getAnfrageStatusInfo('unknown')).toEqual({ label: 'Unbekannt', className: 'secondary' });
        });
    });

    describe('getTerminStatusInfo', () => {
        it('should return the correct status info for "geplant"', () => {
            expect(helpers.getTerminStatusInfo('geplant')).toEqual({ label: 'Geplant', className: 'warning' });
        });

        it('should return the correct status info for "bestaetigt"', () => {
            expect(helpers.getTerminStatusInfo('bestaetigt')).toEqual({ label: 'Bestätigt', className: 'success' });
        });

        it('should return the correct status info for "abgeschlossen"', () => {
            expect(helpers.getTerminStatusInfo('abgeschlossen')).toEqual({ label: 'Abgeschlossen', className: 'primary' });
        });

        it('should return the correct status info for "storniert"', () => {
            expect(helpers.getTerminStatusInfo('storniert')).toEqual({ label: 'Storniert', className: 'secondary' });
        });

        it('should return default status info for unknown status', () => {
            expect(helpers.getTerminStatusInfo('unknown')).toEqual({ label: 'Unbekannt', className: 'secondary' });
        });
    });

    describe('getProjektStatusInfo', () => {
        it('should return the correct status info for "neu"', () => {
            expect(helpers.getProjektStatusInfo('neu')).toEqual({ label: 'Neu', className: 'info' });
        });

        it('should return the correct status info for "in_bearbeitung"', () => {
            expect(helpers.getProjektStatusInfo('in_bearbeitung')).toEqual({ label: 'In Bearbeitung', className: 'primary' });
        });

        it('should return the correct status info for "abgeschlossen"', () => {
            expect(helpers.getProjektStatusInfo('abgeschlossen')).toEqual({ label: 'Abgeschlossen', className: 'success' });
        });

        it('should return the correct status info for "storniert"', () => {
            expect(helpers.getProjektStatusInfo('storniert')).toEqual({ label: 'Storniert', className: 'secondary' });
        });

        it('should return default status info for unknown status', () => {
            expect(helpers.getProjektStatusInfo('unknown')).toEqual({ label: 'Unbekannt', className: 'secondary' });
        });
    });

    describe('getBenutzerStatusInfo', () => {
        it('should return the correct status info for "aktiv"', () => {
            expect(helpers.getBenutzerStatusInfo('aktiv')).toEqual({ label: 'Aktiv', className: 'success' });
        });

        it('should return the correct status info for "inaktiv"', () => {
            expect(helpers.getBenutzerStatusInfo('inaktiv')).toEqual({ label: 'Inaktiv', className: 'secondary' });
        });

        it('should return the correct status info for "gesperrt"', () => {
            expect(helpers.getBenutzerStatusInfo('gesperrt')).toEqual({ label: 'Gesperrt', className: 'danger' });
        });

        it('should return default status info for unknown status', () => {
            expect(helpers.getBenutzerStatusInfo('unknown')).toEqual({ label: 'Unbekannt', className: 'secondary' });
        });
    });

    describe('generateId', () => {
        it('should generate an ID of default length 8', () => {
            const id = helpers.generateId();
            expect(id).toHaveLength(8);
        });

        it('should generate an ID of specified length', () => {
            const id = helpers.generateId(12);
            expect(id).toHaveLength(12);
        });

        it('should generate a random ID', () => {
            const id1 = helpers.generateId();
            const id2 = helpers.generateId();
            expect(id1).not.toEqual(id2);
        });
    });

    describe('parseFilters', () => {
        it('should parse pagination parameters', () => {
            const query = { page: '2', limit: '10' };
            const filters = helpers.parseFilters(query);
            expect(filters.page).toBe(2);
            expect(filters.limit).toBe(10);
        });

        it('should use default pagination values if not provided', () => {
            const query = {};
            const filters = helpers.parseFilters(query);
            expect(filters.page).toBe(1);
            expect(filters.limit).toBe(20);
        });

        it('should parse sorting parameters', () => {
            const query = { sort: 'name:desc' };
            const filters = helpers.parseFilters(query);
            expect(filters.sort).toEqual({ field: 'name', direction: 'DESC' });
        });

        it('should use default sorting values if not provided', () => {
            const query = {};
            const filters = helpers.parseFilters(query);
            expect(filters.sort).toBeUndefined();
        });

        it('should parse date range parameters', () => {
            const query = { start_date: '2024-01-01', end_date: '2024-01-31' };
            const filters = helpers.parseFilters(query);
            expect(filters.start_date).toEqual(new Date('2024-01-01'));
            expect(filters.end_date).toEqual(new Date('2024-01-31'));
        });

        it('should set end_date to today if only start_date is provided', () => {
            const query = { start_date: '2024-01-01' };
            const filters = helpers.parseFilters(query);
            expect(filters.start_date).toEqual(new Date('2024-01-01'));
            expect(filters.end_date).toBeInstanceOf(Date);
        });

        it('should parse search parameter', () => {
            const query = { search: 'test search' };
            const filters = helpers.parseFilters(query);
            expect(filters.search).toBe('test search');
        });

        it('should parse status parameter', () => {
            const query = { status: 'active' };
            const filters = helpers.parseFilters(query);
            expect(filters.status).toBe('active');
        });

        it('should parse type parameter', () => {
            const query = { type: 'new' };
            const filters = helpers.parseFilters(query);
            expect(filters.type).toBe('new');
        });

        it('should combine all filters', () => {
            const query = {
                page: '2',
                limit: '10',
                sort: 'name:desc',
                start_date: '2024-01-01',
                end_date: '2024-01-31',
                search: 'test search',
                status: 'active',
                type: 'new'
            };
            const filters = helpers.parseFilters(query);
            expect(filters.page).toBe(2);
            expect(filters.limit).toBe(10);
            expect(filters.sort).toEqual({ field: 'name', direction: 'DESC' });
            expect(filters.start_date).toEqual(new Date('2024-01-01'));
            expect(filters.end_date).toEqual(new Date('2024-01-31'));
            expect(filters.search).toBe('test search');
            expect(filters.status).toBe('active');
            expect(filters.type).toBe('new');
        });
    });

    describe('sanitizeLikeString', () => {
        it('should escape special characters in LIKE string', () => {
            expect(helpers.sanitizeLikeString('10%')).toBe('10\\%');
            expect(helpers.sanitizeLikeString('10_')).toBe('10\\_');
            expect(helpers.sanitizeLikeString('10\\')).toBe('10\\\\');
            expect(helpers.sanitizeLikeString('10%_\\')).toBe('10\\%\\_\\\\');
        });

        it('should return an empty string if input is null or undefined', () => {
            expect(helpers.sanitizeLikeString(null)).toBe('');
            expect(helpers.sanitizeLikeString(undefined)).toBe('');
        });

        it('should return the same string if no special characters are present', () => {
            expect(helpers.sanitizeLikeString('test')).toBe('test');
        });
    });

    describe('truncateHtml', () => {
        it('should truncate HTML string to the specified length', () => {
            const html = '<p>This is a test HTML string.</p>';
            const maxLength = 20;
            const truncatedHtml = helpers.truncateHtml(html, maxLength);
            expect(truncatedHtml).toBe('<p>This is a test HT...');
        });

        it('should return the original HTML if it is shorter than the max length', () => {
            const html = '<p>Short HTML.</p>';
            const maxLength = 50;
            const truncatedHtml = helpers.truncateHtml(html, maxLength);
            expect(truncatedHtml).toBe(html);
        });

        it('should handle empty HTML string', () => {
            const html = '';
            const maxLength = 20;
            const truncatedHtml = helpers.truncateHtml(html, maxLength);
            expect(truncatedHtml).toBe('');
        });

        it('should handle null or undefined HTML string', () => {
            const maxLength = 20;
            expect(helpers.truncateHtml(null, maxLength)).toBe(null);
            expect(helpers.truncateHtml(undefined, maxLength)).toBe(undefined);
        });
    });

    describe('groupBy', () => {
        it('should group an array of objects by a specified key', () => {
            const array = [
                { id: 1, category: 'A', value: 10 },
                { id: 2, category: 'B', value: 20 },
                { id: 3, category: 'A', value: 30 },
            ];
            const key = 'category';
            const grouped = helpers.groupBy(array, key);
            expect(grouped).toEqual({
                A: [
                    { id: 1, category: 'A', value: 10 },
                    { id: 3, category: 'A', value: 30 },
                ],
                B: [
                    { id: 2, category: 'B', value: 20 },
                ],
            });
        });

        it('should return an empty object if the array is empty', () => {
            const array = [];
            const key = 'category';
            const grouped = helpers.groupBy(array, key);
            expect(grouped).toEqual({});
        });

        it('should handle a key that does not exist in the objects', () => {
            const array = [
                { id: 1, value: 10 },
                { id: 2, value: 20 },
            ];
            const key = 'category';
            const grouped = helpers.groupBy(array, key);
            expect(grouped).toEqual({
                undefined: [
                    { id: 1, value: 10 },
                    { id: 2, value: 20 },
                ],
            });
        });
    });

    describe('getNotifications', () => {
        it('should return empty notifications if no user session', async () => {
            const req = { session: {} };
            const result = await helpers.getNotifications(req);
            expect(result).toEqual({ items: [], unreadCount: 0, totalCount: 0 });
        });

        it('should return notifications from cache if available', async () => {
            const req = { session: { user: { id: '123' } } };
            const cachedNotifications = { items: [{ id: 1, title: 'Test' }], unreadCount: 1, totalCount: 1 };
            cache.getOrExecute.mockResolvedValue(cachedNotifications);

            const result = await helpers.getNotifications(req);
            expect(result).toEqual(cachedNotifications);
            expect(cache.getOrExecute).toHaveBeenCalledWith('notifications_123', expect.any(Function), 30);
        });

        it('should fetch notifications from database if not in cache', async () => {
            const req = { session: { user: { id: '123' } } };
            const notificationsQuery = {
                rows: [{
                    id: 1,
                    typ: 'anfrage',
                    titel: 'Test Anfrage',
                    erstellt_am: new Date(),
                    gelesen: false,
                    referenz_id: '456'
                }]
            };
            const unreadCountQuery = { rows: [{ count: '1' }] };
            const totalCountQuery = { rows: [{ count: '2' }] };

            db.query.mockResolvedValueOnce(notificationsQuery);
            db.query.mockResolvedValueOnce(unreadCountQuery);
            db.query.mockResolvedValueOnce(totalCountQuery);
            cache.getOrExecute.mockImplementation((key, fn) => fn()); // Simulate cache miss

            const result = await helpers.getNotifications(req);
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), ['123']);
            expect(db.query).toHaveBeenCalledTimes(3);
            expect(result.items).toHaveLength(1);
            expect(result.unreadCount).toBe(1);
            expect(result.totalCount).toBe(2);
        });

        it('should handle errors when fetching notifications', async () => {
            const req = { session: { user: { id: '123' } } };
            cache.getOrExecute.mockRejectedValue(new Error('Test error'));

            const result = await helpers.getNotifications(req);
            expect(result).toEqual({ items: [], unreadCount: 0, totalCount: 0 });
        });
    });

    describe('getNewRequestsCount', () => {

        it('should handle errors when counting new requests', async () => {
            cache.getOrExecute.mockRejectedValue(new Error('Test error'));

            const result = await helpers.getNewRequestsCount();
            expect(result).toBe(0);
        });
    });
});