const authMiddleware = require('../../middleware/auth');

describe('Auth Middleware', () => {
  // Test for isAuthenticated middleware
  describe('isAuthenticated', () => {
    test('should call next() if user is authenticated', () => {
      const req = {
        session: {
          user: { id: 1, name: 'Test User' }
        }
      };
      const res = {
        redirect: jest.fn()
      };
      const next = jest.fn();

      authMiddleware.isAuthenticated(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    test('should redirect to login if user is not authenticated', () => {
      const req = {
        session: {}
      };
      const res = {
        redirect: jest.fn()
      };
      const next = jest.fn();

      authMiddleware.isAuthenticated(req, res, next);
      expect(res.redirect).toHaveBeenCalledWith('/login');
      expect(next).not.toHaveBeenCalled();
    });
  });

  // Test for isAdmin middleware
  describe('isAdmin', () => {
    test('should call next() if user is admin', () => {
      const req = {
        session: {
          user: { id: 1, name: 'Admin', role: 'admin' }
        },
        flash: jest.fn()
      };
      const res = {
        redirect: jest.fn()
      };
      const next = jest.fn();

      authMiddleware.isAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    test('should redirect to dashboard if user is not admin', () => {
      const req = {
        session: {
          user: { id: 1, name: 'User', role: 'employee' }
        },
        flash: jest.fn()
      };
      const res = {
        redirect: jest.fn()
      };
      const next = jest.fn();

      authMiddleware.isAdmin(req, res, next);
      expect(res.redirect).toHaveBeenCalledWith('/dashboard');
      expect(next).not.toHaveBeenCalled();
      expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
    });
  });

  // Test for isManager middleware
  describe('isManager', () => {
    test('should call next() if user is manager', () => {
      const req = {
        session: {
          user: { id: 1, name: 'Manager', role: 'manager' }
        },
        flash: jest.fn()
      };
      const res = {
        redirect: jest.fn()
      };
      const next = jest.fn();

      authMiddleware.isManager(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    test('should call next() if user is admin', () => {
      const req = {
        session: {
          user: { id: 1, name: 'Admin', role: 'admin' }
        },
        flash: jest.fn()
      };
      const res = {
        redirect: jest.fn()
      };
      const next = jest.fn();

      authMiddleware.isManager(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    test('should redirect to dashboard if user is neither admin nor manager', () => {
      const req = {
        session: {
          user: { id: 1, name: 'User', role: 'employee' }
        },
        flash: jest.fn()
      };
      const res = {
        redirect: jest.fn()
      };
      const next = jest.fn();

      authMiddleware.isManager(req, res, next);
      expect(res.redirect).toHaveBeenCalledWith('/dashboard');
      expect(next).not.toHaveBeenCalled();
      expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
    });
  });
});