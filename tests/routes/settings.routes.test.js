const request = require('supertest');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const csrf = require('csurf');
const settingsController = require('../../controllers/settings.controller');

// Mock des Controllers
jest.mock('../../controllers/settings.controller');

// Mock der Auth-Middleware
jest.mock('../../middleware/auth', () => ({
  isAuthenticated: (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }
    next();
  },
  isAdmin: (req, res, next) => {
    if (!req.session.userRole || req.session.userRole !== 'admin') {
      return res.status(403).json({ message: 'Keine Berechtigung' });
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
  
  // Add session user
  app.use((req, res, next) => {
    req.session.user = { id: 1, name: 'Test User', sprache: 'de', dark_mode: false, role: 'admin' };
    req.newRequestsCount = 5;
    next();
  });
  
  // Setup view engine (mock)
  app.set('view engine', 'ejs');
  app.set('views', 'views');
  app.engine('ejs', (path, data, cb) => cb(null, JSON.stringify(data)));
  
  // Load routes
  const settingsRoutes = require('../../routes/settings.routes');
  app.use('/settings', settingsRoutes);
  
  return app;
};

describe('Settings Routes', () => {
  let app;
  
  beforeEach(() => {
    app = setupApp();
    jest.clearAllMocks();
  });
  
  describe('GET /', () => {
    test('sollte Benutzereinstellungen zurückgeben', async () => {
      const mockSettings = {
        sprache: 'de',
        dark_mode: false,
        benachrichtigungen_email: true
      };

      settingsController.getUserSettings.mockResolvedValue(mockSettings);

      const response = await request(app)
        .get('/settings')
        .expect(200);

      expect(response.body.settings).toEqual(mockSettings);
      expect(settingsController.getUserSettings).toHaveBeenCalledWith(1);
    });

    test('sollte Fehler bei nicht authentifiziertem Benutzer zurückgeben', async () => {
      app.use((req, res, next) => {
        req.session.userId = null;
        next();
      });

      await request(app)
        .get('/settings')
        .expect(401);
    });
  });
  
  describe('POST /update', () => {
    test('sollte Benutzereinstellungen aktualisieren', async () => {
      const settings = {
        sprache: 'en',
        dark_mode: true,
        benachrichtigungen_email: false
      };

      settingsController.updateUserSettings.mockResolvedValue();

      await request(app)
        .post('/settings/update')
        .send(settings)
        .expect(302)
        .expect('Location', '/settings');

      expect(settingsController.updateUserSettings).toHaveBeenCalledWith(1, settings);
    });

    test('sollte Validierungsfehler behandeln', async () => {
      settingsController.updateUserSettings.mockRejectedValue(
        new Error('Ungültige Sprache')
      );

      await request(app)
        .post('/settings/update')
        .send({ sprache: 'invalid' })
        .expect(302)
        .expect('Location', '/settings');
    });
  });
  
  describe('GET /system', () => {
    test('sollte Systemeinstellungen zurückgeben', async () => {
      const mockSettings = {
        maintenance_mode: false,
        backup_interval: 'taeglich'
      };

      settingsController.getSystemSettings.mockResolvedValue(mockSettings);

      const response = await request(app)
        .get('/settings/system')
        .expect(200);

      expect(response.body.settings).toEqual(mockSettings);
    });

    test('sollte Zugriff für Nicht-Admins verweigern', async () => {
      app.use((req, res, next) => {
        req.session.userRole = 'user';
        next();
      });

      await request(app)
        .get('/settings/system')
        .expect(403);
    });
  });
  
  describe('POST /system/update', () => {
    test('sollte Systemeinstellungen aktualisieren', async () => {
      const settings = {
        maintenance_mode: true,
        backup_interval: 'woechentlich'
      };

      settingsController.updateSystemSettings.mockResolvedValue();

      await request(app)
        .post('/settings/system/update')
        .send(settings)
        .expect(302)
        .expect('Location', '/settings/system');

      expect(settingsController.updateSystemSettings).toHaveBeenCalledWith(settings);
    });
  });
  
  describe('GET /backup', () => {
    test('sollte Backup-Einstellungen zurückgeben', async () => {
      const mockData = {
        settings: {
          automatisch: true,
          intervall: 'taeglich'
        },
        backups: [
          { id: 1, dateiname: 'backup1.sql', status: 'erfolgreich' }
        ]
      };

      settingsController.getBackupSettings.mockResolvedValue(mockData);

      const response = await request(app)
        .get('/settings/backup')
        .expect(200);

      expect(response.body.settings).toEqual(mockData.settings);
      expect(response.body.backups).toEqual(mockData.backups);
    });
  });
  
  describe('POST /backup/update', () => {
    test('sollte Backup-Einstellungen aktualisieren', async () => {
      const settings = {
        automatisch: true,
        intervall: 'taeglich',
        zeit: '02:00',
        aufbewahrung: 7
      };

      settingsController.updateBackupSettings.mockResolvedValue();

      await request(app)
        .post('/settings/backup/update')
        .send(settings)
        .expect(302)
        .expect('Location', '/settings/backup');

      expect(settingsController.updateBackupSettings).toHaveBeenCalledWith(settings);
    });
  });
  
  describe('POST /backup/trigger', () => {
    test('sollte manuelles Backup starten', async () => {
      const mockResult = {
        backupId: 1,
        fileName: 'manual_backup_2024-01-01.sql',
        status: 'ausstehend'
      };

      settingsController.triggerManualBackup.mockResolvedValue(mockResult);

      await request(app)
        .post('/settings/backup/trigger')
        .expect(302)
        .expect('Location', '/settings/backup');

      expect(settingsController.triggerManualBackup).toHaveBeenCalled();
    });

    test('sollte Fehler beim Backup-Start behandeln', async () => {
      settingsController.triggerManualBackup.mockRejectedValue(
        new Error('Backup-Fehler')
      );

      await request(app)
        .post('/settings/backup/trigger')
        .expect(302)
        .expect('Location', '/settings/backup');
    });
  });
});
