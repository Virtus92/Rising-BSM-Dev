const authMiddleware = require('../../middleware/auth.middleware');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            session: {},
            headers: {},
            flash: jest.fn()
        };
        res = {
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    describe('isAuthenticated', () => {
        it('should call next if user is authenticated', () => {
            req.session.user = { id: 1 };
            authMiddleware.isAuthenticated(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should redirect to /login if user is not authenticated (regular request)', () => {
            authMiddleware.isAuthenticated(req, res, next);
            expect(res.redirect).toHaveBeenCalledWith('/login');
        });

        it('should return 401 if user is not authenticated (API request - xhr)', () => {
            req.xhr = true;
            authMiddleware.isAuthenticated(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Authentication required',
                redirect: '/login'
            });
        });

        it('should return 401 if user is not authenticated (API request - accept header)', () => {
            req.headers.accept = 'application/json';
            authMiddleware.isAuthenticated(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Authentication required',
                redirect: '/login'
            });
        });
    });

    describe('isAdmin', () => {
        it('should call next if user is admin', () => {
            req.session.user = { role: 'admin' };
            authMiddleware.isAdmin(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should redirect to /dashboard with flash message if user is not admin (regular request)', () => {
            req.session.user = { role: 'employee' };
            authMiddleware.isAdmin(req, res, next);
            expect(req.flash).toHaveBeenCalledWith('error', 'Sie haben keine Berechtigung für diesen Bereich.');
            expect(res.redirect).toHaveBeenCalledWith('/dashboard');
        });

        it('should return 403 if user is not admin (API request - xhr)', () => {
            req.xhr = true;
            req.session.user = { role: 'employee' };
            authMiddleware.isAdmin(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Admin privileges required',
                redirect: '/dashboard'
            });
        });

        it('should return 403 if user is not admin (API request - accept header)', () => {
            req.headers.accept = 'application/json';
            req.session.user = { role: 'employee' };
            authMiddleware.isAdmin(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Admin privileges required',
                redirect: '/dashboard'
            });
        });
    });

    describe('isManager', () => {
        it('should call next if user is manager', () => {
            req.session.user = { role: 'manager' };
            authMiddleware.isManager(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should call next if user is admin', () => {
            req.session.user = { role: 'admin' };
            authMiddleware.isManager(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should redirect to /dashboard with flash message if user is not manager or admin (regular request)', () => {
            req.session.user = { role: 'employee' };
            authMiddleware.isManager(req, res, next);
            expect(req.flash).toHaveBeenCalledWith('error', 'Sie haben keine Berechtigung für diesen Bereich.');
            expect(res.redirect).toHaveBeenCalledWith('/dashboard');
        });

        it('should return 403 if user is not manager or admin (API request - xhr)', () => {
            req.xhr = true;
            req.session.user = { role: 'employee' };
            authMiddleware.isManager(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Manager privileges required',
                redirect: '/dashboard'
            });
        });

        it('should return 403 if user is not manager or admin (API request - accept header)', () => {
            req.headers.accept = 'application/json';
            req.session.user = { role: 'employee' };
            authMiddleware.isManager(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Manager privileges required',
                redirect: '/dashboard'
            });
        });
    });

    describe('isEmployee', () => {
        it('should call next if user is employee', () => {
            req.session.user = { role: 'employee' };
            authMiddleware.isEmployee(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should call next if user is manager', () => {
            req.session.user = { role: 'manager' };
            authMiddleware.isEmployee(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should call next if user is admin', () => {
            req.session.user = { role: 'admin' };
            authMiddleware.isEmployee(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should redirect to /dashboard with flash message if user is not employee, manager or admin (regular request)', () => {
            req.session.user = { role: 'guest' };
            authMiddleware.isEmployee(req, res, next);
            expect(req.flash).toHaveBeenCalledWith('error', 'Sie haben keine Berechtigung für diesen Bereich.');
            expect(res.redirect).toHaveBeenCalledWith('/dashboard');
        });

        it('should return 403 if user is not employee, manager or admin (API request - xhr)', () => {
            req.xhr = true;
            req.session.user = { role: 'guest' };
            authMiddleware.isEmployee(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Employee privileges required',
                redirect: '/dashboard'
            });
        });

        it('should return 403 if user is not employee, manager or admin (API request - accept header)', () => {
            req.headers.accept = 'application/json';
            req.session.user = { role: 'guest' };
            authMiddleware.isEmployee(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Employee privileges required',
                redirect: '/dashboard'
            });
        });
    });

    describe('isNotAuthenticated', () => {
        it('should call next if user is not authenticated', () => {
            authMiddleware.isNotAuthenticated(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should redirect to /dashboard if user is authenticated', () => {
            req.session.user = { id: 1 };
            authMiddleware.isNotAuthenticated(req, res, next);
            expect(res.redirect).toHaveBeenCalledWith('/dashboard');
        });
    });
});