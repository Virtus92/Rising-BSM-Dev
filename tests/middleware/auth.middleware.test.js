const authMiddleware = require('../../middleware/auth.middleware');

describe('Auth Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      session: {},
      xhr: false,
      headers: {},
      flash: jest.fn()
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn()
    };
    next = jest.fn();
  });

  describe('isAuthenticated', () => {
    it('should call next if user is authenticated', () => {
      req.session.user = { id: 1 };
      
      authMiddleware.isAuthenticated(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it('should redirect to login for non-authenticated regular requests', () => {
      req.session.user = null;
      
      authMiddleware.isAuthenticated(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    it('should return 401 JSON for non-authenticated API requests', () => {
      req.session.user = null;
      req.xhr = true;
      
      authMiddleware.isAuthenticated(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false
      }));
    });

    it('should return 401 JSON for Accept: application/json requests', () => {
      req.session.user = null;
      req.headers.accept = 'application/json';
      
      authMiddleware.isAuthenticated(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    it('should call next if user is admin', () => {
      req.session.user = { id: 1, role: 'admin' };
      
      authMiddleware.isAdmin(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should redirect non-admin users for regular requests', () => {
      req.session.user = { id: 1, role: 'employee' };
      
      authMiddleware.isAdmin(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(req.flash).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/dashboard');
    });

    it('should return 403 JSON for non-admin API requests', () => {
      req.session.user = { id: 1, role: 'employee' };
      req.xhr = true;
      
      authMiddleware.isAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false
      }));
    });
  });

  describe('isManager', () => {
    it('should call next if user is admin', () => {
      req.session.user = { id: 1, role: 'admin' };
      
      authMiddleware.isManager(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should call next if user is manager', () => {
      req.session.user = { id: 1, role: 'manager' };
      
      authMiddleware.isManager(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should redirect non-manager users', () => {
      req.session.user = { id: 1, role: 'employee' };
      
      authMiddleware.isManager(req, res, next);
      
      expect(res.redirect).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('isEmployee', () => {
    it('should call next for admin, manager, or employee users', () => {
      const roles = ['admin', 'manager', 'employee'];
      
      roles.forEach(role => {
        req.session.user = { id: 1, role };
        next.mockClear();
        
        authMiddleware.isEmployee(req, res, next);
        
        expect(next).toHaveBeenCalled();
      });
    });

    it('should redirect customer users', () => {
      req.session.user = { id: 1, role: 'customer' };
      
      authMiddleware.isEmployee(req, res, next);
      
      expect(res.redirect).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('isNotAuthenticated', () => {
    it('should call next if user is not authenticated', () => {
      req.session.user = null;
      
      authMiddleware.isNotAuthenticated(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should redirect to dashboard if user is authenticated', () => {
      req.session.user = { id: 1 };
      
      authMiddleware.isNotAuthenticated(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/dashboard');
    });
  });
});
