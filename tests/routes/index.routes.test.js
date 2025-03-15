const request = require('supertest');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const rateLimit = require('express-rate-limit');

// Mock controllers and middleware
jest.mock('../../controllers/contact.controller', () => ({
  submitContact: jest.fn().mockImplementation((req, res) => {
    if (req.body.email === 'error@example.com') {
      return res.status(400).json({ success: false, message: 'Error submitting form' });
    }
    res.status(200).json({ success: true, message: 'Contact form submitted successfully' });
  })
}));

// Mock rate limiter
jest.mock('express-rate-limit', () => {
  return jest.fn().mockImplementation((options) => {
    return (req, res, next) => {
      // Simulate rate limiting for specific test email
      if (req.body.email === 'ratelimited@example.com') {
        return res.status(429).json(options.message);
      }
      next();
    };
  });
});

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
  const indexRoutes = require('../../routes/index');
  app.use('/', indexRoutes);
  
  return app;
};

describe('Index Routes', () => {
  let app;
  
  beforeEach(() => {
    app = setupApp();
    jest.clearAllMocks();
  });
  
  describe('GET /', () => {
    it('should render home page', async () => {
      const res = await request(app).get('/');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Rising BSM – Ihre Allround-Experten');
    });
  });
  
  describe('GET /impressum', () => {
    it('should render imprint page', async () => {
      const res = await request(app).get('/impressum');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Rising BSM – Impressum');
    });
  });
  
  describe('GET /datenschutz', () => {
    it('should render privacy policy page', async () => {
      const res = await request(app).get('/datenschutz');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Rising BSM – Datenschutz');
    });
  });
  
  describe('GET /agb', () => {
    it('should render terms and conditions page', async () => {
      const res = await request(app).get('/agb');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Rising BSM – AGB');
    });
  });
  
  describe('POST /contact', () => {
    it('should submit contact form successfully', async () => {
      const res = await request(app)
        .post('/contact')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          message: 'This is a test message',
          service: 'website',
          phone: '123456789'
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Contact form submitted successfully'
      });
    });
    
    it('should handle validation errors', async () => {
      const res = await request(app)
        .post('/contact')
        .send({
          name: 'Test User',
          email: 'error@example.com',
          message: 'This will trigger an error'
        });
      
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Error submitting form'
      });
    });
    
    it('should handle rate limiting', async () => {
      const res = await request(app)
        .post('/contact')
        .send({
          name: 'Rate Limited',
          email: 'ratelimited@example.com',
          message: 'This request should be rate limited'
        });
      
      expect(res.status).toBe(429);
      expect(res.body).toEqual({
        success: false,
        error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.'
      });
    });
  });
});
