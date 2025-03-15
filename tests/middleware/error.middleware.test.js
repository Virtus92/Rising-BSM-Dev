const errorMiddleware = require('../../middleware/error.middleware');

describe('Error Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    req = {
      xhr: false,
      headers: {},
      flash: jest.fn(),
      session: { user: { id: 1, name: 'Test User' } }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      render: jest.fn(),
      redirect: jest.fn()
    };
    next = jest.fn();
    console.error = jest.fn(); // Mock console.error to prevent test output pollution
  });

  describe('errorHandler', () => {
    it('should handle API JSON errors', () => {
      const error = new Error('Test error');
      error.statusCode = 400;
      req.xhr = true;

      errorMiddleware.errorHandler(error, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Test error'
      }));
    });

    it('should handle API errors via Accept header', () => {
      const error = new Error('Test error');
      error.statusCode = 400;
      req.headers.accept = 'application/json';

      errorMiddleware.errorHandler(error, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle CSRF errors', () => {
      const error = new Error('Invalid CSRF token');
      error.code = 'EBADCSRFTOKEN';

      errorMiddleware.errorHandler(error, req, res, next);
      expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
      expect(res.redirect).toHaveBeenCalledWith('back');
    });

    it('should handle 404 errors with HTML response', () => {
      const error = new Error('Not found');
      error.statusCode = 404;

      errorMiddleware.errorHandler(error, req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({
        statusCode: 404
      }));
    });

    it('should handle generic errors with HTML response', () => {
      const error = new Error('Server error');
      error.statusCode = 500;

      errorMiddleware.errorHandler(error, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({
        statusCode: 500
      }));
    });
  });

  describe('notFoundHandler', () => {
    it('should set 404 status and call next with error', () => {
      req.originalUrl = '/not-found-route';

      errorMiddleware.notFoundHandler(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('/not-found-route');
    });
  });

  describe('csrfErrorHandler', () => {
    it('should handle CSRF errors for API requests', () => {
      const error = new Error('CSRF token invalid');
      error.code = 'EBADCSRFTOKEN';
      req.xhr = true;

      errorMiddleware.csrfErrorHandler(error, req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'CSRF token verification failed'
      }));
    });

    it('should handle CSRF errors for HTML requests', () => {
      const error = new Error('CSRF token invalid');
      error.code = 'EBADCSRFTOKEN';

      errorMiddleware.csrfErrorHandler(error, req, res, next);
      expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
      expect(res.redirect).toHaveBeenCalledWith('back');
    });

    it('should pass non-CSRF errors to next middleware', () => {
      const error = new Error('Some other error');
      error.code = 'SOMETHING_ELSE';

      errorMiddleware.csrfErrorHandler(error, req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
