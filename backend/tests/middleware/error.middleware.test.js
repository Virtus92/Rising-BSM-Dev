const { errorHandler, notFoundHandler, csrfErrorHandler, defaultHandler } = require('../../middleware/error.middleware');

describe('Error Middleware', () => {
    let req, res, next;
    
    beforeEach(() => {

        req = {
            xhr: false,
            headers: { accept: 'text/html' },
            flash: jest.fn(),
            session: { user: { id: 1, name: 'Test User' } },
            originalUrl: '/test-url'
        };
        
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            render: jest.fn(),
            redirect: jest.fn()
        };
        
        next = jest.fn();
        console.error = jest.fn();
    });
    
    describe('errorHandler', () => {
        test('should handle API requests with JSON response', () => {
            req.xhr = true;
            const error = new Error('Test error');
            error.statusCode = 400;
            
            errorHandler(error, req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Test error'
            }));
        });
        
        test('should handle 404 errors with not found page', () => {
            const error = new Error('Page not found');
            error.statusCode = 404;
            
            errorHandler(error, req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({
                title: 'Seite nicht gefunden - Rising BSM',
                statusCode: 404
            }));
        });
        
        test('should include stack trace in non-production environment', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            req.xhr = true;
            const error = new Error('Test error');
            
            errorHandler(error, req, res, next);
            
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                stack: expect.any(String)
            }));
            
            process.env.NODE_ENV = originalEnv;
        });
        
        test('should handle CSRF errors with redirect', () => {
            const error = new Error('CSRF error');
            error.code = 'EBADCSRFTOKEN';
            
            errorHandler(error, req, res, next);
            
            expect(req.flash).toHaveBeenCalledWith('error', 'Das Formular ist abgelaufen. Bitte versuchen Sie es erneut.');
            expect(res.redirect).toHaveBeenCalledWith('back');
        });

        test('should handle rendering error page with status code and message', () => {
            const statusCode = 500;
            const message = 'Internal Server Error';
            const err = new Error(message);
        
            errorHandler(err, req, res, next);
        
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.render).toHaveBeenCalledWith('error', {
            title: 'Fehler - Rising BSM',
            statusCode: 500,
            message: message,
            error: err,
            user: { id: 1, name: 'Test User' }
            });
        });

        test('should handle regular requests with error page', () => {
            const error = new Error('Test error');
            error.statusCode = 500;
        
            errorHandler(error, req, res, next);
        
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({
            title: 'Fehler - Rising BSM',
            statusCode: 500,
            user: { id: 1, name: 'Test User' }
            }));
        });

    });
    
    describe('notFoundHandler', () => {
        test('should create a 404 error and pass it to next', () => {
            notFoundHandler(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(404);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });
    
    describe('csrfErrorHandler', () => {
        test('should handle CSRF errors for API requests', () => {
            req.xhr = true;
            const error = new Error('CSRF error');
            error.code = 'EBADCSRFTOKEN';
            
            csrfErrorHandler(error, req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'CSRF token verification failed'
            }));
        });
        
        test('should pass non-CSRF errors to next middleware', () => {
            const error = new Error('Non-CSRF error');
            
            csrfErrorHandler(error, req, res, next);
            
            expect(next).toHaveBeenCalledWith(error);
        });

        test('should handle CSRF errors for regular requests with redirect', () => {
            req.xhr = false;
            const error = new Error('CSRF error');
            error.code = 'EBADCSRFTOKEN';
        
            csrfErrorHandler(error, req, res, next);
        
            expect(req.flash).toHaveBeenCalledWith('error', 'Das Formular ist abgelaufen. Bitte versuchen Sie es erneut.');
            expect(res.redirect).toHaveBeenCalledWith('back');
        });
    });
    
    describe('default error handler', () => {
        test('should return JSON response with appropriate status code', () => {
            const error = new Error('Default error');
            error.statusCode = 400;
            
            defaultHandler(error, req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Default error'
            }));
        });
    });
});