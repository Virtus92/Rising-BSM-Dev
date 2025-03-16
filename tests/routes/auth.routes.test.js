const request = require('supertest');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');

// Mock controllers and middleware
jest.mock('../../controllers/auth.controller', () => ({
  login: jest.fn().mockImplementation((req, res, next) => {
    if (req.body.email === 'error@example.com') {
      throw new Error('Invalid credentials');
    }
    return Promise.resolve({
      user: { 
        id: 1, 
        name: 'Test User',
        email: req.body.email,
        role: 'admin'
      },
      remember: req.body.remember === 'on'
    });
  }),
  logout: jest.fn().mockResolvedValue(true),
  forgotPassword: jest.fn().mockResolvedValue({ 
    message: 'Password reset link has been sent to your email' 
  }),
  validateResetToken: jest.fn().mockImplementation((req, res, next) => {
    if (req.params.token === 'invalid-token') {
      throw new Error('Invalid or expired token');
    }
    return Promise.resolve({ email: 'user@example.com' });
  }),
  resetPassword: jest.fn().mockResolvedValue({
    message: 'Password has been updated successfully'
  })
}));

jest.mock('../../middleware/auth', () => ({
  isAuthenticated: (req, res, next) => next(),
  isNotAuthenticated: (req, res, next) => {
    if (req.session && req.session.user && req.path !== '/logout') {
      return res.redirect('/dashboard');
    }
    next();
  }
}));

// Setup app for testing
const setupApp = () => {
  const app = express();
  
  // Mock session
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false
  }));
  
  // Mock flash messages
  app.use(flash());
  
  // Mock CSRF
  app.use((req, res, next) => {
    req.csrfToken = () => 'test-csrf-token';
    next();
  });
  
  // Setup body parser
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  
  // Setup view engine (mock)
  app.set('view engine', 'ejs');
  app.set('views', 'views');
  app.engine('ejs', (path, data, cb) => cb(null, JSON.stringify(data)));
  
  // Load routes
  const authRoutes = require('../../routes/auth.routes');
  app.use('/', authRoutes);
  
  return app;
};

describe('Auth Routes', () => {
  let app;
  
  beforeEach(() => {
    app = setupApp();
    jest.clearAllMocks();
  });
  
  describe('GET /login', () => {
    it('should render login page', async () => {
      const res = await request(app).get('/login');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Login - Rising BSM');
      expect(data.csrfToken).toBe('test-csrf-token');
    });
    
    it('should redirect if already logged in', async () => {
      // Add user to session to simulate logged in state
      const agent = request.agent(app);
      await agent
        .get('/login')
        .set('Cookie', ['connect.sid=test-sid'])
        .set('Accept', 'application/json');
      
      // Add user to session
      const req = { session: { user: { id: 1 } }, path: '/login' };
      const res = { redirect: jest.fn() };
      const next = jest.fn();
      
      const authMiddleware = require('../../middleware/auth');
      authMiddleware.isNotAuthenticated(req, res, next);
      
      expect(res.redirect).toHaveBeenCalledWith('/dashboard');
    });
  });
  
  describe('POST /login', () => {
    it('should process valid login and redirect to dashboard', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
          remember: 'on'
        });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');
    });
    
    it('should handle login errors', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'error@example.com',
          password: 'password123'
        });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });
  
  describe('GET /logout', () => {
    it('should process logout and redirect to login', async () => {
      // Setup session with user
      const agent = request.agent(app);
      agent.attachCookies = true;

      const res = await agent
        .get('/logout')
        .set('Cookie', ['connect.sid=test-sid']);
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });
  
  describe('GET /forgot-password', () => {
    it('should render forgot password page', async () => {
      const res = await request(app).get('/forgot-password');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Passwort vergessen - Rising BSM');
      expect(data.csrfToken).toBe('test-csrf-token');
    });
  });
  
  describe('POST /forgot-password', () => {
    it('should process forgot password request', async () => {
      const res = await request(app)
        .post('/forgot-password')
        .send({ email: 'user@example.com' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
    
    it('should handle errors in forgot password flow', async () => {
      const authController = require('../../controllers/auth.controller');
      authController.forgotPassword.mockRejectedValueOnce(new Error('Email not found'));
      
      const res = await request(app)
        .post('/forgot-password')
        .send({ email: 'nonexistent@example.com' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/forgot-password');
    });
  });
  
  describe('GET /reset-password/:token', () => {
    it('should render reset password page for valid token', async () => {
      const res = await request(app).get('/reset-password/valid-token');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Passwort zurücksetzen - Rising BSM');
      expect(data.token).toBe('valid-token');
      expect(data.email).toBe('user@example.com');
    });
    
    it('should redirect for invalid token', async () => {
      const res = await request(app).get('/reset-password/invalid-token');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });
  
  describe('POST /reset-password/:token', () => {
    it('should process password reset and redirect to login', async () => {
      const res = await request(app)
        .post('/reset-password/valid-token')
        .send({
          password: 'newpassword123',
          confirm_password: 'newpassword123',
          email: 'user@example.com'
        });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
    
    it('should handle errors in password reset', async () => {
      const authController = require('../../controllers/auth.controller');
      authController.resetPassword.mockRejectedValueOnce(new Error('Passwords do not match'));
      
      const res = await request(app)
        .post('/reset-password/valid-token')
        .send({
          password: 'newpassword123',
          confirm_password: 'differentpassword',
          email: 'user@example.com'
        });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/reset-password/valid-token');
    });
  });
});
