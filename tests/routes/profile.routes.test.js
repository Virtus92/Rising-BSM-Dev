const request = require('supertest');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const multer = require('multer');
const path = require('path');

// Mock multer
jest.mock('multer', () => {
  const multerMock = {
    diskStorage: jest.fn().mockReturnValue({}),
    single: jest.fn().mockImplementation((fieldName) => {
      return (req, res, next) => {
        if (req.fileTestError) {
          return next(req.fileTestError);
        }
        if (req.fileTestEnabled) {
          req.file = {
            filename: 'test-profile-pic.jpg',
            path: path.join('uploads', 'profile', 'test-profile-pic.jpg'),
            mimetype: 'image/jpeg'
          };
          req.body = { profile_picture_label: 'My profile picture' };
        }
        return next();
      };
    })
  };
  return multerMock;
});

// Mock controllers and middleware
jest.mock('../../controllers/profile.controller', () => ({
  getUserProfile: jest.fn().mockResolvedValue({
    user: { 
      id: 1, 
      name: 'Test User', 
      email: 'user@test.com', 
      profile_picture: 'default.jpg'
    },
    settings: { notifications: { email: true, app: true } },
    activity: [{ action: 'login', date: new Date() }]
  }),
  updateProfile: jest.fn().mockResolvedValue({
    user: { id: 1, name: 'Updated Name' },
    message: 'Profile updated successfully'
  }),
  updatePassword: jest.fn().mockResolvedValue({
    success: true,
    message: 'Password updated successfully'
  }),
  updateProfilePicture: jest.fn().mockResolvedValue({
    success: true,
    profile_picture: 'test-profile-pic.jpg',
    message: 'Profile picture updated successfully'
  }),
  updateNotificationSettings: jest.fn().mockResolvedValue({
    success: true,
    message: 'Notification settings updated successfully'
  })
}));

jest.mock('../../middleware/auth.middleware', () => ({
  isAuthenticated: (req, res, next) => next()
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
  
  // Add session user
  app.use((req, res, next) => {
    req.session.user = { id: 1, name: 'Test User' };
    req.newRequestsCount = 5;
    next();
  });
  
  // Setup view engine (mock)
  app.set('view engine', 'ejs');
  app.set('views', 'views');
  app.engine('ejs', (path, data, cb) => cb(null, JSON.stringify(data)));
  
  // Load routes
  const profileRoutes = require('../../routes/profile.routes');
  app.use('/dashboard/profile', profileRoutes);
  
  return app;
};

describe('Profile Routes', () => {
  let app;
  
  beforeEach(() => {
    app = setupApp();
    jest.clearAllMocks();
  });
  
  describe('GET /', () => {
    it('should render profile page with user data', async () => {
      const res = await request(app).get('/dashboard/profile');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Mein Profil - Rising BSM');
      expect(data.userProfile.email).toBe('user@test.com');
    });
    
    it('should handle errors and pass to error middleware', async () => {
      const profileController = require('../../controllers/profile.controller');
      profileController.getUserProfile.mockRejectedValueOnce(new Error('Database error'));
      
      const res = await request(app).get('/dashboard/profile');
      expect(res.status).toBe(500);
    });
  });
  
  describe('POST /update', () => {
    it('should update user profile and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/profile/update')
        .send({ name: 'Updated Name', email: 'updated@test.com' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/profile');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/profile/update')
        .set('Accept', 'application/json')
        .send({ name: 'Updated Name', email: 'updated@test.com' });
      
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Updated Name');
    });
    
    it('should handle validation errors', async () => {
      const profileController = require('../../controllers/profile.controller');
      const error = new Error('Validation failed');
      error.statusCode = 400;
      profileController.updateProfile.mockRejectedValueOnce(error);
      
      const res = await request(app)
        .post('/dashboard/profile/update')
        .send({ name: '' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/profile');
    });
  });
  
  describe('POST /password', () => {
    it('should update user password and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/profile/password')
        .send({ 
          current_password: 'oldpass', 
          new_password: 'newpass',
          confirm_password: 'newpass'
        });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/profile');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/profile/password')
        .set('Accept', 'application/json')
        .send({ 
          current_password: 'oldpass', 
          new_password: 'newpass',
          confirm_password: 'newpass'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    
    it('should handle validation errors', async () => {
      const profileController = require('../../controllers/profile.controller');
      const error = new Error('Passwords do not match');
      error.statusCode = 400;
      profileController.updatePassword.mockRejectedValueOnce(error);
      
      const res = await request(app)
        .post('/dashboard/profile/password')
        .send({ 
          current_password: 'oldpass', 
          new_password: 'newpass',
          confirm_password: 'wrongpass'
        });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/profile');
    });
  });
  
  describe('POST /picture', () => {
    it('should update profile picture and redirect', async () => {
      const req = request(app)
        .post('/dashboard/profile/picture')
        .field('profile_picture_label', 'My profile picture');
      
      // Enable mock file for this test
      req.app.request.fileTestEnabled = true;
      
      const res = await req;
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/profile');
    });
    
    it('should handle missing file', async () => {
      const res = await request(app)
        .post('/dashboard/profile/picture')
        .field('profile_picture_label', 'My profile picture');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/profile');
    });
    
    it('should handle file upload errors', async () => {
      const profileController = require('../../controllers/profile.controller');
      const error = new Error('Invalid image format');
      error.statusCode = 400;
      profileController.updateProfilePicture.mockRejectedValueOnce(error);
      
      const req = request(app)
        .post('/dashboard/profile/picture')
        .field('profile_picture_label', 'My profile picture');
      
      // Enable mock file for this test
      req.app.request.fileTestEnabled = true;
      
      const res = await req;
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/profile');
    });
  });
  
  describe('POST /notifications', () => {
    it('should update notification settings and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/profile/notifications')
        .send({ email_notifications: 'on', app_notifications: 'on' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/profile');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/profile/notifications')
        .set('Accept', 'application/json')
        .send({ email_notifications: 'on', app_notifications: 'on' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    
    it('should handle validation errors', async () => {
      const profileController = require('../../controllers/profile.controller');
      const error = new Error('Invalid notification settings');
      error.statusCode = 400;
      profileController.updateNotificationSettings.mockRejectedValueOnce(error);
      
      const res = await request(app)
        .post('/dashboard/profile/notifications')
        .send({ email_notifications: 'invalid' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/profile');
    });
  });
});
