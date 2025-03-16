const nodemailer = require('nodemailer');
const {
  sendMail,
  sendContactNotification,
  sendPasswordReset
} = require('../../services/mail.service');

// Mock nodemailer
jest.mock('nodemailer');

describe('Mail Service', () => {
  let mockTransporter;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock environment variables
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASS = 'password123';
    process.env.MAIL_FROM = 'noreply@risingbsm.de';
    process.env.CONTACT_EMAIL = 'contact@risingbsm.de';

    // Mock transporter
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 Message accepted'
      })
    };

    nodemailer.createTransport.mockReturnValue(mockTransporter);
  });

  describe('sendMail', () => {
    test('sollte E-Mail erfolgreich versenden', async () => {
      const mailOptions = {
        to: 'test@example.com',
        subject: 'Test E-Mail',
        text: 'Dies ist eine Test-E-Mail',
        html: '<p>Dies ist eine Test-E-Mail</p>'
      };

      const result = await sendMail(mailOptions);

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: '587',
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password123'
        }
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@risingbsm.de',
        to: 'test@example.com',
        subject: 'Test E-Mail',
        text: 'Dies ist eine Test-E-Mail',
        html: '<p>Dies ist eine Test-E-Mail</p>'
      });

      expect(result).toEqual({
        messageId: 'test-message-id',
        response: '250 Message accepted'
      });
    });

    test('sollte Fehler beim E-Mail-Versand behandeln', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(
        new Error('SMTP-Verbindungsfehler')
      );

      const mailOptions = {
        to: 'test@example.com',
        subject: 'Test E-Mail',
        text: 'Dies ist eine Test-E-Mail'
      };

      await expect(sendMail(mailOptions)).rejects.toThrow(
        'E-Mail konnte nicht gesendet werden: SMTP-Verbindungsfehler'
      );
    });
  });

  describe('sendContactNotification', () => {
    test('sollte Kontaktformular-Benachrichtigung versenden', async () => {
      const contactData = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        telefon: '030 12345678',
        nachricht: 'Dies ist eine Testanfrage'
      };

      await sendContactNotification(contactData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'contact@risingbsm.de',
          subject: 'Neue Kontaktanfrage',
          text: expect.stringContaining('Max Mustermann'),
          text: expect.stringContaining('030 12345678'),
          html: expect.stringContaining('Max Mustermann'),
          html: expect.stringContaining('030 12345678')
        })
      );
    });

    test('sollte Kontaktformular ohne Telefonnummer verarbeiten', async () => {
      const contactData = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        nachricht: 'Dies ist eine Testanfrage'
      };

      await sendContactNotification(contactData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('Nicht angegeben'),
          html: expect.stringContaining('Nicht angegeben')
        })
      );
    });
  });

  describe('sendPasswordReset', () => {
    test('sollte Passwort-Reset-E-Mail versenden', async () => {
      const resetData = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        token: 'reset-token-123',
        baseUrl: 'https://risingbsm.de'
      };

      await sendPasswordReset(resetData);

      const expectedResetUrl = 'https://risingbsm.de/reset-password/reset-token-123';

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'max@example.com',
          subject: 'Passwort zurücksetzen - Rising BSM',
          text: expect.stringContaining(expectedResetUrl),
          html: expect.stringContaining(expectedResetUrl)
        })
      );
    });

    test('sollte HTML und Text-Version der E-Mail enthalten', async () => {
      const resetData = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        token: 'reset-token-123',
        baseUrl: 'https://risingbsm.de'
      };

      await sendPasswordReset(resetData);

      const mailCall = mockTransporter.sendMail.mock.calls[0][0];
      
      expect(mailCall.text).toContain('Sehr geehrte(r) Max Mustermann');
      expect(mailCall.text).toContain('24 Stunden gültig');
      expect(mailCall.html).toContain('<h2>Passwort zurücksetzen</h2>');
      expect(mailCall.html).toContain('style="background-color: #007bff;');
    });
  });
}); 