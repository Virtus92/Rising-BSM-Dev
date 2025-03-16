const contactController = require('../../controllers/contact.controller');
const { mockDbClient } = require('../setup');
const NotificationService = require('../../services/notification.service');
const { validateInput } = require('../../utils/validators');
const { sendMail } = require('../../services/mail.service');

// Mock dependencies
jest.mock('../../utils/validators', () => ({
  validateInput: jest.fn()
}));

jest.mock('../../services/notification.service', () => ({
  create: jest.fn()
}));

describe('Contact Controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {
        name: 'Max Mustermann',
        email: 'max@example.com',
        telefon: '030 12345678',
        nachricht: 'Test Nachricht'
      },
      flash: jest.fn(),
      get: jest.fn()
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn()
    };

    mockNext = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default successful validation
    validateInput.mockReturnValue({ isValid: true, errors: {} });
    
    // Setup default successful DB response
    mockDbClient.query.mockResolvedValue({ 
      rows: [{ id: 1, ...mockReq.body }],
      rowCount: 1
    });

    process.env.CONTACT_EMAIL = 'contact@example.com';
  });

  describe('submitContact', () => {
    test('should successfully submit contact form (HTML request)', async () => {
      // Arrange
      mockReq.get.mockReturnValue('text/html');
      
      // Act
      await contactController.submitContact(mockReq, mockRes, mockNext);

      // Assertions
      expect(validateInput).toHaveBeenCalledWith(mockReq.body, expect.any(Object));
      expect(mockDbClient.query).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO kontaktanfragen/),
        expect.arrayContaining([
          'Max Mustermann',
          'max@example.com',
          '030 12345678',
          'Test Nachricht'
        ])
      );
      expect(NotificationService.create).toHaveBeenCalledTimes(2);
      expect(mockReq.flash).toHaveBeenCalledWith('success', expect.any(String));
      expect(mockRes.redirect).toHaveBeenCalledWith('/');
    });

    test('should successfully submit contact form (JSON request)', async () => {
      // Arrange
      mockReq.get.mockReturnValue('application/json');
      
      // Act
      await contactController.submitContact(mockReq, mockRes, mockNext);

      // Assertions
      expect(validateInput).toHaveBeenCalledWith(mockReq.body, expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
        data: expect.any(Object)
      });
    });

    test('should handle validation errors', async () => {
      // Arrange
      mockReq.get.mockReturnValue('application/json');
      validateInput.mockReturnValue({
        isValid: false,
        errors: { email: 'Invalid email' }
      });

      // Act
      await contactController.submitContact(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        errors: expect.any(Object)
      });
    });

    test('should handle database errors (HTML request)', async () => {
      // Arrange
      mockReq.get.mockReturnValue('text/html');
      mockDbClient.query.mockRejectedValue(new Error('Database error'));

      // Act
      await contactController.submitContact(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockReq.flash).toHaveBeenCalledWith('error', expect.any(String));
      expect(mockRes.redirect).toHaveBeenCalledWith('/');
    });

    test('should handle database errors (JSON request)', async () => {
      // Arrange
      mockReq.get.mockReturnValue('application/json');
      mockDbClient.query.mockRejectedValue(new Error('Database error'));

      // Act
      await contactController.submitContact(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String)
      });
    });

    test('should handle unique constraint violations', async () => {
      // Arrange
      mockReq.get.mockReturnValue('application/json');
      const uniqueError = new Error('duplicate key value');
      uniqueError.code = '23505';
      mockDbClient.query.mockRejectedValue(uniqueError);

      // Act
      await contactController.submitContact(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('bereits übermittelt')
      });
    });

    test('sollte Kontaktanfrage erfolgreich verarbeiten', async () => {
      mockReq.body = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        telefon: '030 12345678',
        nachricht: 'Test Nachricht'
      };

      mockDbClient.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      sendMail.mockResolvedValueOnce();

      await contactController.submitContact(mockReq, mockRes, mockNext);

      expect(mockDbClient.query).toHaveBeenCalledWith(
        'INSERT INTO kontaktanfragen (name, email, telefon, nachricht) VALUES ($1, $2, $3, $4)',
        ['Max Mustermann', 'max@example.com', '030 12345678', 'Test Nachricht']
      );
      expect(sendMail).toHaveBeenCalledWith({
        to: 'contact@example.com',
        subject: 'Neue Kontaktanfrage',
        text: expect.stringContaining('Max Mustermann')
      });
      expect(mockReq.flash).toHaveBeenCalledWith('success', 'Ihre Nachricht wurde erfolgreich gesendet');
      expect(mockRes.redirect).toHaveBeenCalledWith('/contact');
    });

    test('sollte Validierungsfehler bei fehlenden Pflichtfeldern erkennen', async () => {
      mockReq.body = {
        name: '',
        email: 'invalid-email',
        telefon: '123',
        nachricht: ''
      };

      await contactController.submitContact(mockReq, mockRes, mockNext);

      expect(mockReq.flash).toHaveBeenCalledWith('error', 'Bitte überprüfen Sie Ihre Eingaben');
      expect(mockRes.redirect).toHaveBeenCalledWith('/contact');
    });

    test('sollte zu lange Nachricht erkennen', async () => {
      mockReq.body = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        telefon: '030 12345678',
        nachricht: 'X'.repeat(2001)
      };

      await contactController.submitContact(mockReq, mockRes, mockNext);

      expect(mockReq.flash).toHaveBeenCalledWith('error', 'Bitte überprüfen Sie Ihre Eingaben');
      expect(mockRes.redirect).toHaveBeenCalledWith('/contact');
    });

    test('sollte Datenbankfehler behandeln', async () => {
      mockReq.body = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        telefon: '030 12345678',
        nachricht: 'Test Nachricht'
      };

      const error = new Error('Datenbankfehler');
      mockDbClient.query.mockRejectedValueOnce(error);

      await contactController.submitContact(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getContactRequest', () => {
    test('should return contact request details', async () => {
      // Arrange
      mockReq.params = { id: '1' };
      const mockContactRequest = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message'
      };
      mockDbClient.query.mockResolvedValue({ rows: [mockContactRequest] });

      // Act
      await contactController.getContactRequest(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockDbClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM kontaktanfragen'),
        ['1']
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockContactRequest
      });
    });

    test('should handle contact request not found', async () => {
      // Arrange
      mockReq.params = { id: '999' };
      mockDbClient.query.mockResolvedValue({ rows: [] });

      // Act
      await contactController.getContactRequest(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain('nicht gefunden');
    });

    test('should handle database errors', async () => {
      // Arrange
      mockReq.params = { id: '1' };
      const error = new Error('Database error');
      mockDbClient.query.mockRejectedValue(error);

      // Act
      await contactController.getContactRequest(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    test('sollte Kontaktanfrage erfolgreich abrufen', async () => {
      mockReq.params.id = '1';
      
      const mockContact = {
        id: 1,
        name: 'Max Mustermann',
        email: 'max@example.com',
        telefon: '030 12345678',
        nachricht: 'Test Nachricht',
        created_at: new Date()
      };

      mockDbClient.query.mockResolvedValueOnce({ rows: [mockContact] });

      await contactController.getContactRequest(mockReq, mockRes, mockNext);

      expect(mockDbClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM kontaktanfragen'),
        ['1']
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockContact);
    });

    test('sollte 404 bei nicht existierender Anfrage zurückgeben', async () => {
      mockReq.params.id = '999';
      mockDbClient.query.mockResolvedValueOnce({ rows: [] });

      await contactController.getContactRequest(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('Kontaktanfrage nicht gefunden');
      expect(error.statusCode).toBe(404);
    });

    test('sollte Datenbankfehler behandeln', async () => {
      mockReq.params.id = '1';
      
      const error = new Error('Datenbankfehler');
      mockDbClient.query.mockRejectedValueOnce(error);

      await contactController.getContactRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
